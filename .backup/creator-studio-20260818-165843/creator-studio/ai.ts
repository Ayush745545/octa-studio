const AI_BASE_URL = process.env.AI_BASE_URL || "http://localhost:11434/v1";
const AI_MODEL = process.env.AI_MODEL || "qwen2.5-coder:7b";

function cleanFormatting(text: string): string {
  return text
    .replace(/\*\*([\s\S]+?)\*\*/g, "$1")
    .replace(/__([\s\S]+?)__/g, "$1")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/^\s*[-*•]\s+/gm, "")
    .replace(/\*([^\s*][\s\S]*?[^\s*])\*/g, "$1")
    .replace(/`{1,3}[^`]*`{1,3}/g, (m) => m.replace(/`/g, ""))
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/\*{1,2}|_{2,}/g, "")
    .replace(/^"([\s\S]*)"$/, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

interface LLMOptions {
  system: string;
  user: string;
  temperature?: number;
  maxTokens?: number;
  /** Per-request ceiling in ms. Prevents a slow/hung provider from blocking
   *  the pipeline worker forever (which previously showed as "stuck"). */
  timeoutMs?: number;
}

/**
 * Sends a chat completion to the configured OpenAI-compatible provider.
 * Throws on transport/provider failure (or timeout) so callers can mark a
 * stage failed or fall back to heuristics instead of silently returning
 * empty text or hanging the worker indefinitely.
 */
export async function callLLM({
  system,
  user,
  temperature = 0.7,
  maxTokens = 900,
  timeoutMs = 150_000,
}: LLMOptions): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(`${AI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature,
        max_tokens: maxTokens,
        stream: false,
      }),
      signal: controller.signal,
    });
  } catch (error) {
    clearTimeout(timer);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(
        `AI provider timed out after ${Math.round(timeoutMs / 1000)}s.`,
      );
    }
    throw error;
  }
  clearTimeout(timer);

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`AI provider error: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };

  const content = data.choices?.[0]?.message?.content?.trim() ?? "";

  return cleanFormatting(content);
}

/**
 * Parses a JSON object out of an LLM response that may contain markdown
 * fences or surrounding prose.
 */
export function extractJson<T>(text: string): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;

  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");

  if (start === -1 || end === -1) {
    throw new Error("LLM did not return JSON.");
  }

  return JSON.parse(candidate.slice(start, end + 1)) as T;
}
