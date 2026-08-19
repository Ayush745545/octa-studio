import type {
  PublishInput,
  PublishResult,
  ProviderContext,
  PublishingProvider,
} from "../types";
import { prisma } from "@/lib/prisma";

const GRAPH = "https://graph.instagram.com/v21.0";

/*
 * Instagram fetches media URLs from its own servers, so local
 * /uploads/* paths must be expanded to the public APP_URL (ngrok /
 * production domain) before being handed to the Graph API.
 */
function toPublicUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  const base = process.env.APP_URL?.replace(/\/$/, "");
  if (!base) return url;
  return `${base}${url.startsWith("/") ? url : `/${url}`}`;
}

export const instagramProvider: PublishingProvider = {
  platform: "Instagram",

  async publish(
    input: PublishInput,
    context: ProviderContext,
  ): Promise<PublishResult> {
    try {
      const channel = await prisma.publishingChannel.findUnique({
        where: { id: context.channelId },
        select: { accessToken: true, externalId: true },
      });

      // Test-mode channel (connected without a Meta app) — simulate.
      if (!channel?.accessToken || !channel.externalId) {
        console.log("[Instagram] Simulated publish:", {
          platform: input.platform,
          title: input.title,
          channelId: context.channelId,
          accountName: context.accountName,
          media: input.media.map((media) => ({
            filename: media.filename,
            type: media.type,
            url: media.url,
          })),
        });

        return { success: true, externalId: `sim_${Date.now()}` };
      }

      const caption = (
        input.title && input.title !== input.body
          ? `${input.title}\n\n${input.body}`
          : input.body
      ).slice(0, 2200);

      /*
       * Instagram posts carry a single media object. Videos are published
       * as reels and take priority over images; with no media a caption-only
       * container is attempted. URLs are expanded to public form first —
       * Instagram fetches them itself.
       */
      const videoMedia = input.media.find((media) =>
        media.mimeType.toLowerCase().startsWith("video/"),
      );
      const imageMedia = input.media.find((media) =>
        media.mimeType.toLowerCase().startsWith("image/"),
      );

      const containerBody = new URLSearchParams({ caption });

      const publicVideoUrl = videoMedia
        ? toPublicUrl(videoMedia.url)
        : undefined;

      if (publicVideoUrl) {
        console.log("[Instagram] Public video URL:", publicVideoUrl);

        try {
          const probe = await fetch(publicVideoUrl, {
            method: "HEAD",
          });

          console.log("[Instagram] Public media probe:", {
            status: probe.status,
            contentType: probe.headers.get("content-type"),
            contentLength: probe.headers.get("content-length"),
            acceptRanges: probe.headers.get("accept-ranges"),
          });

          if (!probe.ok) {
            return {
              success: false,
              error: `Instagram media URL is not publicly reachable: HTTP ${probe.status}`,
            };
          }

          const contentType = probe.headers.get("content-type") ?? "";

          if (!contentType.toLowerCase().startsWith("video/")) {
            return {
              success: false,
              error: `Instagram media URL has invalid content type: ${contentType}`,
            };
          }
        } catch (error) {
          return {
            success: false,
            error: `Could not verify public Instagram media URL: ${
              error instanceof Error ? error.message : "unknown error"
            }`,
          };
        }

        containerBody.set("media_type", "REELS");
        containerBody.set("video_url", publicVideoUrl);
      } else if (imageMedia) {
        containerBody.set("image_url", toPublicUrl(imageMedia.url));
      }

      console.log("[Instagram] Creating media container:", {
        igUserId: channel.externalId,
        mediaKind: videoMedia ? "reel" : imageMedia ? "image" : "text",
      });

      const containerResponse = await fetch(
        `${GRAPH}/${channel.externalId}/media`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${channel.accessToken}`,
          },
          body: containerBody,
        },
      );

      const containerData = await containerResponse.json();

      if (!containerResponse.ok || !containerData.id) {
        console.error("[Instagram] Container creation failed:", containerData);

        return {
          success: false,
          error: `Instagram container creation failed: ${JSON.stringify(containerData)}`,
        };
      }

      /*
       * Instagram processes media asynchronously (it downloads and encodes
       * the image/video itself). Publishing before the container reaches
       * FINISHED fails with "Media ID is not available", so poll the
       * container status first.
       */
      let statusData: {
        status_code?: string;
        status?: string;
        error_message?: string;
      } = {};

      const maxAttempts = videoMedia ? 90 : 30;

      console.log("[Instagram] Waiting for media processing:", {
        containerId: containerData.id,
        maxAttempts,
        maxWaitSeconds: maxAttempts * 2,
      });

      let finished = false;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const statusResponse = await fetch(
          `${GRAPH}/${containerData.id}?fields=status_code,status`,
          {
            headers: {
              Authorization: `Bearer ${channel.accessToken}`,
            },
            cache: "no-store",
          },
        );

        const statusText = await statusResponse.text();

        try {
          statusData = JSON.parse(statusText);
        } catch {
          console.error("[Instagram] Invalid status response:", {
            httpStatus: statusResponse.status,
            body: statusText,
          });

          return {
            success: false,
            error: `Instagram returned invalid processing status: HTTP ${statusResponse.status}`,
          };
        }

        console.log("[Instagram] Processing status:", {
          attempt,
          httpStatus: statusResponse.status,
          statusCode: statusData.status_code,
          status: statusData.status,
          errorMessage: statusData.error_message,
        });

        if (!statusResponse.ok) {
          return {
            success: false,
            error: `Instagram status check failed: ${JSON.stringify(statusData)}`,
          };
        }

        const statusCode = statusData.status_code;

        if (statusCode === "FINISHED") {
          finished = true;
          break;
        }

        if (
          statusCode === "ERROR" ||
          statusCode === "EXPIRED"
        ) {
          console.error("[Instagram] Media processing failed:", statusData);

          return {
            success: false,
            error:
              `Instagram media processing ${statusCode}: ` +
              `${statusData.error_message || statusData.status || "Unknown error"}`,
          };
        }

        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      if (!finished) {
        console.error("[Instagram] Media processing timeout:", {
          containerId: containerData.id,
          lastStatus: statusData,
        });

        return {
          success: false,
          error:
            `Instagram media processing timed out after ${maxAttempts * 2}s. ` +
            `Last status: ${statusData.status_code ?? "UNKNOWN"}`,
        };
      }

      console.log("[Instagram] Media processing finished:", {
        containerId: containerData.id,
      });

      const publishResponse = await fetch(
        `${GRAPH}/${channel.externalId}/media_publish`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${channel.accessToken}`,
          },
          body: new URLSearchParams({ creation_id: containerData.id }),
        },
      );

      const publishData = await publishResponse.json();

      if (!publishResponse.ok || !publishData.id) {
        console.error("[Instagram] Publish failed:", publishData);

        return {
          success: false,
          error: `Instagram publish failed: ${JSON.stringify(publishData)}`,
        };
      }

      console.log("[Instagram] Post published:", {
        mediaId: publishData.id,
      });

      return { success: true, externalId: publishData.id };
    } catch (error) {
      console.error("[Instagram] Publishing exception:", error);

      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown Instagram publishing error.",
      };
    }
  },
};
