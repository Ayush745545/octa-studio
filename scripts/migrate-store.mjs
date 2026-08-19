import { readFileSync, writeFileSync } from "node:fs";

const store = JSON.parse(
  readFileSync(".data/creator-studio/store.json", "utf8"),
);

const q = (v) => {
  if (v === null || v === undefined) return "NULL";
  return `'${String(v).replace(/'/g, "''")}'`;
};
const j = (v) => (v == null ? "NULL" : q(JSON.stringify(v)) + "::jsonb");
const arr = (v) =>
  v && v.length ? `ARRAY[${v.map((x) => q(x)).join(",")}]` : "ARRAY[]::text[]";
const ts = (v) => {
  if (!v) return "now()";
  return q(new Date(v).toISOString().replace("T", " ").replace("Z", "").replace(/\.\d+$/, ""));
};

const STAGES = [
  "VALIDATE",
  "EXTRACT_AUDIO",
  "TRANSCRIBE",
  "ANALYZE",
  "FIND_MOMENTS",
  "PLAN_CLIPS",
  "RENDER_CLIPS",
  "GENERATE_METADATA",
  "QUALITY_CHECK",
  "FINALIZE",
];
const STAGE_PROGRESS = {
  VALIDATE: 5,
  EXTRACT_AUDIO: 10,
  TRANSCRIBE: 25,
  ANALYZE: 40,
  FIND_MOMENTS: 50,
  PLAN_CLIPS: 60,
  RENDER_CLIPS: 80,
  GENERATE_METADATA: 90,
  QUALITY_CHECK: 97,
  FINALIZE: 100,
};
const CLIP_STATUS = { draft: "PENDING", ready: "READY", scheduled: "SCHEDULED", rejected: "REJECTED", failed: "FAILED" };

const out = [];
const now = "now()";

for (const project of Object.values(store.projects)) {
  const job = store.jobs[project.jobId];
  const clips = Object.values(store.clips).filter(
    (c) => c.projectId === project.id,
  );
  const jobStatus =
    project.scheduledCount > 0 ? "SCHEDULED" : "READY_FOR_REVIEW";

  // ContentJob
  out.push(`INSERT INTO "ContentJob" (id, "sourceMediaId", "sourceUrl", "sourceFilename", "sourceSize", "sourceDuration", "sourceWidth", "sourceHeight", "thumbnailUrl", "schedulePlan", "scheduledCount", status, progress, "currentStage", "currentTask", "createdAt", "updatedAt")
VALUES (${q(project.jobId)}, ${q(project.sourceMediaId)}, ${q(project.url)}, ${q(project.filename)}, ${q(project.sizeBytes)}, ${q(project.durationSec)}, ${q(project.width)}, ${q(project.height)}, ${q(project.thumbnailUrl)}, ${j(project.schedulePlan)}, ${q(project.scheduledCount ?? 0)}, ${q(jobStatus)}, ${q(job?.progress ?? 100)}, 'FINALIZE', ${q(job?.currentTask ?? "Done")}, ${ts(job?.startedAt)}, ${ts(job?.updatedAt)});`);

  // PipelineStage rows
  for (const name of STAGES) {
    out.push(`INSERT INTO "PipelineStage" (id, "jobId", name, status, progress, "startedAt", "completedAt", "createdAt", "updatedAt")
VALUES (${q(project.jobId + "::" + name)}, ${q(project.jobId)}, ${q(name)}, 'COMPLETED', ${q(STAGE_PROGRESS[name])}, ${ts(job?.startedAt)}, ${ts(job?.updatedAt)}, ${now}, ${now});`);
  }

  // Source Media
  out.push(`INSERT INTO "Media" (id, "contentId", url, filename, "mimeType", size, type, "createdAt", "updatedAt")
VALUES (${q(project.sourceMediaId)}, NULL, ${q(project.url)}, ${q(project.filename)}, 'video/mp4', ${q(project.sizeBytes)}, 'VIDEO', ${now}, ${now});`);

  for (const clip of clips) {
    const hook = clip.useAiHook ? clip.hookAi : clip.hookOriginal;
    // ContentClip
    out.push(`INSERT INTO "ContentClip" (id, "jobId", position, "index", "sourceStart", "sourceEnd", "durationSec", score, scores, category, title, transcript, "hookOriginal", "hookAi", hook, "useAiHook", caption, "captionStyle", hashtags, platforms, "recommendedTime", status, "videoUrl", "thumbnailUrl", "hasCaptions", "contentId", "createdAt", "updatedAt")
VALUES (${q(clip.id)}, ${q(project.jobId)}, ${q(clip.index)}, ${q(clip.index)}, ${q(clip.startSec)}, ${q(clip.endSec)}, ${q(clip.durationSec)}, ${q(clip.scores?.overall ?? 0)}, ${j(clip.scores)}, ${q(clip.category)}, ${q(clip.title)}, ${q(clip.transcript)}, ${q(clip.hookOriginal)}, ${q(clip.hookAi)}, ${q(hook)}, ${clip.useAiHook ? "true" : "false"}, ${q(clip.caption)}, ${q(clip.captionStyle)}, ${arr(clip.hashtags)}, ${arr(clip.platforms)}, ${q(clip.recommendedTime)}, ${q(CLIP_STATUS[clip.status] ?? "PENDING")}, ${q(clip.videoUrl)}, ${q(clip.thumbnailUrl)}, true, ${q(clip.contentId ?? null)}, ${now}, ${now});`);

    // ContentBundle (one per clip)
    out.push(`INSERT INTO "ContentBundle" (id, "clipId", "jobId", title, hook, caption, hashtags, thumbnail, score, status, "platformRecs", "contentId", "createdAt", "updatedAt")
VALUES (${q("bundle_" + clip.id)}, ${q(clip.id)}, ${q(project.jobId)}, ${q(clip.title)}, ${q(hook)}, ${q(clip.caption)}, ${arr(clip.hashtags)}, ${q(clip.thumbnailUrl)}, ${q(clip.scores?.overall ?? 0)}, 'DRAFT', ${arr(clip.platforms)}, ${q(clip.contentId ?? null)}, ${now}, ${now});`);
  }
}

writeFileSync("/tmp/migrate-store.sql", out.join("\n\n") + "\n");
console.log("Wrote /tmp/migrate-store.sql with", out.length, "statements");
