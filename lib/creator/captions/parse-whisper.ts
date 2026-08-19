import type {
  CaptionSegment,
  CaptionWord,
} from "./types";

type WhisperSegment = {
  timestamps: {
    from: string;
    to: string;
  };
  text: string;
};

type WhisperTranscript = {
  transcription: WhisperSegment[];
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

export function parseWhisperTranscript(
  data: WhisperTranscript,
): CaptionSegment[] {
  return data.transcription
    .map((segment, index) => {
      const start = timestampToSeconds(segment.timestamps.from);
      const end = timestampToSeconds(segment.timestamps.to);
      const text = segment.text.trim();

      return {
        id: index,
        start,
        end,
        text,
        words: splitWords(text, start, end),
      };
    })
    .filter(
      (segment) =>
        segment.text.length > 0 &&
        segment.end > segment.start,
    );
}
