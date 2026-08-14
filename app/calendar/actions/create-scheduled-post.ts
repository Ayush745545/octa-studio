"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

interface CreateScheduledPostInput {
  title: string;
  body: string;
  platform: string;
  channelPlatforms: string[];
  scheduledAt: string;
}

export async function createScheduledPost(input: CreateScheduledPostInput) {
  const platformsToSchedule =
    input.channelPlatforms && input.channelPlatforms.length > 0
      ? input.channelPlatforms
      : input.platform
        ? [input.platform]
        : [];

  if (platformsToSchedule.length === 0) {
    throw new Error("No platform selected.");
  }

  // Parse the scheduled date. The datetime-local input produces a local time
  // string like "2026-08-15T14:30" which new Date() interprets as local time.
  const scheduledDate = new Date(input.scheduledAt);

  if (Number.isNaN(scheduledDate.getTime())) {
    throw new Error("Invalid schedule date.");
  }

  if (scheduledDate <= new Date()) {
    throw new Error("Schedule time must be in the future.");
  }

  // Look up connected channels BEFORE creating content so we fail fast.
  const channels = await prisma.publishingChannel.findMany({
    where: {
      platform: { in: platformsToSchedule },
      connected: true,
    },
  });

  if (channels.length === 0) {
    throw new Error(
      "No connected channels found for the selected platforms. Connect your channel in Publishing settings first.",
    );
  }

  // Create everything in a single transaction so nothing is left
  // half-created if one step fails.
  const content = await prisma.$transaction(async (tx) => {
    const newContent = await tx.content.create({
      data: {
        title: input.title,
        body: input.body || null,
        platform: platformsToSchedule[0],
        status: "SCHEDULED",
        scheduledAt: scheduledDate,
      },
    });

    for (const channel of channels) {
      await tx.publication.create({
        data: {
          contentId: newContent.id,
          channelId: channel.id,
          status: "SCHEDULED",
          scheduledAt: scheduledDate,
        },
      });
    }

    return newContent;
  });

  revalidatePath("/");
  revalidatePath("/content");
  revalidatePath("/calendar");
  revalidatePath("/analytics");
  revalidatePath("/publishing");

  return content;
}
