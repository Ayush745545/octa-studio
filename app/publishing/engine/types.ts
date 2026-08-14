export interface PublishMedia {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  type: string;
}

export interface PublishInput {
  title: string;
  body: string;
  platform: string;
  accountName?: string | null;
  media: PublishMedia[];
}

export interface ProviderContext {
  channelId: string;
  platform: string;
  accountName?: string | null;
}

export interface PublishResult {
  success: boolean;
  externalId?: string;
  error?: string;
  executionTimeMs?: number;
}

export interface PublishingProvider {
  platform: string;
  publish(
    input: PublishInput,
    context: ProviderContext,
  ): Promise<PublishResult>;
}
