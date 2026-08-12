import type {
  PublishInput,
  PublishResult,
  PublishingProvider,
} from "../types";

export const simulatedProvider: PublishingProvider = {
  platform: "SIMULATED",

  async publish(input: PublishInput): Promise<PublishResult> {
    console.log("[ContentOS] Simulated publish:", {
      platform: input.platform,
      title: input.title,
    });

    return {
      success: true,
      externalId: `sim_${Date.now()}`,
    };
  },
};
