import type { PipelineStageKey } from "@/lib/creator-studio/types";

/**
 * Canonical pipeline stages (database + worker). Each maps to a progress
 * percentage (spec section 18) and to the UI step key the frontend renders.
 */
export interface StageDef {
  name: string;
  progress: number;
  uiKey: PipelineStageKey;
  label: string;
}

export const STAGES: StageDef[] = [
  { name: "VALIDATE", progress: 5, uiKey: "upload-processing", label: "Validating source video" },
  { name: "EXTRACT_AUDIO", progress: 10, uiKey: "extract-audio", label: "Extracting audio track" },
  { name: "TRANSCRIBE", progress: 25, uiKey: "transcribe", label: "Transcribing speech" },
  { name: "ANALYZE", progress: 40, uiKey: "understand-video", label: "Analyzing video structure" },
  { name: "FIND_MOMENTS", progress: 50, uiKey: "detect-moments", label: "Detecting key moments" },
  { name: "PLAN_CLIPS", progress: 60, uiKey: "build-plan", label: "Planning clips" },
  { name: "RENDER_CLIPS", progress: 80, uiKey: "render", label: "Rendering short videos" },
  { name: "GENERATE_METADATA", progress: 90, uiKey: "captions", label: "Generating metadata & captions" },
  { name: "QUALITY_CHECK", progress: 97, uiKey: "quality-check", label: "Running quality checks" },
  { name: "FINALIZE", progress: 100, uiKey: "ready", label: "Finalizing" },
];

export const STAGE_NAMES = STAGES.map((s) => s.name);

export function stageByName(name: string): StageDef | undefined {
  return STAGES.find((s) => s.name === name);
}

/** Maps a database stage name to the UI step key for job.stage. */
export function toUiStageKey(name: string | null | undefined): PipelineStageKey {
  if (!name) return "upload-processing";
  const def = stageByName(name);
  return def?.uiKey ?? "upload-processing";
}
