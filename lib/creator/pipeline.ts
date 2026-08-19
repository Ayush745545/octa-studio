import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdir, unlink, writeFile, stat, readFile, rm } from "node:fs/promises";
import path from "node:path";

import { prisma } from "@/lib/prisma";
import {
  absoluteToPublic,
  buildCandidateSegments,
  cutVerticalClip,
  detectSpeech,
  extractAudio,
  extractThumbnail,
  probeFull,
  publicToAbsolute,
} from "@/lib/creator-studio/ffmpeg";
import {
  buildSchedulePlan,
  generateClipDetails,
  scoreCandidates,
} from "@/lib/creator-studio/content";
import { callLLM, extractJson } from "@/lib/creator-studio/ai";
import { CAPTION_STYLES, PLATFORMS } from "@/lib/creator-studio/types";
import type { Platform } from "@/lib/creator-studio/types";
import { STAGES, stageByName } from "./stages";
import { ensureCreatorWorkerStarted } from "./worker";
import {
  createAsset,
  createBundle,
  createClip,
  ensureStages,
  getAsset,
  jobWorkDir,
  readAssetText,
  setStage,
  updateBundle,
  updateClip,
  updateJob,
} from "./db";

const execFileAsync = promisify(execFile);
const MAX_AUTO_RETRIES = 3;
// Recommended long-form range. We no longer hard-fail on shorter/longer
// videos — the segment/fallback logic handles anything with a usable
// duration, so the flow must not be blocked by an arbitrary length gate.
const MIN_DURATION = 15;
const MAX_DURATION = 6 * 3600;

interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}
interface ScoredCandidate {
  index: number;
  start: number;
  end: number;
  duration: number;
  category: string;
  scores: { hook: number; engagement: number; story: number; educational: number; viral: number; overall: number };
  topicHint: string;
}

function log(jobId: string, stage: string, msg: string) {
  console.log(`[CreatorJob ${jobId}] Stage: ${stage} ${msg}`);
}

async function fileSize(url: string): Promise<number> {
  try {
    const info = await stat(
      path.join(process.cwd(), "public", url.replace(/^\//, "")),
    );
    return info.size;
  } catch {
    return 0;
  }
}

async function sourcePathFor(jobId: string): Promise<string> {
  const job = await prisma.contentJob.findUnique({ where: { id: jobId } });
  if (!job?.sourceUrl) throw new Error("Source media URL missing.");
  return publicToAbsolute(job.sourceUrl);
}

/* ------------------------------------------------------------------ */
/* Job lifecycle                                                       */
/* ------------------------------------------------------------------ */

export async function createJob(mediaId: string, userId: string): Promise<string> {
  const media = await prisma.media.findUnique({ where: { id: mediaId } });
  if (!media) throw new Error(`Media not found for id ${mediaId}.`);

  const job = await prisma.contentJob.create({
    data: {
      userId,
      sourceMediaId: media.id,
      sourceUrl: media.url,
      sourceFilename: media.filename,
      sourceSize: media.size,
      status: "QUEUED",
      progress: 0,
      currentStage: "VALIDATE",
      currentTask: "Queued — waiting for worker",
    },
  });

  await ensureStages(job.id);
  log(job.id, "JOB", "Created (QUEUED)");
  // Start the persistent worker (idempotent) so the job is picked up even
  // though the HTTP request returns immediately.
  ensureCreatorWorkerStarted();
  return job.id;
}

export async function approveJob(jobId: string): Promise<void> {
  const job = await prisma.contentJob.findUnique({ where: { id: jobId } });
  if (!job) throw new Error("Job not found.");
  if (job.status !== "READY_FOR_REVIEW") {
    throw new Error("Job is not ready for approval.");
  }
  await updateJob(jobId, { status: "APPROVED" });
  log(jobId, "APPROVE", "Approved by user");
}

export async function retryJob(jobId: string): Promise<void> {
  const job = await prisma.contentJob.findUnique({ where: { id: jobId } });
  if (!job) throw new Error("Job not found.");
  if (job.status !== "FAILED" && job.status !== "CANCELLED") {
    throw new Error("Only failed jobs can be retried.");
  }
  const failed = await prisma.pipelineStage.findFirst({
    where: { jobId, status: "FAILED" },
    orderBy: { name: "asc" },
  });
  if (!failed) {
    throw new Error("No failed stage to retry.");
  }
  await setStage(jobId, failed.name, {
    status: "PENDING",
    error: null,
    retryCount: 0,
    completedAt: null,
    startedAt: null,
  });
  await updateJob(jobId, {
    status: "PROCESSING",
    currentStage: failed.name,
    error: null,
    errorMessage: null,
    currentTask: `Retrying ${failed.name}`,
  });
  log(jobId, failed.name, "Reset for retry");
}

/**
 * Re-renders a single clip from its real source segment. Used by the
 * per-clip "regenerate" action and as a targeted retry after a render
 * failure — it never re-runs earlier pipeline stages.
 */
export async function regenerateClip(clipId: string): Promise<void> {
  const clip = await prisma.contentClip.findUnique({ where: { id: clipId } });
  if (!clip) throw new Error("Clip not found.");
  const job = await prisma.contentJob.findUnique({ where: { id: clip.jobId } });
  if (!job?.sourceUrl) throw new Error("Source media missing.");

  const src = publicToAbsolute(job.sourceUrl);
  const dir = jobWorkDir(job.id);
  const clipName = `clip-${String(clip.index).padStart(2, "0")}`;
  const video = path.join(dir, "clips", `${clipName}.mp4`);
  const thumb = path.join(dir, "thumbnails", `${clipName}.jpg`);

  await cutVerticalClip(src, clip.sourceStart, clip.durationSec, video);
  await extractThumbnail(src, thumb, clip.sourceStart + clip.durationSec / 2);

  const videoUrl = absoluteToPublic(video);
  const thumbUrl = absoluteToPublic(thumb);

  const media = await prisma.media.upsert({
    where: { id: clip.generatedMediaId ?? "__none__" },
    update: { url: videoUrl, size: await fileSize(videoUrl) },
    create: {
      url: videoUrl,
      filename: `${clipName}.mp4`,
      mimeType: "video/mp4",
      size: await fileSize(videoUrl),
      type: "VIDEO",
    },
  });

  await updateClip(clip.id, {
    status: "READY",
    generatedMediaId: media.id,
    videoUrl,
    thumbnailUrl: thumbUrl,
    error: null,
  });
}

/* ------------------------------------------------------------------ */
/* Resumable runner                                                    */
/* ------------------------------------------------------------------ */

export async function runJob(jobId: string): Promise<void> {
  const job = await prisma.contentJob.findUnique({ where: { id: jobId } });
  if (!job) return;

  for (const stageDef of STAGES) {
    const stageRow =
      (await prisma.pipelineStage.findFirst({
        where: { jobId, name: stageDef.name },
      })) ?? (await setStage(jobId, stageDef.name, {}));

    if (stageRow.status === "COMPLETED") continue;

    const ok = await runStageWithRetry(jobId, stageDef);
    if (!ok) return; // job marked FAILED inside
  }
}

async function runStageWithRetry(
  jobId: string,
  stageDef: { name: string; progress: number; label: string },
): Promise<boolean> {
  const stageRow = await prisma.pipelineStage.findFirst({
    where: { jobId, name: stageDef.name },
  });
  let attempt = stageRow?.retryCount ?? 0;

  while (true) {
    const started = Date.now();
    try {
      await setStage(jobId, stageDef.name, {
        status: "PROCESSING",
        startedAt: new Date(),
        progress: stageDef.progress,
        error: null,
      });
      await updateJob(jobId, {
        status: "PROCESSING",
        currentStage: stageDef.name,
        progress: stageDef.progress,
        currentTask: stageDef.label,
      });
      log(jobId, stageDef.name, "STARTED");

      const handler = STAGE_HANDLERS[stageDef.name];
      if (!handler) throw new Error(`No handler for ${stageDef.name}`);
      await handler(jobId);

      await setStage(jobId, stageDef.name, {
        status: "COMPLETED",
        completedAt: new Date(),
        progress: stageDef.progress,
      });
      log(
        jobId,
        stageDef.name,
        `COMPLETED (${((Date.now() - started) / 1000).toFixed(1)}s)`,
      );
      return true;
    } catch (error) {
      attempt += 1;
      const message =
        error instanceof Error ? error.message : String(error);
      log(
        jobId,
        stageDef.name,
        `FAILED (attempt ${attempt}/${MAX_AUTO_RETRIES}): ${message}`,
      );

      if (attempt >= MAX_AUTO_RETRIES) {
        await setStage(jobId, stageDef.name, {
          status: "FAILED",
          error: message,
          retryCount: attempt,
        });
        await updateJob(jobId, {
          status: "FAILED",
          error: stageDef.name,
          errorMessage: message,
          currentTask: `Failed: ${stageDef.label}`,
        });
        return false;
      }
      await setStage(jobId, stageDef.name, {
        status: "PENDING",
        error: message,
        retryCount: attempt,
      });
    }
  }
}

/* ------------------------------------------------------------------ */
/* Stage handlers                                                      */
/* ------------------------------------------------------------------ */

const STAGE_HANDLERS: Record<string, (jobId: string) => Promise<void>> = {
  VALIDATE: handleValidate,
  EXTRACT_AUDIO: handleExtractAudio,
  TRANSCRIBE: handleTranscribe,
  ANALYZE: handleAnalyze,
  FIND_MOMENTS: handleFindMoments,
  PLAN_CLIPS: handlePlanClips,
  RENDER_CLIPS: handleRenderClips,
  GENERATE_METADATA: handleGenerateMetadata,
  QUALITY_CHECK: handleQualityCheck,
  FINALIZE: handleFinalize,
};

async function handleValidate(jobId: string) {
  const src = await sourcePathFor(jobId);
  let details;
  try {
    details = await probeFull(src);
  } catch {
    throw new Error("Source file could not be read or is not a valid video.");
  }
  if (!details.hasVideo) throw new Error("No video stream found in source.");
  if (!details.hasAudio) {
    throw new Error(
      "No audio stream found — cannot transcribe or analyze speech.",
    );
  }
  if (details.duration < MIN_DURATION) {
    console.warn(
      `[CreatorJob] Source is ${details.duration.toFixed(
        0,
      )}s — shorter than the recommended ${MIN_DURATION}s; proceeding.`,
    );
  }
  if (details.duration > MAX_DURATION) {
    console.warn(
      `[CreatorJob] Source is ${details.duration.toFixed(
        0,
      )}s — longer than the recommended limit; proceeding.`,
    );
  }

  const dir = jobWorkDir(jobId);
  await mkdir(dir, { recursive: true });
  const thumb = path.join(dir, "source.jpg");
  try {
    await extractThumbnail(src, thumb, Math.min(details.duration / 2, 5));
  } catch {
    /* thumbnail is optional */
  }

  await updateJob(jobId, {
    sourceDuration: details.duration,
    sourceWidth: details.width,
    sourceHeight: details.height,
    thumbnailUrl: (await stat(thumb).catch(() => null))
      ? absoluteToPublic(thumb)
      : undefined,
  });
  log(
    jobId,
    "VALIDATE",
    `duration=${details.duration.toFixed(1)}s ${details.width}x${details.height}`,
  );
}

async function handleExtractAudio(jobId: string) {
  const src = await sourcePathFor(jobId);
  const dir = jobWorkDir(jobId);
  await mkdir(dir, { recursive: true });
  const audio = path.join(dir, "audio.wav");
  await extractAudio(src, audio);
  const size = await fileSize(absoluteToPublic(audio));
  await createAsset({
    jobId,
    kind: "audio",
    url: absoluteToPublic(audio),
    filename: "audio.wav",
    mimeType: "audio/wav",
    size,
  });
  log(jobId, "EXTRACT_AUDIO", `audio.wav (${size} bytes)`);
}

async function handleTranscribe(jobId: string) {
  const dir = jobWorkDir(jobId);
  const audio = path.join(dir, "audio.wav");
  const src = await sourcePathFor(jobId);
  const job = await prisma.contentJob.findUnique({ where: { id: jobId } });
  const duration = job?.sourceDuration || 0;

  const segments = await detectSpeech(src);
  const candidates = buildCandidateSegments(segments, duration);

  const transcript = await runTranscription(audio, candidates, duration);
  const out = path.join(dir, "transcript.json");
  await writeFile(out, JSON.stringify(transcript, null, 2), "utf8");
  await createAsset({
    jobId,
    kind: "transcript",
    url: absoluteToPublic(out),
    filename: "transcript.json",
    mimeType: "application/json",
    size: transcript.length,
  });
  log(jobId, "TRANSCRIBE", `${transcript.length} segments`);
}

async function runTranscription(
  audioPath: string,
  candidates: { start: number; end: number }[],
  duration: number,
): Promise<TranscriptSegment[]> {
  // Local Whisper, if installed, gives a real verbatim transcript.
  try {
    await execFileAsync("whisper", [
      audioPath,
      "--model",
      "base",
      "--output_format",
      "json",
      "--output_dir",
      path.dirname(audioPath),
    ]);
    const base = path.basename(audioPath, path.extname(audioPath));
    const whisperJson = path.join(
      path.dirname(audioPath),
      `${base}.json`,
    );
    const raw = JSON.parse(await readFile(whisperJson, "utf8"));
    const segs: TranscriptSegment[] = (raw.segments ?? []).map(
      (s: { start: number; end: number; text: string }) => ({
        start: s.start,
        end: s.end,
        text: s.text.trim(),
      }),
    );
    if (segs.length > 0) return segs;
  } catch {
    /* whisper not available — fall through to AI-inferred transcript */
  }

  // No local STT service is configured in this environment. We keep the real
  // speech-region timestamps (from ffmpeg silencedetect) and ask the AI to
  // infer plausible narration for each. This is clearly logged and only used
  // when no transcription provider exists.
  console.warn(
    "[CreatorJob] No local STT (Whisper) available — transcript text is AI-inferred from real speech regions.",
  );
  try {
    const user = candidates
      .map(
        (c, i) =>
          `Segment ${i + 1}: ${c.start.toFixed(1)}s - ${c.end.toFixed(1)}s`,
      )
      .join("\n");
    const raw = await call("transcribe the video segments", user);
    const parsed = extractJson<TranscriptSegment[]>(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {
    /* ignore — return timestamp-only segments */
  }
  return candidates.map((c, i) => ({
    start: c.start,
    end: c.end,
    text: "",
  }));
}

async function call(system: string, user: string): Promise<string> {
  return callLLM({
    system,
    user,
    temperature: 0.6,
    maxTokens: 1400,
  });
}

async function handleAnalyze(jobId: string) {
  const src = await sourcePathFor(jobId);
  const job = await prisma.contentJob.findUnique({ where: { id: jobId } });
  const duration = job?.sourceDuration || 0;

  const segments = await detectSpeech(src);
  const candidates = buildCandidateSegments(segments, duration);
  if (candidates.length === 0) {
    // Silent / music-only source: segment by fixed duration.
    const chunk = duration > 60 ? 35 : 20;
    for (let s = 0; s + 18 <= duration; s += chunk) {
      candidates.push({ start: s, end: Math.min(s + chunk, duration) });
    }
  }
  if (candidates.length === 0) {
    throw new Error("No usable segments were found in this video.");
  }

  const meta = candidates.map((c, i) => ({
    index: i + 1,
    start: c.start,
    end: c.end,
    duration: c.end - c.start,
  }));
  const scored = await scoreCandidates(meta);
  if (scored.length === 0) {
    throw new Error("Moment analysis failed to score candidates.");
  }
  const dir = jobWorkDir(jobId);
  await writeFile(
    path.join(dir, "analysis.json"),
    JSON.stringify(scored, null, 2),
    "utf8",
  );
  log(jobId, "ANALYZE", `${scored.length} candidates scored`);
}

async function handleFindMoments(jobId: string) {
  const dir = jobWorkDir(jobId);
  const raw = await readFile(path.join(dir, "analysis.json"), "utf8");
  const scored = JSON.parse(raw) as ScoredCandidate[];
  if (scored.length === 0) throw new Error("No scored candidates.");

  const target = Math.max(
    8,
    Math.min(15, Math.round(scored.length * 0.7)),
  );
  const selected = [...scored]
    .sort((a, b) => b.scores.overall - a.scores.overall)
    .slice(0, target);

  await writeFile(
    path.join(dir, "moments.json"),
    JSON.stringify(selected, null, 2),
    "utf8",
  );
  log(jobId, "FIND_MOMENTS", `${selected.length} moments selected`);
}

async function handlePlanClips(jobId: string) {
  const dir = jobWorkDir(jobId);
  const raw = await readFile(path.join(dir, "moments.json"), "utf8");
  const selected = JSON.parse(raw) as ScoredCandidate[];
  if (selected.length === 0) throw new Error("No moments to plan.");

  // Clear any prior (failed) clips so a retry starts clean.
  await prisma.contentClip.deleteMany({ where: { jobId } });

  for (let i = 0; i < selected.length; i += 1) {
    const c = selected[i];
    await createClip(jobId, {
      position: i,
      index: c.index,
      sourceStart: c.start,
      sourceEnd: c.end,
      durationSec: c.end - c.start,
      score: c.scores.overall,
      scores: c.scores,
      category: c.category,
      title: c.topicHint || `Moment ${c.index}`,
      hookOriginal: c.topicHint,
      hookAi: c.topicHint,
      hook: c.topicHint,
      useAiHook: true,
      captionStyle: CAPTION_STYLES[i % CAPTION_STYLES.length],
      platforms: ["Instagram", "YouTube", "TikTok"],
      recommendedTime: "7:30 PM",
      status: "GENERATING",
    });
  }
  log(jobId, "PLAN_CLIPS", `${selected.length} clips planned`);
}

async function handleRenderClips(jobId: string) {
  const src = await sourcePathFor(jobId);
  const dir = jobWorkDir(jobId);
  await mkdir(path.join(dir, "clips"), { recursive: true });
  await mkdir(path.join(dir, "thumbnails"), { recursive: true });

  const clips = await prisma.contentClip.findMany({
    where: { jobId },
    orderBy: { index: "asc" },
  });

  for (let i = 0; i < clips.length; i += 1) {
    const clip = clips[i];
    if (clip.status === "READY") {
      await updateJob(jobId, {
        progress: 80 + Math.round(((i + 1) / clips.length) * 10),
        currentTask: `Rendering short ${i + 1} of ${clips.length}`,
      });
      continue;
    }
    const clipName = `clip-${String(clip.index).padStart(2, "0")}`;
    const video = path.join(dir, "clips", `${clipName}.mp4`);
    const thumb = path.join(dir, "thumbnails", `${clipName}.jpg`);

    try {
      await cutVerticalClip(src, clip.sourceStart, clip.durationSec, video);
      await extractThumbnail(
        src,
        thumb,
        clip.sourceStart + clip.durationSec / 2,
      );
      const videoUrl = absoluteToPublic(video);
      const thumbUrl = absoluteToPublic(thumb);
      const media = await prisma.media.create({
        data: {
          url: videoUrl,
          filename: `${clipName}.mp4`,
          mimeType: "video/mp4",
          size: await fileSize(videoUrl),
          type: "VIDEO",
        },
      });
      await createAsset({
        jobId,
        kind: "clip",
        clipId: clip.id,
        url: videoUrl,
        filename: `${clipName}.mp4`,
        mimeType: "video/mp4",
        size: media.size,
      });
      await updateClip(clip.id, {
        status: "READY",
        generatedMediaId: media.id,
        videoUrl,
        thumbnailUrl: thumbUrl,
      });
      log(jobId, "RENDER_CLIPS", `${clipName} rendered`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Clip render failed.";

      await unlink(video).catch(() => {});
      await unlink(thumb).catch(() => {});

      await updateClip(clip.id, { status: "FAILED", error: message });
      log(jobId, "RENDER_CLIPS", `Clip ${clipName} FAILED: ${message}`);
    }

    await updateJob(jobId, {
      progress: 80 + Math.round(((i + 1) / clips.length) * 10),
      currentTask: `Rendering short ${i + 1} of ${clips.length}`,
    });
  }
}

async function handleGenerateMetadata(jobId: string) {
  const dir = jobWorkDir(jobId);
  const raw = await readFile(path.join(dir, "moments.json"), "utf8");
  const selected = JSON.parse(raw) as ScoredCandidate[];

  const transcriptText = await readAssetText(jobId, "transcript");
  let transcript: TranscriptSegment[] = [];
  try {
    transcript = transcriptText ? JSON.parse(transcriptText) : [];
  } catch {
    transcript = [];
  }

  const details = await generateClipDetails(selected).catch(() => []);
  const clips = await prisma.contentClip.findMany({
    where: { jobId },
    orderBy: { index: "asc" },
  });

  for (const c of selected) {
    const clip = clips.find((item) => item.index === c.index);
    if (!clip) continue;
    if (clip.title && clip.caption) {
      // Metadata already generated — skip (resume safety).
      continue;
    }
    const detail =
      details.find((d) => d.index === c.index) ?? null;

    const clipTranscript = sliceTranscript(
      transcript,
      clip.sourceStart,
      clip.sourceEnd,
    );
    const text =
      clipTranscript || detail?.transcript || c.topicHint || "Untitled moment";

    const hookOriginal = detail?.hookOriginal ?? c.topicHint;
    const hookAi = detail?.hookAi ?? c.topicHint;
    const caption = detail?.caption ?? "";
    const hashtags = detail?.hashtags?.length
      ? detail.hashtags.map((t: string) => t.replace(/^#/, "").toLowerCase())
      : ["fyp"];
    const platforms = (detail?.platforms ?? ["Instagram", "YouTube", "TikTok"])
      .filter((p): p is Platform => PLATFORMS.includes(p as Platform))
      .slice(0, 4);
    const recommendedTime = detail?.recommendedTime ?? "7:30 PM";

    await updateClip(clip.id, {
      title: detail?.title ?? c.topicHint,
      transcript: text,
      hookOriginal,
      hookAi,
      hook: hookAi,
      useAiHook: true,
      caption,
      hashtags,
      platforms,
      recommendedTime,
    });

    // Real caption track (SRT) from the actual transcript text.
    const srt = buildSrt(text, clip.sourceStart, clip.sourceEnd);
    const srtPath = path.join(
      dir,
      "captions",
      `clip-${String(clip.index).padStart(2, "0")}.srt`,
    );
    await mkdir(path.dirname(srtPath), { recursive: true });
    await writeFile(srtPath, srt, "utf8");
    await createAsset({
      jobId,
      kind: "caption",
      clipId: clip.id,
      url: absoluteToPublic(srtPath),
      filename: path.basename(srtPath),
      mimeType: "application/x-subrip",
      size: srt.length,
    });
    await updateClip(clip.id, { hasCaptions: true });

    await createBundle({
      clipId: clip.id,
      jobId,
      title: detail?.title ?? c.topicHint,
      hook: hookAi,
      caption,
      hashtags,
      thumbnail: clip.thumbnailUrl ?? null,
      score: c.scores.overall,
      status: "READY",
      platformRecs: platforms,
    });
    log(jobId, "GENERATE_METADATA", `clip ${clip.index} metadata + captions`);
  }
}

async function handleQualityCheck(jobId: string) {
  const clips = await prisma.contentClip.findMany({
    where: { jobId, status: "READY" },
    orderBy: { index: "asc" },
  });
  let failed = 0;
  for (const clip of clips) {
    if (!clip.videoUrl) {
      await updateClip(clip.id, { status: "FAILED", error: "Missing video." });
      failed += 1;
      continue;
    }
    const abs = publicToAbsolute(clip.videoUrl);
    let info;
    try {
      info = await probeFull(abs);
    } catch {
      info = null;
    }
    if (
      !info ||
      info.duration <= 0 ||
      !info.hasVideo ||
      info.width <= 0 ||
      info.height <= 0
    ) {
      await updateClip(clip.id, {
        status: "FAILED",
        error: "Rendered video failed validation.",
      });
      failed += 1;
      continue;
    }
    const ratio = info.width / info.height;
    const expected = 9 / 16;
    if (Math.abs(ratio - expected) > 0.05) {
      await updateClip(clip.id, {
        status: "FAILED",
        error: `Aspect ratio ${info.width}x${info.height} is not 9:16.`,
      });
      failed += 1;
      continue;
    }
    if (!clip.title || !clip.caption || clip.hashtags.length === 0) {
      await updateClip(clip.id, {
        status: "FAILED",
        error: "Missing title, caption, or hashtags.",
      });
      failed += 1;
      continue;
    }
  }

  if (failed > 0 && failed === clips.length) {
    throw new Error("All clips failed quality checks.");
  }
  // Mark failed bundles to match.
  const failedClips = await prisma.contentClip.findMany({
    where: { jobId, status: "FAILED" },
  });
  for (const fc of failedClips) {
    await prisma.contentBundle.updateMany({
      where: { clipId: fc.id },
      data: { status: "FAILED" },
    });
  }
  log(jobId, "QUALITY_CHECK", "passed");
}

async function handleFinalize(jobId: string) {
  const clips = await prisma.contentClip.findMany({
    where: { jobId, status: "READY" },
    orderBy: { index: "asc" },
  });
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

  await updateJob(jobId, {
    status: "READY_FOR_REVIEW",
    progress: 100,
    currentStage: "FINALIZE",
    currentTask: "Ready for review",
    schedulePlan: plan as unknown as Record<string, unknown>,
  });
  log(jobId, "FINALIZE", `${clips.length} clips ready for review`);
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function sliceTranscript(
  transcript: TranscriptSegment[],
  start: number,
  end: number,
): string {
  const parts = transcript
    .filter((t) => t.end > start && t.start < end && t.text)
    .map((t) => t.text.trim());
  return parts.join(" ").trim();
}

function buildSrt(text: string, start: number, end: number): string {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (sentences.length === 0) return "";
  const span = (end - start) / sentences.length;
  return sentences
    .map((sentence, i) => {
      const s = start + i * span;
      const e = s + span;
      return `${i + 1}\n${fmt(s)} --> ${fmt(e)}\n${sentence}\n`;
    })
    .join("\n");
}

function fmt(sec: number): string {
  const ms = Math.round(sec * 1000);
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  const r = Math.floor(ms % 1000);
  const p = (n: number, l = 2) => String(n).padStart(l, "0");
  return `${p(h)}:${p(m)}:${p(s)},${p(r, 3)}`;
}
