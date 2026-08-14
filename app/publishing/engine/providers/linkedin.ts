import type {
  PublishInput,
  PublishResult,
  ProviderContext,
  PublishingProvider,
} from "../types";
import { prisma } from "@/lib/prisma";

const LINKEDIN_POSTS_API = "https:" + "//api.linkedin.com/rest/posts";
const LINKEDIN_IMAGES_API = "https:" + "//api.linkedin.com/rest/images?action=initializeUpload";
const LINKEDIN_VIDEOS_API = "https:" + "//api.linkedin.com/rest/videos?action=initializeUpload";
const LINKEDIN_VERSION = "202601";

// LinkedIn switches video uploads to multipart above this size.
const LINKEDIN_MULTIPART_THRESHOLD = 64 * 1024 * 1024;



function linkedinHeaders(accessToken: string) {
  return {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
    "X-Restli-Protocol-Version": "2.0.0",
    "Linkedin-Version": LINKEDIN_VERSION,
  };
}

async function uploadImageToLinkedIn(
  accessToken: string,
  authorUrn: string,
  media: {
    url: string;
    filename: string;
    mimeType: string;
  },
) {
  /*
   * octa-studio stores uploaded media as /uploads/filename.
   *
   * LinkedIn cannot fetch a localhost URL directly, so we download the
   * image from octa-studio and then upload the binary to LinkedIn.
   */
  const appUrl = process.env.APP_URL;

  if (!appUrl) {
    throw new Error("APP_URL is not configured.");
  }

  const imageUrl = new URL(media.url, appUrl).toString();

  console.log("[LinkedIn] Downloading octa-studio image:", imageUrl);

  const imageResponse = await fetch(imageUrl);

  if (!imageResponse.ok) {
    throw new Error(
      `Could not download image from octa-studio: ${imageResponse.status} ${imageResponse.statusText}`,
    );
  }

  const imageBuffer = await imageResponse.arrayBuffer();

  if (imageBuffer.byteLength === 0) {
    throw new Error("The image file is empty.");
  }

  /*
   * Step 1:
   * Ask LinkedIn for an image upload URL.
   */
  const initializeResponse = await fetch(LINKEDIN_IMAGES_API, {
    method: "POST",
    headers: linkedinHeaders(accessToken),
    body: JSON.stringify({
      initializeUploadRequest: {
        owner: authorUrn,
      },
    }),
  });

  const initializeText = await initializeResponse.text();

  if (!initializeResponse.ok) {
    throw new Error(
      `LinkedIn image initialization failed (${initializeResponse.status}): ${initializeText}`,
    );
  }

  let initializeData: {
    value?: {
      uploadUrl?: string;
      image?: string;
    };
  };

  try {
    initializeData = JSON.parse(initializeText);
  } catch (_) {
    throw new Error(
      `LinkedIn returned invalid image initialization JSON: ${initializeText}`,
    );
  }

  const uploadUrl = initializeData.value?.uploadUrl;
  const imageUrn = initializeData.value?.image;

  if (!uploadUrl || !imageUrn) {
    throw new Error(
      `LinkedIn image initialization did not return uploadUrl/image: ${initializeText}`,
    );
  }

  console.log("[LinkedIn] Image upload initialized:", {
    imageUrn,
    filename: media.filename,
  });

  /*
   * Step 2:
   * Upload the actual binary image to LinkedIn.
   *
   * The upload URL comes directly from LinkedIn.
   */
  const uploadResponse = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": media.mimeType || "application/octet-stream",
    },
    body: imageBuffer,
  });

  const uploadText = await uploadResponse.text();

  if (!uploadResponse.ok) {
    throw new Error(
      `LinkedIn image upload failed (${uploadResponse.status}): ${uploadText}`,
    );
  }

  console.log("[LinkedIn] Image uploaded successfully:", imageUrn);

  return imageUrn;
}

async function uploadVideoToLinkedIn(
  accessToken: string,
  authorUrn: string,
  media: {
    url: string;
    filename: string;
    mimeType: string;
  },
) {
  /*
   * Same pattern as images: octa-studio stores uploads at /uploads/*,
   * which LinkedIn cannot fetch directly, so we download the video
   * locally first and then upload the binary to LinkedIn.
   */
  const appUrl = process.env.APP_URL;

  if (!appUrl) {
    throw new Error("APP_URL is not configured.");
  }

  const videoUrl = new URL(media.url, appUrl).toString();

  console.log("[LinkedIn] Downloading octa-studio video:", videoUrl);

  const videoResponse = await fetch(videoUrl);

  if (!videoResponse.ok) {
    throw new Error(
      `Could not download video from octa-studio: ${videoResponse.status} ${videoResponse.statusText}`,
    );
  }

  const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());

  if (videoBuffer.byteLength === 0) {
    throw new Error("The video file is empty.");
  }

  /*
   * Step 1:
   * Initialize the video upload. LinkedIn returns a single upload URL for
   * small files and a list of part URLs above the multipart threshold.
   */
  const initializeResponse = await fetch(LINKEDIN_VIDEOS_API, {
    method: "POST",
    headers: linkedinHeaders(accessToken),
    body: JSON.stringify({
      initializeUploadRequest: {
        owner: authorUrn,
        fileSizeBytes: videoBuffer.byteLength,
      },
    }),
  });

  const initializeText = await initializeResponse.text();

  if (!initializeResponse.ok) {
    throw new Error(
      `LinkedIn video initialization failed (${initializeResponse.status}): ${initializeText}`,
    );
  }

  let initializeData: {
    value?: {
      uploadUrl?: string;
      uploadUrls?: Array<{ url?: string }>;
      video?: string;
      uploadToken?: string;
    };
  };

  try {
    initializeData = JSON.parse(initializeText);
  } catch (_) {
    throw new Error(
      `LinkedIn returned invalid video initialization JSON: ${initializeText}`,
    );
  }

  const videoUrn = initializeData.value?.video;
  const uploadToken = initializeData.value?.uploadToken;

  if (!videoUrn || !uploadToken) {
    throw new Error(
      `LinkedIn video initialization did not return video/uploadToken: ${initializeText}`,
    );
  }

  console.log("[LinkedIn] Video upload initialized:", {
    videoUrn,
    filename: media.filename,
    sizeBytes: videoBuffer.byteLength,
  });

  /*
   * Step 2:
   * Upload the binary. Single PUT for small files, one PUT per part
   * for files above the multipart threshold.
   */
  const partUrls =
    initializeData.value?.uploadUrls
      ?.map((part) => part.url)
      .filter((url): url is string => Boolean(url)) ?? [];

  if (
    videoBuffer.byteLength <= LINKEDIN_MULTIPART_THRESHOLD &&
    initializeData.value?.uploadUrl
  ) {
    const uploadResponse = await fetch(initializeData.value.uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": media.mimeType || "application/octet-stream",
      },
      body: new Uint8Array(videoBuffer),
    });

    const uploadText = await uploadResponse.text();

    if (!uploadResponse.ok) {
      throw new Error(
        `LinkedIn video upload failed (${uploadResponse.status}): ${uploadText}`,
      );
    }
  } else if (partUrls.length > 0) {
    // LinkedIn's first part carries everything except the final part,
    // whose size equals the remainder.
    const partSize =
      partUrls.length > 1
        ? Math.ceil(
            videoBuffer.byteLength / partUrls.length,
          )
        : videoBuffer.byteLength;

    for (let index = 0; index < partUrls.length; index++) {
      const start = index * partSize;
      const end = Math.min(start + partSize, videoBuffer.byteLength);
      const part = new Uint8Array(videoBuffer.subarray(start, end));

      const partResponse = await fetch(partUrls[index], {
        method: "PUT",
        headers: {
          "Content-Type": media.mimeType || "application/octet-stream",
        },
        body: part,
      });

      if (!partResponse.ok) {
        const partText = await partResponse.text();
        throw new Error(
          `LinkedIn video part ${index + 1} upload failed (${partResponse.status}): ${partText}`,
        );
      }
    }
  } else {
    throw new Error(
      `LinkedIn video initialization did not return upload URLs: ${initializeText}`,
    );
  }

  console.log("[LinkedIn] Video binary uploaded:", videoUrn);

  /*
   * Step 3:
   * Finalize the upload so LinkedIn starts processing the video.
   */
  const finalizeResponse = await fetch(
    "https://api.linkedin.com/rest/videos?action=finalizeUpload",
    {
      method: "POST",
      headers: linkedinHeaders(accessToken),
      body: JSON.stringify({
        finalizeUploadRequest: {
          video: videoUrn,
          uploadToken,
        },
      }),
    },
  );

  const finalizeText = await finalizeResponse.text();

  if (!finalizeResponse.ok) {
    throw new Error(
      `LinkedIn video finalization failed (${finalizeResponse.status}): ${finalizeText}`,
    );
  }

  /*
   * Step 4:
   * Wait until LinkedIn finishes processing the video. Publishing a post
   * with a video that is still processing fails, so poll briefly.
   */
  const videoId = encodeURIComponent(videoUrn.replace(/^urn:li:video:/, ""));

  for (let attempt = 0; attempt < 20; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const statusResponse = await fetch(
      `https://api.linkedin.com/rest/videos/${videoId}?viewContext=PLAYABLE`,
      { headers: linkedinHeaders(accessToken) },
    );

    if (!statusResponse.ok) continue;

    const statusData: { status?: string; isPlayable?: boolean } =
      await statusResponse.json().catch(() => ({}));

    if (statusData.status === "AVAILABLE" && statusData.isPlayable) {
      console.log("[LinkedIn] Video is ready to post:", videoUrn);
      return videoUrn;
    }
  }

  // Processing can take longer than the polling window; the post is
  // created as a DRAFT which LinkedIn publishes once the video is ready.
  console.log(
    "[LinkedIn] Video still processing after polling; posting as draft.",
  );

  return videoUrn;
}

export const linkedinProvider: PublishingProvider = {
  platform: "LinkedIn",

  async publish(
    input: PublishInput,
    context: ProviderContext,
  ): Promise<PublishResult> {
    try {
      const channel = await prisma.publishingChannel.findUnique({
        where: {
          id: context.channelId,
        },
        select: {
          accessToken: true,
          authorUrn: true,
          expiresAt: true,
        },
      });

      if (!channel?.accessToken) {
        return {
          success: false,
          error: "LinkedIn access token is missing.",
        };
      }

      if (channel.expiresAt && channel.expiresAt <= new Date()) {
        return {
          success: false,
          error: "LinkedIn access token has expired. Reconnect LinkedIn.",
        };
      }

      if (!channel.authorUrn) {
        return {
          success: false,
          error:
            "LinkedIn author URN is missing. Connect LinkedIn again after enabling the required profile permission.",
        };
      }

      /*
       * LinkedIn posts carry a single media object. Videos take priority
       * over images; otherwise the first image is published.
       */
      const videoMedia = input.media.find((media) =>
        media.mimeType.toLowerCase().startsWith("video/"),
      );
      const imageMedia = input.media.find((media) =>
        media.mimeType.toLowerCase().startsWith("image/"),
      );

      let mediaUrn: string | undefined;
      let mediaKind: "image" | "video" | undefined;

      /*
       * Media upload is best-effort: if it fails, the text post is
       * still published instead of failing the whole publish.
       */
      try {
        if (videoMedia) {
          mediaUrn = await uploadVideoToLinkedIn(
            channel.accessToken,
            channel.authorUrn,
            {
              url: videoMedia.url,
              filename: videoMedia.filename,
              mimeType: videoMedia.mimeType,
            },
          );
          mediaKind = "video";
        } else if (imageMedia) {
          mediaUrn = await uploadImageToLinkedIn(
            channel.accessToken,
            channel.authorUrn,
            {
              url: imageMedia.url,
              filename: imageMedia.filename,
              mimeType: imageMedia.mimeType,
            },
          );
          mediaKind = "image";
        }
      } catch (mediaError) {
        console.error(
          "[LinkedIn] Media upload failed; publishing text-only post:",
          mediaError,
        );
      }

      /*
       * Step 3:
       * Create the actual LinkedIn post. Video posts must start as DRAFT —
       * LinkedIn publishes them automatically once processing finishes.
       */
      const commentary = input.title && input.title !== input.body
        ? `${input.title}\n\n${input.body}`
        : input.body;

      const postBody: Record<string, unknown> = {
        author: channel.authorUrn,
        commentary,
        visibility: "PUBLIC",
        distribution: {
          feedDistribution: "MAIN_FEED",
          targetEntities: [],
          thirdPartyDistributionChannels: [],
        },
        lifecycleState: mediaKind === "video" ? "DRAFT" : "PUBLISHED",
        isReshareDisabledByAuthor: false,
      };

      if (mediaUrn) {
        postBody.content = {
          media: {
            id: mediaUrn,
            altText: input.title || "octa-studio post media",
          },
        };
      }

      console.log("[LinkedIn] Creating post:", {
        author: channel.authorUrn,
        mediaKind: mediaKind ?? null,
        mediaUrn: mediaUrn ?? null,
      });

      const response = await fetch(LINKEDIN_POSTS_API, {
        method: "POST",
        headers: linkedinHeaders(channel.accessToken),
        body: JSON.stringify(postBody),
      });

      const responseText = await response.text();

      if (!response.ok) {
        console.error("[LinkedIn] Publish failed:", {
          status: response.status,
          body: responseText,
        });

        return {
          success: false,
          error: `LinkedIn API returned ${response.status}: ${responseText}`,
        };
      }

      const externalId =
        response.headers.get("x-restli-id") ??
        response.headers.get("X-RestLi-Id");

      console.log("[LinkedIn] Post published:", {
        externalId,
        mediaKind: mediaKind ?? null,
      });

      return {
        success: true,
        externalId: externalId ?? undefined,
      };
    } catch (error) {
      console.error("[LinkedIn] Publishing exception:", error);

      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown LinkedIn publishing error.",
      };
    }
  },
};
