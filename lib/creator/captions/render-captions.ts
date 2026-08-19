import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import type { CaptionWord } from "./types";
import type { CaptionGroup } from "./group-captions";

const execFileAsync = promisify(execFile);

const FFMPEG = process.env.FFMPEG_PATH || "ffmpeg";

function escapeFilter(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/:/g, "\\:")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function buildCaptionText(words: CaptionWord[]): string {
  return words
    .map((word) => word.word.toUpperCase())
    .join(" ");
}

export async function renderCaptions(
  inputPath: string,
  outputPath: string,
  groups: CaptionGroup[],
): Promise<string> {
  await mkdir(path.dirname(outputPath), { recursive: true });

  const filters: string[] = [];

  for (const group of groups) {
    const text = escapeFilter(buildCaptionText(group.words));

    filters.push(
      [
        "drawtext=",
        `text='${text}':`,
        "fontcolor=white:",
        "fontsize=76:",
        "fontfile=/System/Library/Fonts/Supplemental/Arial Bold.ttf:",
        "borderw=7:",
        "bordercolor=black:",
        "shadowx=3:",
        "shadowy=3:",
        "shadowcolor=black@0.8:",
        "x=(w-text_w)/2:",
        "y=h*0.78:",
        `enable='between(t,${group.start},${group.end})'`,
      ].join(""),
    );
  }

  await execFileAsync(
    FFMPEG,
    [
      "-hide_banner",
      "-loglevel",
      "error",
      "-y",
      "-i",
      inputPath,
      "-vf",
      filters.join(","),
      "-c:v",
      "h264_videotoolbox",
      "-b:v",
      "5M",
      "-c:a",
      "copy",
      "-movflags",
      "+faststart",
      outputPath,
    ],
    {
      maxBuffer: 20 * 1024 * 1024,
    },
  );

  return outputPath;
}
