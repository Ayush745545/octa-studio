import type {
  PublishInput,
  PublishResult,
  ProviderContext,
  PublishingProvider,
} from "../types";

export const simulatedProvider: PublishingProvider = {
  platform: "SIMULATED",

  async publish(
    input: PublishInput,
    context: ProviderContext,
  ): Promise<PublishResult> {
    console.log("[ContentOS] Simulated publish:", {
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

    return {
      success: true,
      externalId: `sim_${Date.now()}`,
    };
  },
};
