import type { CaptionSegment, CaptionWord } from "./types";

type WhisperSegment = {
  timestamps: {
    from: string;
    to: string;
  };
  text: string;
};

function timestampToSeconds(value: string): number {
  const [hours, minutes, seconds] = value.split(":");

  return (
    Number(hours) * 3600 +
    Number(minutes) * 60 +
    Number(seconds.replace(",", "."))
  );
}

function splitWords(
  text: string,
  start: number,
  end: number,
): CaptionWord[] {
  const words = text.trim().split(/\s+/).filter(Boolean);

  if (!words.length) {
    return [];
  }

  const duration = Math.max(0.01, end - start);
  const wordDuration = duration / words.length;

  return words.map((word, index) => ({
    word,
    start: start + index * wordDuration,
    end: start + (index + 1) * wordDuration,
  }));
}

function splitText(text: string, maxWords = 5): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);

  const result: string[] = [];

  for (let i = 0; i < words.length; i += maxWords) {
    result.push(words.slice(i, i + maxWords).join(" "));
  }

  return result;
}

export function buildCaptionSegments(
  input: WhisperSegment[],
): CaptionSegment[] {
  const output: CaptionSegment[] = [];

  let id = 0;

  for (const segment of input) {
    const start = timestampToSeconds(segment.timestamps.from);
    const end = timestampToSeconds(segment.timestamps.to);
    const chunks = splitText(segment.text);

    if (!chunks.length || end <= start) {
      continue;
    }

    const duration = end - start;
    const chunkDuration = duration / chunks.length;

    chunks.forEach((text, index) => {
      const chunkStart = start + index * chunkDuration;
      const chunkEnd =
        index === chunks.length - 1
          ? end
          : start + (index + 1) * chunkDuration;

      output.push({
        id: id++,
        start: chunkStart,
        end: chunkEnd,
        text,
        words: splitWords(text, chunkStart, chunkEnd),
      });
    });
  }

  return output;
}
