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
 * Persists approved clips as real database records so they appear in the
 * media library (Media), calendar (Content) and publishing queue
 * (Publication). Nothing is auto-published — Publications are created with
 * SCHEDULED status and only fire when the user-connected channel's schedule
 * time arrives (handled by the existing LocalScheduler / publishing engine).
 */
export async function scheduleJob(input: ScheduleInput): Promise<ScheduleResult> {
  const job = await prisma.contentJob.findUnique({
    where: { id: input.jobId },
  });
  if (!job) throw new Error("Job not found.");
  if (
    job.status !== "READY_FOR_REVIEW" &&
    job.status !== "APPROVED" &&
    job.status !== "SCHEDULED"
  ) {
    throw new Error("Job must be approved before scheduling.");
  }

  const clips = await prisma.contentClip.findMany({
    where: { jobId: input.jobId, id: { in: input.clipIds } },
  });
  if (clips.length === 0) throw new Error("No clips selected.");

  // Build slots: use provided slots when manual, else AI-recommended plan.
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

  const channels = await prisma.publishingChannel.findMany({
    where: { connected: true },
    select: { id: true, platform: true },
  });

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
    // Already scheduled/processed clips are skipped (not failed) so that
    // re-scheduling a video that was partially scheduled before doesn't
    // report a false "failed for all" error.
    if (clip.status !== "READY") {
      continue;
    }
    const scheduledAt = new Date(slot.scheduledAt);
    if (Number.isNaN(scheduledAt.getTime())) {
      result.failed.push(slot.clipId);
      continue;
    }

    const hook = clip.hookAi ?? clip.hookOriginal ?? clip.title ?? "";
    const body = `${hook}\n\n${clip.caption ?? ""}\n\n${
      (clip.hashtags ?? []).map((t) => `#${t}`).join(" ")
    }`;

    const content = await prisma.content.create({
      data: {
        title: clip.title ?? "Untitled clip",
        body,
        status: "SCHEDULED",
        platform: slot.platform as string,
        scheduledAt,
        media: clip.generatedMediaId
          ? { connect: { id: clip.generatedMediaId } }
          : undefined,
      },
    });

    const matched = channels.filter(
      (ch) => ch.platform === slot.platform,
    );
    const publicationIds: string[] = [];
    for (const ch of matched) {
      const pub = await prisma.publication.create({
        data: {
          contentId: content.id,
          channelId: ch.id,
          status: "SCHEDULED",
          scheduledAt,
        },
      });
      publicationIds.push(pub.id);
    }

    await updateClip(clip.id, {
      status: "SCHEDULED",
      contentId: content.id,
    });

    result.contentCreated += 1;
    result.publicationsCreated += publicationIds.length;
  }

  await updateJob(input.jobId, {
    status: "SCHEDULED",
    scheduledCount: result.contentCreated,
  });

  return result;
}
