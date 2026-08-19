import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const execFileAsync = promisify(execFile);

const FFMPEG = process.env.FFMPEG_PATH || "ffmpeg";
const FFPROBE = process.env.FFPROBE_PATH || "ffprobe";

export function publicToAbsolute(url: string): string {
  return path.join(process.cwd(), "public", url.replace(/^\//, ""));
}

export function absoluteToPublic(filePath: string): string {
  const publicDir = path.join(process.cwd(), "public");
  return "/" + path.relative(publicDir, filePath).split(path.sep).join("/");
}

export interface MediaProbe {
  durationSec: number;
  width: number;
  height: number;
}

export interface MediaDetails {
  duration: number;
  width: number;
  height: number;
  hasVideo: boolean;
  hasAudio: boolean;
  videoCodec?: string;
  audioCodec?: string;
}

/**
 * Full introspection used by the VALIDATE stage: duration, dimensions, and
 * whether real video/audio streams exist. Does not load the file into memory.
 */
export async function probeFull(filePath: string): Promise<MediaDetails> {
  const { stdout } = await execFileAsync(FFPROBE, [
    "-v",
    "error",
    "-show_format",
    "-show_streams",
    "-of",
    "json",
    filePath,
  ]);

  const data = JSON.parse(stdout) as {
    format?: { duration?: string };
    streams?: {
      codec_type?: string;
      codec_name?: string;
      width?: number;
      height?: number;
    }[];
  };

  const duration = Number.parseFloat(data.format?.duration ?? "0");
  const streams = data.streams ?? [];
  const video = streams.find((s) => s.codec_type === "video");
  const audio = streams.find((s) => s.codec_type === "audio");

  return {
    duration: Number.isFinite(duration) ? duration : 0,
    width: Number(video?.width ?? 0),
    height: Number(video?.height ?? 0),
    hasVideo: Boolean(video),
    hasAudio: Boolean(audio),
    videoCodec: video?.codec_name,
    audioCodec: audio?.codec_name,
  };
}

export async function probeMedia(filePath: string): Promise<MediaProbe> {
  const { stdout } = await execFileAsync(FFPROBE, [
    "-v",
    "error",
    "-show_entries",
    "format=duration:stream=width,height",
    "-of",
    "json",
    filePath,
  ]);

  const data = JSON.parse(stdout) as {
    format?: { duration?: string };
    streams?: { width?: number; height?: number }[];
  };

  const duration = Number.parseFloat(data.format?.duration ?? "0");
  const videoStream = data.streams?.find(
    (stream) => stream.width && stream.height,
  );

  return {
    durationSec: Number.isFinite(duration) ? duration : 0,
    width: videoStream?.width ?? 0,
    height: videoStream?.height ?? 0,
  };
}

export async function extractAudio(
  filePath: string,
  outPath: string,
): Promise<string> {
  await mkdir(path.dirname(outPath), { recursive: true });

  await execFileAsync(FFMPEG, [
    "-y",
    "-i",
    filePath,
    "-vn",
    "-ac",
    "1",
    "-ar",
    "16000",
    "-f",
    "wav",
    outPath,
  ]);

  return outPath;
}

export interface SpeechSegment {
  start: number;
  end: number;
}

/**
 * Uses ffmpeg silencedetect to find the silent regions of the audio, then
 * returns the complementary speech segments. This is real signal analysis,
 * not a guess — the returned timestamps correspond to actual spoken audio.
 */
export async function detectSpeech(
  filePath: string,
): Promise<SpeechSegment[]> {
  const { stderr } = await execFileAsync(FFMPEG, [
    "-i",
    filePath,
    "-af",
    "silencedetect=noise=-35dB:d=0.6",
    "-f",
    "null",
    "-",
  ]);

  const silence: { start: number; end: number }[] = [];
  let pendingStart: number | null = null;

  for (const line of stderr.split("\n")) {
    const startMatch = line.match(/silence_start:\s*([\d.]+)/);

    if (startMatch) {
      pendingStart = Number.parseFloat(startMatch[1]);
    } else if (line.includes("silence_end") && pendingStart !== null) {
      const end = Number.parseFloat(
        (line.match(/silence_end:\s*([\d.]+)/) ?? [])[1] ?? "0",
      );
      silence.push({ start: pendingStart, end });
      pendingStart = null;
    }
  }

  if (silence.length === 0) {
    // No silence detected — treat the whole clip as one speech region.
    const { durationSec } = await probeMedia(filePath).catch(() => ({
      durationSec: 0,
    }));
    return durationSec > 0 ? [{ start: 0, end: durationSec }] : [];
  }

  const speech: SpeechSegment[] = [];
  let cursor = 0;

  for (const region of silence) {
    if (region.start > cursor) {
      speech.push({ start: cursor, end: region.start });
    }
    cursor = Math.max(cursor, region.end);
  }

  const end = await probeMedia(filePath)
    .then((probe) => probe.durationSec)
    .catch(() => 0);

  if (end > cursor) {
    speech.push({ start: cursor, end });
  }

  return speech;
}

/**
 * Merges adjacent speech segments that are separated by a short gap and
 * drops segments outside the usable duration window.
 */
export function buildCandidateSegments(
  speech: SpeechSegment[],
  totalDuration: number,
  minSec = 18,
  maxSec = 95,
  mergeGap = 1.5,
): SpeechSegment[] {
  const sorted = [...speech].sort((a, b) => a.start - b.start);
  const merged: SpeechSegment[] = [];

  for (const segment of sorted) {
    const last = merged[merged.length - 1];

    if (
      last &&
      segment.start - last.end <= mergeGap &&
      segment.end - last.start <= maxSec
    ) {
      last.end = Math.max(last.end, segment.end);
    } else {
      merged.push({ ...segment });
    }
  }

  return merged
    .map((segment) => {
      // Pad slightly into silence on both sides for a natural cut.
      const start = Math.max(0, segment.start - 0.4);
      const end = Math.min(totalDuration, segment.end + 0.4);
      return { start, end };
    })
    .filter((segment) => {
      const duration = segment.end - segment.start;
      return duration >= minSec && duration <= maxSec;
    });
}

export async function extractThumbnail(
  filePath: string,
  outPath: string,
  seekSec: number,
): Promise<string> {
  await mkdir(path.dirname(outPath), { recursive: true });

  await execFileAsync(
    FFMPEG,
    [
      "-hide_banner",
      "-loglevel",
      "error",
      "-y",
      "-ss",
      String(Math.max(0, seekSec)),
      "-i",
      filePath,
      "-frames:v",
      "1",
      "-vf",
      "scale=540:-2:flags=fast_bilinear",
      "-q:v",
      "5",
      outPath,
    ],
    {
      maxBuffer: 10 * 1024 * 1024,
    },
  );

  return outPath;
}

/**
 * Cuts a real vertical (9:16, 1080x1920) short from the source video using
 * a center-weighted crop and smooth scale. The output is a genuine segment
 * of the uploaded video — no synthetic frames.
 */
export async function cutVerticalClip(
  srcPath: string,
  startSec: number,
  durationSec: number,
  outPath: string,
): Promise<string> {
  await mkdir(path.dirname(outPath), { recursive: true });

  // Apple Silicon hardware encoder.
  await execFileAsync(
    FFMPEG,
    [
      "-hide_banner",
      "-loglevel",
      "error",
      "-y",

      // Fast seek before opening the input.
      "-ss",
      String(Math.max(0, startSec)),
      "-i",
      srcPath,

      "-t",
      String(durationSec),

      // 9:16 vertical crop + fast scale.
      "-vf",
      "crop=ih*9/16:ih,scale=1080:1920:flags=fast_bilinear,setsar=1",

      // M4 VideoToolbox.
      "-c:v",
      "h264_videotoolbox",
      "-b:v",
      "5M",
      "-maxrate",
      "7M",
      "-bufsize",
      "10M",

      // Audio.
      "-c:a",
      "aac",
      "-b:a",
      "128k",

      // Make MP4 playable immediately.
      "-movflags",
      "+faststart",

      outPath,
    ],
    {
      maxBuffer: 10 * 1024 * 1024,
    },
  );

  // IMPORTANT:
  // Never return a file that FFmpeg created but which is actually broken.
  const probe = await probeFull(outPath);

  if (
    !probe.hasVideo ||
    probe.duration <= 0 ||
    probe.width <= 0 ||
    probe.height <= 0
  ) {
    throw new Error(
      `FFmpeg produced an invalid video: ${outPath}`,
    );
  }

  return outPath;
}
