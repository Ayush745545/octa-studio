"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { schedulePublication } from "@/app/publishing/actions/schedule-publication";

interface CreateScheduledPostInput {
  title: string;
  body: string;
  platform: string;
  channelPlatforms: string[];
  scheduledAt: string;
}

export async function createScheduledPost(input: CreateScheduledPostInput) {
  // Determine if it's using old single platform or new multi platform structure
  const platformsToSchedule = input.channelPlatforms && input.channelPlatforms.length > 0 
    ? input.channelPlatforms 
    : (input.platform ? [input.platform] : []);

  if (platformsToSchedule.length === 0) {
    throw new Error("No platform selected.");
  }

  const content = await prisma.content.create({
    data: {
      title: input.title,
      body: input.body || null,
      platform: platformsToSchedule[0], // primary platform
      status: "SCHEDULED",
      scheduledAt: new Date(input.scheduledAt),
    },
  });

  const channels = await prisma.publishingChannel.findMany({
    where: { 
      platform: { in: platformsToSchedule },
      connected: true 
    },
  });

  if (channels.length === 0) {
    throw new Error("No connected channels found for selected platforms.");
  }

  for (const channel of channels) {
    const publication = await prisma.publication.create({
      data: {
        contentId: content.id,
        channelId: channel.id,
        status: "QUEUED",
        scheduledAt: new Date(input.scheduledAt),
      },
    });

    await schedulePublication(publication.id, input.scheduledAt);
  }

  revalidatePath("/");
  revalidatePath("/content");
  revalidatePath("/calendar");
  revalidatePath("/analytics");
  revalidatePath("/publishing");

  return content;
}
