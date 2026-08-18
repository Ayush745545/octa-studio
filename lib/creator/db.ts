import path from "node:path";
import { readFile, unlink } from "node:fs/promises";

import { prisma } from "@/lib/prisma";

const UPLOADS_ROOT = path.join(process.cwd(), "public", "uploads");

/**
 * Unlink a file referenced by an app URL (e.g. "/uploads/foo.mp4").
 * Only removes files inside public/uploads to avoid traversal.
 */
export async function deleteUploadFile(url?: string | null): Promise<void> {
  if (!url) return;
  const rel = url.replace(/^\//, "");
  if (!rel.startsWith("uploads/")) return;
  const abs = path.join(process.cwd(), "public", rel);
  if (!abs.startsWith(UPLOADS_ROOT)) return;
  try {
    await unlink(abs);
  } catch {
    /* already gone or locked; ignore */
  }
}
import { PIPELINE_STEPS } from "@/lib/creator-studio/types";
import type {
  Clip,
  ClipScores,
  Job,
  PipelineStageKey,
  Project,
} from "@/lib/creator-studio/types";
import { STAGE_NAMES, toUiStageKey } from "./stages";

const UI_STEP_PROGRESS: Record<PipelineStageKey, number> = {
  "upload-processing": 5,
  "extract-audio": 10,
  transcribe: 25,
  "understand-video": 40,
  "detect-moments": 50,
  "detect-hooks": 55,
  "score-clips": 65,
  "build-plan": 60,
  render: 80,
  captions: 90,
  bundle: 92,
  "quality-check": 97,
  ready: 100,
  failed: 0,
};

const CLIP_STATUS_TO_UI: Record<string, Clip["status"]> = {
  PENDING: "draft",
  GENERATING: "generating",
  READY: "ready",
  APPROVED: "ready",
  SCHEDULED: "scheduled",
  FAILED: "failed",
  REJECTED: "rejected",
};

const JOB_STATUS_TO_UI: Record<string, Project["status"]> = {
  QUEUED: "analyzing",
  PROCESSING: "analyzing",
  READY_FOR_REVIEW: "analyzed",
  APPROVED: "analyzed",
  SCHEDULED: "analyzed",
  COMPLETED: "analyzed",
  FAILED: "failed",
  CANCELLED: "failed",
};

/* ------------------------------------------------------------------ */
/* Jobs                                                                */
/* ------------------------------------------------------------------ */

export async function getJob(id: string) {
  return prisma.contentJob.findUnique({ where: { id } });
}

export async function listJobs() {
  return prisma.contentJob.findMany({ orderBy: { createdAt: "desc" } });
}

export async function updateJob(
  id: string,
  data: Record<string, unknown>,
) {
  return prisma.contentJob.update({ where: { id }, data: data as never });
}

export async function ensureStages(jobId: string) {
  const count = await prisma.pipelineStage.count({ where: { jobId } });
  if (count === STAGE_NAMES.length) return;
  if (count > 0) {
    await prisma.pipelineStage.deleteMany({ where: { jobId } });
  }
  await prisma.pipelineStage.createMany({
    data: STAGE_NAMES.map((name) => ({ jobId, name })),
  });
}

export async function getStage(jobId: string, name: string) {
  return prisma.pipelineStage.findFirst({ where: { jobId, name } });
}

export async function setStage(
  jobId: string,
  name: string,
  data: Record<string, unknown>,
) {
  const existing = await getStage(jobId, name);
  if (existing) {
  return prisma.pipelineStage.update({
    where: { id: existing.id },
    data: data as never,
  });
  }
  return prisma.pipelineStage.create({
    data: { jobId, name, ...data } as never,
  });
}

/* ------------------------------------------------------------------ */
/* Clips                                                               */
/* ------------------------------------------------------------------ */

export async function createClip(
  jobId: string,
  data: Record<string, unknown>,
) {
  return prisma.contentClip.create({ data: { jobId, ...data } as never });
}

export async function updateClip(
  id: string,
  data: Record<string, unknown>,
) {
  return prisma.contentClip.update({ where: { id }, data: data as never });
}

export async function getClip(id: string) {
  return prisma.contentClip.findUnique({ where: { id } });
}

export async function listClips(jobId: string) {
  return prisma.contentClip.findMany({
    where: { jobId },
    orderBy: { index: "asc" },
  });
}

export async function deleteClipFiles(id: string): Promise<boolean> {
  const clip = await prisma.contentClip.findUnique({ where: { id } });
  if (!clip) return false;
  await deleteUploadFile(clip.videoUrl);
  await deleteUploadFile(clip.thumbnailUrl);
  if (clip.generatedMediaId) {
    const media = await prisma.media.findUnique({
      where: { id: clip.generatedMediaId },
    });
    if (media) {
      await deleteUploadFile(media.url);
      await prisma.media.delete({ where: { id: media.id } }).catch(() => {});
    }
  }
  await prisma.contentClip.delete({ where: { id } });
  return true;
}

export async function deleteProjectFiles(id: string): Promise<boolean> {
  const job = await prisma.contentJob.findUnique({
    where: { id },
    include: { clips: true },
  });
  if (!job) return false;

  for (const clip of job.clips) {
    await deleteUploadFile(clip.videoUrl);
    await deleteUploadFile(clip.thumbnailUrl);
    if (clip.generatedMediaId) {
      const media = await prisma.media.findUnique({
        where: { id: clip.generatedMediaId },
      });
      if (media) {
        await deleteUploadFile(media.url);
        await prisma.media.delete({ where: { id: media.id } }).catch(() => {});
      }
    }
  }

  if (job.sourceMediaId) {
    const media = await prisma.media.findUnique({
      where: { id: job.sourceMediaId },
    });
    if (media) {
      await deleteUploadFile(media.url);
      await prisma.media.delete({ where: { id: media.id } }).catch(() => {});
    }
  } else {
    await deleteUploadFile(job.sourceUrl);
  }

  await prisma.contentJob.delete({ where: { id } });
  return true;
}

/* ------------------------------------------------------------------ */
/* Bundles & assets                                                    */
/* ------------------------------------------------------------------ */

export async function createBundle(data: Record<string, unknown>) {
  return prisma.contentBundle.create({ data: data as never });
}

export async function updateBundle(id: string, data: Record<string, unknown>) {
  return prisma.contentBundle.update({ where: { id }, data: data as never });
}

export async function createAsset(data: Record<string, unknown>) {
  return prisma.generatedAsset.create({ data: data as never });
}

export async function getAsset(jobId: string, kind: string) {
  return prisma.generatedAsset.findFirst({
    where: { jobId, kind },
    orderBy: { createdAt: "desc" },
  });
}

export async function readAssetText(
  jobId: string,
  kind: string,
): Promise<string | null> {
  const asset = await getAsset(jobId, kind);
  if (!asset) return null;
  try {
    return await readFile(
      path.join(process.cwd(), "public", asset.url.replace(/^\//, "")),
      "utf8",
    );
  } catch {
    return null;
  }
}

export function jobWorkDir(jobId: string) {
  return path.join(
    process.cwd(),
    "public",
    "uploads",
    "creator",
    "jobs",
    jobId,
  );
}

/* ------------------------------------------------------------------ */
/* Mapping to UI types (the frontend contract is unchanged)            */
/* ------------------------------------------------------------------ */

export function toUiProject(job: {
  id: string;
  sourceFilename: string | null;
  sourceUrl: string | null;
  sourceDuration: number;
  sourceWidth: number;
  sourceHeight: number;
  sourceSize: number;
  thumbnailUrl: string | null;
  createdAt: Date;
  status: string;
  sourceMediaId: string | null;
  schedulePlan: unknown;
  scheduledCount: number;
}): Project {
  return {
    id: job.id,
    filename: job.sourceFilename ?? "video.mp4",
    url: job.sourceUrl ?? "",
    durationSec: job.sourceDuration,
    width: job.sourceWidth,
    height: job.sourceHeight,
    sizeBytes: job.sourceSize,
    thumbnailUrl: job.thumbnailUrl ?? undefined,
    createdAt: job.createdAt.toISOString(),
    status: JOB_STATUS_TO_UI[job.status] ?? "uploaded",
    jobId: job.id,
    sourceMediaId: job.sourceMediaId ?? undefined,
    schedulePlan: (job.schedulePlan as Project["schedulePlan"]) ?? undefined,
    scheduledCount: job.scheduledCount,
  };
}

export function toUiJob(
  job: {
    id: string;
    progress: number;
    currentStage: string | null;
    currentTask: string | null;
    status: string;
    error: string | null;
    errorMessage: string | null;
    createdAt: Date;
    updatedAt: Date;
  },
  _stages: unknown,
): Job {
  const progress = job.progress;
  const terminal = job.status === "FAILED" || job.status === "CANCELLED";
  const uiStage: PipelineStageKey =
    job.status === "READY_FOR_REVIEW" ||
    job.status === "APPROVED" ||
    job.status === "SCHEDULED" ||
    job.status === "COMPLETED"
      ? "ready"
      : job.status === "FAILED" || job.status === "CANCELLED"
        ? "failed"
        : toUiStageKey(job.currentStage);

  const steps = PIPELINE_STEPS.map((step) => {
    let status: "pending" | "running" | "done" | "failed" = "pending";
    if (terminal && step.key === uiStage) status = "failed";
    else if (progress >= UI_STEP_PROGRESS[step.key]) status = "done";
    else if (step.key === uiStage && !terminal) status = "running";
    return {
      key: step.key,
      label: step.label,
      status,
      detail:
        status === "failed"
          ? job.errorMessage ?? job.error ?? "Failed"
          : undefined,
    };
  });

  return {
    id: job.id,
    projectId: job.id,
    stage: uiStage,
    progress,
    currentTask: job.currentTask ?? "",
    steps,
    startedAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
    error: job.errorMessage ?? job.error ?? undefined,
    completedAt:
      job.status === "READY_FOR_REVIEW" || job.status === "COMPLETED"
        ? job.updatedAt.toISOString()
        : undefined,
  };
}

export function toUiClip(clip: {
  id: string;
  jobId: string;
  index: number;
  sourceStart: number;
  sourceEnd: number;
  durationSec: number;
  score: number;
  scores: unknown;
  category: string | null;
  title: string | null;
  transcript: string | null;
  hookOriginal: string | null;
  hookAi: string | null;
  hook: string | null;
  useAiHook: boolean;
  caption: string | null;
  captionStyle: string | null;
  hashtags: string[];
  platforms: string[];
  recommendedTime: string | null;
  status: string;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  error: string | null;
  contentId: string | null;
}): Clip {
  const scores = (clip.scores as ClipScores | null) ?? {
    hook: clip.score,
    engagement: clip.score,
    story: clip.score,
    educational: clip.score,
    viral: clip.score,
    overall: clip.score,
  };

  return {
    id: clip.id,
    projectId: clip.jobId,
    index: clip.index,
    startSec: clip.sourceStart,
    endSec: clip.sourceEnd,
    durationSec: clip.durationSec,
    category: (clip.category as Clip["category"]) ?? "Insight",
    title: clip.title ?? "",
    transcript: clip.transcript ?? "",
    hookOriginal: clip.hookOriginal ?? clip.hook ?? "",
    hookAi: clip.hookAi ?? clip.hook ?? "",
    useAiHook: clip.useAiHook,
    caption: clip.caption ?? "",
    captionStyle: (clip.captionStyle as Clip["captionStyle"]) ?? "Clean",
    hashtags: clip.hashtags ?? [],
    platforms: clip.platforms as Clip["platforms"],
    scores,
    recommendedTime: clip.recommendedTime ?? "7:30 PM",
    status: CLIP_STATUS_TO_UI[clip.status] ?? "draft",
    videoUrl: clip.videoUrl ?? undefined,
    thumbnailUrl: clip.thumbnailUrl ?? undefined,
    error: clip.error ?? undefined,
    contentId: clip.contentId ?? undefined,
  };
}
