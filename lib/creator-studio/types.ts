export type Platform = "Instagram" | "YouTube" | "TikTok" | "Facebook";

export const PLATFORMS: Platform[] = [
  "Instagram",
  "YouTube",
  "TikTok",
  "Facebook",
];

export type CaptionStyle =
  | "Clean"
  | "Bold"
  | "Viral"
  | "Podcast"
  | "Minimal"
  | "Gaming"
  | "Cinematic";

export const CAPTION_STYLES: CaptionStyle[] = [
  "Clean",
  "Bold",
  "Viral",
  "Podcast",
  "Minimal",
  "Gaming",
  "Cinematic",
];

export type ClipStatus =
  | "draft"
  | "generating"
  | "ready"
  | "scheduled"
  | "published"
  | "failed"
  | "rejected";

export type PipelineStageKey =
  | "upload-processing"
  | "extract-audio"
  | "transcribe"
  | "understand-video"
  | "detect-moments"
  | "detect-hooks"
  | "score-clips"
  | "build-plan"
  | "render"
  | "captions"
  | "bundle"
  | "quality-check"
  | "ready"
  | "failed";

export interface PipelineStep {
  key: PipelineStageKey;
  label: string;
  status: "pending" | "running" | "done" | "failed";
  detail?: string;
}

export interface ClipScores {
  hook: number;
  engagement: number;
  story: number;
  educational: number;
  viral: number;
  overall: number;
}

export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}

export interface Clip {
  id: string;
  projectId: string;
  index: number;
  startSec: number;
  endSec: number;
  durationSec: number;
  category:
    | "Hook"
    | "Surprising"
    | "Controversial"
    | "Emotional"
    | "Funny"
    | "Educational"
    | "Story"
    | "Insight"
    | "Reaction"
    | "Demonstration"
    | "Conclusion"
    | "Retention";
  title: string;
  transcript: string;
  hookOriginal: string;
  hookAi: string;
  useAiHook: boolean;
  caption: string;
  captionStyle: CaptionStyle;
  hashtags: string[];
  platforms: Platform[];
  scores: ClipScores;
  recommendedTime: string;
  status: ClipStatus;
  videoUrl?: string;
  thumbnailUrl?: string;
  error?: string;
  contentId?: string;
  publicationIds?: string[];
}

export interface Job {
  id: string;
  projectId: string;
  stage: PipelineStageKey;
  progress: number;
  currentTask: string;
  steps: PipelineStep[];
  startedAt: string;
  updatedAt: string;
  error?: string;
  completedAt?: string;
}

export interface ScheduleSlot {
  clipId: string;
  platform: Platform;
  scheduledAt: string;
}

export interface SchedulePlan {
  projectId: string;
  totalClips: number;
  days: number;
  postsPerDay: number;
  slots: ScheduleSlot[];
  generatedAt: string;
}

export interface Project {
  id: string;
  filename: string;
  url: string;
  durationSec: number;
  width: number;
  height: number;
  sizeBytes: number;
  thumbnailUrl?: string;
  createdAt: string;
  status: "uploaded" | "analyzing" | "analyzed" | "failed";
  jobId?: string;
  sourceMediaId?: string;
  schedulePlan?: SchedulePlan;
  scheduledCount?: number;
}

export interface StoreData {
  projects: Record<string, Project>;
  jobs: Record<string, Job>;
  clips: Record<string, Clip>;
}

export const PIPELINE_STEPS: { key: PipelineStageKey; label: string }[] = [
  { key: "upload-processing", label: "Upload processing" },
  { key: "extract-audio", label: "Extracting audio" },
  { key: "transcribe", label: "Transcribing speech" },
  { key: "understand-video", label: "Understanding video" },
  { key: "detect-moments", label: "Detecting important moments" },
  { key: "detect-hooks", label: "Detecting hooks" },
  { key: "score-clips", label: "Scoring clips" },
  { key: "build-plan", label: "Building content plan" },
  { key: "render", label: "Rendering short videos" },
  { key: "captions", label: "Generating captions" },
  { key: "bundle", label: "Assembling content bundles" },
  { key: "quality-check", label: "Running quality checks" },
  { key: "ready", label: "Ready" },
];
