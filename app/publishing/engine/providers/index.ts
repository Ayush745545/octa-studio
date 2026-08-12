import type { PublishingProvider } from "../types";
import { simulatedProvider } from "./simulated";

const providers: Record<string, PublishingProvider> = {
  SIMULATED: simulatedProvider,
};

export function getPublishingProvider(
  platform: string,
): PublishingProvider {
  return providers[platform] ?? simulatedProvider;
}
