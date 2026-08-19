import { prisma } from "@/lib/prisma";
import { buildSchedulePlan } from "@/lib/creator-studio/content";
import type { Platform } from "@/lib/creator-studio/types";
import { updateClip, updateJob } from "./db";

export interface ScheduleInput {
  jobId: string;
  clipIds: string[];
  strategy?: "ai" | "manual";
  slots?: { clipId: string; platform: Platform; scheduledAt: string }[];
}

export interface ScheduleResult {
  contentCreated: number;
  publicationsCreated: number;
  failed: string[];
}

/**
 * Persist approved Creator Studio clips into Content + Publication.
 *
 * IMPORTANT:
 * Publishing channels are ALWAYS scoped to the owner of the ContentJob.
 * A user's Creator Studio job must never use another user's connected
 * Instagram / YouTube / TikTok / Facebook account.
 */
export async function scheduleJob(
  input: ScheduleInput,
): Promise<ScheduleResult> {
  const job = await prisma.contentJob.findUnique({
    where: { id: input.jobId },
  });

  if (!job) {
    throw new Error("Job not found.");
  }

  if (!job.userId) {
    throw new Error("Creator Studio job has no owner.");
  }

  if (
    job.status !== "READY_FOR_REVIEW" &&
    job.status !== "APPROVED" &&
    job.status !== "SCHEDULED"
  ) {
    throw new Error("Job must be approved before scheduling.");
  }

  const clips = await prisma.contentClip.findMany({
    where: {
      jobId: input.jobId,
      id: { in: input.clipIds },
    },
  });

  if (clips.length === 0) {
    throw new Error("No clips selected.");
  }

  // Build slots.
  let slots = input.slots;

  if (!slots || slots.length === 0) {
    const plan = buildSchedulePlan({
      clips: clips.map((c) => ({
        id: c.id,
        category: c.category ?? "Insight",
        overall: c.score,
        recommendedTime: c.recommendedTime ?? "7:30 PM",
        platforms: (c.platforms as Platform[]) ?? ["Instagram"],
      })),
      startDate: new Date(),
    });

    slots = plan.slots.map((s) => ({
      clipId: s.clipId,
      platform: s.platform,
      scheduledAt: s.scheduledAt,
    }));
  }

  /*
   * CRITICAL FIX:
   *
   * Only load channels belonging to THIS Creator Studio job's user.
   *
   * Before:
   *   where: { connected: true }
   *
   * That could select another user's connected Instagram/YouTube/etc.
   */
  const channels = await prisma.publishingChannel.findMany({
    where: {
      connected: true,
      userId: job.userId,
    },
    select: {
      id: true,
      platform: true,
      accountName: true,
    },
  });

  const connectedPlatforms = new Set(
    channels.map((channel) => channel.platform),
  );

  const result: ScheduleResult = {
    contentCreated: 0,
    publicationsCreated: 0,
    failed: [],
  };

  for (const slot of slots) {
    const clip = clips.find((c) => c.id === slot.clipId);

    if (!clip) {
      result.failed.push(slot.clipId);
      continue;
    }

    // Already scheduled/processed.
    if (clip.status !== "READY") {
      continue;
    }

    const scheduledAt = new Date(slot.scheduledAt);

    if (Number.isNaN(scheduledAt.getTime())) {
      result.failed.push(slot.clipId);
      continue;
    }

    /*
     * Do not create a publication for a platform that the current
     * Creator Studio user has not connected.
     */
    const matchedChannels = channels.filter(
      (channel) => channel.platform === slot.platform,
    );

    if (matchedChannels.length === 0) {
      console.warn("[CreatorStudio] Platform not connected:", {
        userId: job.userId,
        platform: slot.platform,
        connectedPlatforms: [...connectedPlatforms],
      });

      result.failed.push(
        `${clip.id}:${slot.platform}:platform-not-connected`,
      );

      continue;
    }

    const hook =
      clip.hookAi ??
      clip.hookOriginal ??
      clip.title ??
      "";

    const body = `${hook}\n\n${clip.caption ?? ""}\n\n${
      (clip.hashtags ?? []).map((tag) => `#${tag}`).join(" ")
    }`;

    const content = await prisma.content.create({
      data: {
        title: clip.title ?? "Untitled clip",
        body,
        status: "SCHEDULED",
        platform: slot.platform as string,
        scheduledAt,
        media: clip.generatedMediaId
          ? {
              connect: {
                id: clip.generatedMediaId,
              },
            }
          : undefined,
      },
    });

    const publicationIds: string[] = [];

    /*
     * Because channels are already scoped to job.userId,
     * publications can only target this user's accounts.
     */
    for (const channel of matchedChannels) {
      const publication = await prisma.publication.create({
        data: {
          contentId: content.id,
          channelId: channel.id,
          status: "SCHEDULED",
          scheduledAt,
        },
      });

      publicationIds.push(publication.id);
    }

    await updateClip(clip.id, {
      status: "SCHEDULED",
      contentId: content.id,
    });

    result.contentCreated += 1;
    result.publicationsCreated += publicationIds.length;

    console.log("[CreatorStudio] Scheduled:", {
      userId: job.userId,
      clipId: clip.id,
      platform: slot.platform,
      channels: matchedChannels.map((channel) => ({
        id: channel.id,
        accountName: channel.accountName,
      })),
      scheduledAt: scheduledAt.toISOString(),
    });
  }

  await updateJob(input.jobId, {
    status: "SCHEDULED",
    scheduledCount: result.contentCreated,
  });

  return result;
}
