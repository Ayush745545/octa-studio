import { prisma } from "@/lib/prisma";
import { getPublishingProvider } from "./providers";

export async function publishPublication(publicationId: string) {
  const publication = await prisma.publication.findUnique({
    where: {
      id: publicationId,
    },
    include: {
      content: true,
      channel: true,
    },
  });

  if (!publication) {
    throw new Error("Publication not found.");
  }

  if (
    publication.status !== "QUEUED" &&
    publication.status !== "SCHEDULED"
  ) {
    throw new Error(
      `Publication cannot be published from ${publication.status}.`,
    );
  }

  if (!publication.content.body?.trim()) {
    throw new Error("Content must have a body.");
  }

  const provider = getPublishingProvider(
    publication.channel.platform,
  );

  const result = await provider.publish({
    title: publication.content.title,
    body: publication.content.body,
    platform: publication.channel.platform,
    accountName: publication.channel.accountName,
  });

  if (!result.success) {
    await prisma.publication.update({
      where: {
        id: publicationId,
      },
      data: {
        status: "FAILED",
        error: result.error ?? "Publishing failed.",
      },
    });

    return result;
  }

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.publication.update({
      where: {
        id: publicationId,
      },
      data: {
        status: "PUBLISHED",
        publishedAt: now,
        scheduledAt: null,
        externalId: result.externalId ?? null,
        error: null,
      },
    });

    await tx.content.update({
      where: {
        id: publication.contentId,
      },
      data: {
        status: "PUBLISHED",
        publishedAt: now,
        scheduledAt: null,
      },
    });
  });

  return result;
}
