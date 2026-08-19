import type {
  CaptionSegment,
  CaptionWord,
} from "./types";

export type CaptionGroup = {
  start: number;
  end: number;
  words: CaptionWord[];
};

const MAX_WORDS = 4;
const MAX_CHARS = 24;

export function groupCaptions(
  segments: CaptionSegment[],
): CaptionGroup[] {
  const groups: CaptionGroup[] = [];

  for (const segment of segments) {
    const words = segment.words;

    if (!words.length) continue;

    let current: CaptionWord[] = [];
    let currentChars = 0;

    for (const word of words) {
      const nextChars =
        currentChars === 0
          ? word.word.length
          : currentChars + 1 + word.word.length;

      const shouldBreak =
        current.length >= MAX_WORDS ||
        nextChars > MAX_CHARS;

      if (shouldBreak && current.length > 0) {
        groups.push({
          start: current[0].start,
          end: current[current.length - 1].end,
          words: current,
        });

        current = [];
        currentChars = 0;
      }

      current.push(word);
      currentChars =
        current.length === 1
          ? word.word.length
          : currentChars + 1 + word.word.length;
    }

    if (current.length > 0) {
      groups.push({
        start: current[0].start,
        end: current[current.length - 1].end,
        words: current,
      });
    }
  }

  return groups;
}
