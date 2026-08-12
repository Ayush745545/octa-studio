import type { PublishingProvider } from "../types";
import { simulatedProvider } from "./simulated";

const providers: Record<string, PublishingProvider> = {
  SIMULATED: simulatedProvider,
};

export function getPublishingProvider(platform: string): PublishingProvider {
  const provider = providers[platform];

  if (!provider) {
    throw new Error(
      `No publishing provider configured for platform "${platform}".`,
    );
  }

  return provider;
}
