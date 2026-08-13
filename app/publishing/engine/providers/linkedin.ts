import type {
  PublishInput,
  PublishResult,
  ProviderContext,
  PublishingProvider,
} from "../types";
import { prisma } from "@/lib/prisma";

const LINKEDIN_POSTS_API = "https:" + "//api.linkedin.com/rest/posts";
const LINKEDIN_IMAGES_API = "https:" + "//api.linkedin.com/rest/images?action=initializeUpload";
const LINKEDIN_VERSION = "202601";



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
   * ContentOS stores uploaded media as /uploads/filename.
   *
   * LinkedIn cannot fetch a localhost URL directly, so we download the
   * image from ContentOS and then upload the binary to LinkedIn.
   */
  const appUrl = process.env.APP_URL;

  if (!appUrl) {
    throw new Error("APP_URL is not configured.");
  }

  const imageUrl = new URL(media.url, appUrl).toString();

  console.log("[LinkedIn] Downloading ContentOS image:", imageUrl);

  const imageResponse = await fetch(imageUrl);

  if (!imageResponse.ok) {
    throw new Error(
      `Could not download image from ContentOS: ${imageResponse.status} ${imageResponse.statusText}`,
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
  } catch {
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
       * LinkedIn image posts currently use a single media object.
       *
       * ContentOS may contain multiple media records, so for this first
       * implementation we publish the first image.
       */
      const imageMedia = input.media.find((media) =>
        media.mimeType.toLowerCase().startsWith("image/"),
      );

      let imageUrn: string | undefined;

      if (imageMedia) {
        imageUrn = await uploadImageToLinkedIn(
          channel.accessToken,
          channel.authorUrn,
          {
            url: imageMedia.url,
            filename: imageMedia.filename,
            mimeType: imageMedia.mimeType,
          },
        );
      }

      /*
       * Step 3:
       * Create the actual LinkedIn post.
       */
      const postBody: Record<string, unknown> = {
        author: channel.authorUrn,
        commentary: input.body,
        visibility: "PUBLIC",
        distribution: {
          feedDistribution: "MAIN_FEED",
          targetEntities: [],
          thirdPartyDistributionChannels: [],
        },
        lifecycleState: "PUBLISHED",
        isReshareDisabledByAuthor: false,
      };

      if (imageUrn) {
        postBody.content = {
          media: {
            id: imageUrn,
            altText: input.title || "ContentOS post image",
          },
        };
      }

      console.log("[LinkedIn] Creating post:", {
        author: channel.authorUrn,
        hasImage: Boolean(imageUrn),
        imageUrn: imageUrn ?? null,
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
        hasImage: Boolean(imageUrn),
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
