export interface PublishInput {
  title: string;
  body: string;
  platform: string;
}

export interface PublishResult {
  success: boolean;
  externalId?: string;
  error?: string;
}

export interface PublishingProvider {
  platform: string;
  publish(input: PublishInput): Promise<PublishResult>;
}
