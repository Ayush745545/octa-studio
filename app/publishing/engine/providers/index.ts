import type { PublishingProvider } from "../types";
import { instagramProvider } from "./instagram";
import { linkedinProvider } from "./linkedin";
import { simulatedProvider } from "./simulated";

const providers: Record<string, PublishingProvider> = {
  SIMULATED: simulatedProvider,
  LinkedIn: linkedinProvider,
  Instagram: instagramProvider,
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
