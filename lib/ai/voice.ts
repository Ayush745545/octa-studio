import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { VOICES, type Voice } from "@/lib/ai/studio-templates";

/*
 * Text-to-speech. Prefers an OpenAI-compatible /audio/speech endpoint when
 * configured, and otherwise falls back to Pollinations (free, no API key),
 * matching the cloud fallback already used for images and video.
 */
const TTS_BASE_URL = process.env.AI_TTS_BASE_URL || "";
const TTS_MODEL = process.env.AI_TTS_MODEL || "tts-1";
const TTS_API_KEY = process.env.AI_TTS_API_KEY || process.env.OPENAI_API_KEY || "";

const POLLINATIONS_URL = "https://text.pollinations.ai/";

export function isVoice(value: string): value is Voice {
  return (VOICES as readonly string[]).includes(value);
}

export interface VoiceResult {
  url: string;
  filename: string;
  engine: "openai" | "pollinations";
}

async function saveClip(buffer: Buffer): Promise<{ url: string; filename: string }> {
  const dir = process.env.AI_UPLOAD_DIR ?? "public/uploads";
  await mkdir(dir, { recursive: true });

  const filename = `ai-voice-${Date.now()}-${randomUUID().slice(0, 8)}.mp3`;
  const localPath = path.join(dir, filename);
  await writeFile(localPath, buffer);

  return {
    url: localPath.startsWith("public/") ? `/${localPath.slice("public/".length)}` : localPath,
    filename,
  };
}

async function generateWithOpenAI(text: string, voice: Voice): Promise<VoiceResult> {
  const response = await fetch(`${TTS_BASE_URL.replace(/\/$/, "")}/audio/speech`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(TTS_API_KEY ? { Authorization: `Bearer ${TTS_API_KEY}` } : {}),
    },
    body: JSON.stringify({ model: TTS_MODEL, voice, input: text, response_format: "mp3" }),
    signal: AbortSignal.timeout(120000),
  });

  if (!response.ok) {
    throw new Error(`Voice service returned ${response.status}.`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.byteLength < 1024) {
    throw new Error("Voice service returned an empty clip.");
  }

  return { ...(await saveClip(buffer)), engine: "openai" };
}

async function generateWithPollinations(text: string, voice: Voice): Promise<VoiceResult> {
  const url =
    `${POLLINATIONS_URL}${encodeURIComponent(text)}` + `?model=openai-audio&voice=${voice}`;

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

      return { ...(await saveClip(buffer)), engine: "pollinations" };
    } catch (err) {
      lastError = err instanceof Error ? err.message : "Voice service request failed.";
    }
  }

  throw new Error(
    `${lastError} Set AI_TTS_BASE_URL (and AI_TTS_API_KEY) to use your own text-to-speech provider.`,
  );
}

export async function generateVoiceover(params: {
  text: string;
  voice?: Voice;
}): Promise<VoiceResult> {
  const voice = params.voice ?? "alloy";

  if (TTS_BASE_URL) {
    try {
      return await generateWithOpenAI(params.text, voice);
    } catch {
      // fall through to the free provider
    }
  }

  return generateWithPollinations(params.text, voice);
}
