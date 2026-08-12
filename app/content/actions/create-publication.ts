"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function createPublication(
  contentId: string,
  channelId: string,
) {
  const content = await prisma.content.findUnique({
    where: { id: contentId },
  });

  if (!content) {
    throw new Error("Content not found.");
  }

  if (content.status === "PUBLISHED") {
    throw new Error("Published content cannot be queued.");
  }

  const channel = await prisma.publishingChannel.findUnique({
    where: { id: channelId },
  });

  if (!channel || !channel.connected) {
    throw new Error("Publishing channel is not connected.");
  }

  await prisma.publication.upsert({
    where: {
      contentId_channelId: {
        contentId,
        channelId,
      },
    },
    update: {
      status: "QUEUED",
      error: null,
    },
    create: {
      contentId,
      channelId,
      status: "QUEUED",
    },
  });

  revalidatePath(`/content/${contentId}`);
  revalidatePath("/publishing");
}
