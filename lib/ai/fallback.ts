import { mkdir, writeFile, rm } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";

const execFileAsync = promisify(execFile);

/*
 * Cloud fallback used when the local ComfyUI engine is offline.
 * Images come from Pollinations.ai (free, no API key). Videos are
 * assembled from generated keyframes with ffmpeg crossfades.
 */
const POLLINATIONS_URL = "https://image.pollinations.ai/prompt/";

function uploadDir(): string {
  return process.env.AI_UPLOAD_DIR ?? "public/uploads";
}

function toUrlPath(localPath: string): string {
  return localPath.startsWith("public/")
    ? `/${localPath.slice("public/".length)}`
    : localPath;
}

// yuv420p needs even dimensions.
function even(value: number | undefined, fallback: number): number {
  const safe = typeof value === "number" && Number.isFinite(value) && value > 0 ? value : fallback;
  return Math.max(256, Math.min(1536, Math.round(safe / 2) * 2));
}

async function fetchPollinationsImage(
  prompt: string,
  width: number,
  height: number,
  seed: number,
): Promise<Buffer> {
  const url =
    `${POLLINATIONS_URL}${encodeURIComponent(prompt)}` +
    `?width=${width}&height=${height}&nologo=true&seed=${seed}`;

  /*
   * The free tier rate-limits aggressively (429), so retry with
   * backoff before giving up.
   */
  let lastError = "Image service is unavailable.";

  for (let attempt = 0; attempt < 4; attempt++) {
    if (attempt > 0) {
      await new Promise((resolve) => setTimeout(resolve, 3000 * attempt));
    }

    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(120000),
      });

      if (response.ok) {
        const buffer = Buffer.from(await response.arrayBuffer());

        if (buffer.byteLength >= 1024) {
          return buffer;
        }

        lastError = "Image service returned an empty image.";
        continue;
      }

      lastError = `Image service returned ${response.status}.`;

      // Non-retryable client errors fail fast.
      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        break;
      }
    } catch (err) {
      lastError = err instanceof Error ? err.message : "Image service request failed.";
    }
  }

  throw new Error(lastError);
}

export interface FallbackResult {
  url: string;
  filename: string;
  engine: "pollinations";
}

export async function generateFallbackImage(params: {
  prompt: string;
  width?: number;
  height?: number;
  seed?: number;
}): Promise<FallbackResult> {
  const width = even(params.width, 1024);
  const height = even(params.height, 1024);
  const seed = params.seed ?? Math.floor(Math.random() * 0xffffffff);

  const buffer = await fetchPollinationsImage(params.prompt, width, height, seed);

  const dir = uploadDir();
  await mkdir(dir, { recursive: true });

  const filename = `ai-image-${Date.now()}-${randomUUID().slice(0, 8)}.jpg`;
  const localPath = path.join(dir, filename);
  await writeFile(localPath, buffer);

  return { url: toUrlPath(localPath), filename, engine: "pollinations" };
}

export async function generateFallbackVideo(params: {
  prompt: string;
  width?: number;
  height?: number;
  fps?: number;
}): Promise<FallbackResult> {
  const width = even(params.width, 832);
  const height = even(params.height, 480);
  const fps = Number.isFinite(params.fps) && (params.fps as number) > 0 ? params.fps : 24;

  /*
   * Generate four keyframes from the same prompt with nearby seeds,
   * then crossfade them into a short mp4. Frames are fetched
   * sequentially with a small gap to stay under rate limits.
   */
  const baseSeed = Math.floor(Math.random() * 0xffffff);
  const frameSeeds = [0, 1, 2, 3].map((offset) => baseSeed + offset);

  const buffers: Buffer[] = [];
  for (const [index, seed] of frameSeeds.entries()) {
    if (index > 0) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
    buffers.push(await fetchPollinationsImage(params.prompt, width, height, seed));
  }

  const workDir = path.join(tmpdir(), `octa-video-${randomUUID()}`);
  await mkdir(workDir, { recursive: true });

  try {
    const framePaths = await Promise.all(
      buffers.map(async (buffer, index) => {
        const framePath = path.join(workDir, `frame-${index}.jpg`);
        await writeFile(framePath, buffer);
        return framePath;
      }),
    );

    const dir = uploadDir();
    await mkdir(dir, { recursive: true });
    const filename = `ai-video-${Date.now()}-${randomUUID().slice(0, 8)}.mp4`;
    const outputPath = path.join(dir, filename);

    /*
     * Each frame shows for 1.2s with a 0.4s crossfade into the next,
     * producing a ~3.6s clip. normalize() forces identical even
     * dimensions so xfade never fails on mismatched inputs.
     */
    const segment = 1.2;
    const fade = 0.4;
    const normalize = (input: number, tag: string) =>
      `[${input}:v]scale=${width}:${height}:force_original_aspect_ratio=decrease,` +
      `pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,setsar=1,format=yuv420p${tag}`;

    const filters = [
      ...framePaths.map((_, index) => normalize(index, `[v${index}]`)),
      `[v0][v1]xfade=transition=fade:duration=${fade}:offset=${segment - fade}[x1]`,
      `[x1][v2]xfade=transition=fade:duration=${fade}:offset=${(segment - fade) * 2}[x2]`,
      `[x2][v3]xfade=transition=fade:duration=${fade}:offset=${(segment - fade) * 3}[outv]`,
    ].join(";");

    const args = ["-y"];
    for (const framePath of framePaths) {
      args.push("-loop", "1", "-t", String(segment), "-i", framePath);
    }
    args.push(
      "-filter_complex", filters,
      "-map", "[outv]",
      "-c:v", "libx264",
      "-preset", "fast",
      "-crf", "20",
      "-r", String(fps),
      "-pix_fmt", "yuv420p",
      "-movflags", "+faststart",
      outputPath,
    );

    await execFileAsync("ffmpeg", args, { timeout: 120000 });

    return { url: toUrlPath(outputPath), filename, engine: "pollinations" };
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
}
