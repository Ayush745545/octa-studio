import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { VOICES, type Voice } from "@/lib/ai/studio-templates";

/*
 * Text-to-speech through Pollinations (free, no API key), matching the
 * cloud fallback already used for images and video.
 */
const VOICE_URL = "https://text.pollinations.ai/";

export function isVoice(value: string): value is Voice {
  return (VOICES as readonly string[]).includes(value);
}

export interface VoiceResult {
  url: string;
  filename: string;
  engine: "pollinations";
}

export async function generateVoiceover(params: {
  text: string;
  voice?: Voice;
}): Promise<VoiceResult> {
  const voice = params.voice ?? "alloy";
  const url =
    `${VOICE_URL}${encodeURIComponent(params.text)}` +
    `?model=openai-audio&voice=${voice}`;

  let lastError = "Voice service is unavailable.";

  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) {
      await new Promise((resolve) => setTimeout(resolve, 3000 * attempt));
    }

    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(120000) });

      if (!response.ok) {
        lastError = `Voice service returned ${response.status}.`;
        if (response.status >= 400 && response.status < 500 && response.status !== 429) break;
        continue;
      }

      const contentType = response.headers.get("content-type") ?? "";
      const buffer = Buffer.from(await response.arrayBuffer());

      if (!contentType.startsWith("audio") || buffer.byteLength < 1024) {
        lastError = "Voice service returned an empty clip.";
        continue;
      }

      const dir = process.env.AI_UPLOAD_DIR ?? "public/uploads";
      await mkdir(dir, { recursive: true });

      const filename = `ai-voice-${Date.now()}-${randomUUID().slice(0, 8)}.mp3`;
      const localPath = path.join(dir, filename);
      await writeFile(localPath, buffer);

      return {
        url: localPath.startsWith("public/") ? `/${localPath.slice("public/".length)}` : localPath,
        filename,
        engine: "pollinations",
      };
    } catch (err) {
      lastError = err instanceof Error ? err.message : "Voice service request failed.";
    }
  }

  throw new Error(lastError);
}
