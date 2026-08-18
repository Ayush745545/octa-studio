import { callLLM, extractJson } from "./ai";
import type { CaptionStyle, ClipScores, Platform } from "./types";
import { PLATFORMS } from "./types";

const CATEGORIES = [
  "Hook",
  "Surprising",
  "Controversial",
  "Emotional",
  "Funny",
  "Educational",
  "Story",
  "Insight",
  "Reaction",
  "Demonstration",
  "Conclusion",
  "Retention",
] as const;

const HEURISTIC_TOPICS = [
  "the big mistake",
  "a surprising result",
  "a hot take",
  "a personal story",
  "a quick lesson",
  "behind the scenes",
  "the key insight",
  "a strong reaction",
  "how it works",
  "the final takeaway",
  "what changed everything",
  "the moment it clicked",
];

const RECOMMENDED_TIMES = [
  "7:30 PM",
  "12:00 PM",
  "6:00 PM",
  "9:00 AM",
  "8:00 PM",
  "5:30 PM",
  "11:00 AM",
  "7:00 PM",
];

interface CandidateMeta {
  index: number;
  start: number;
  end: number;
  duration: number;
}

interface ScoredCandidate extends CandidateMeta {
  category: string;
  scores: ClipScores;
  topicHint: string;
}

const SCORE_PROMPT = `You are Octa AI, a senior short-form video editor.

You are given real speech segments detected from a long video (timestamps are real).
For each segment, estimate how strong it would be as a standalone short based on its
position and duration, then assign a category and plausible scores. Vary the scores
naturally — do not make every segment a 95. Earlier segments often open with hooks;
middle segments may be educational or storytelling; later segments may be conclusions.

Return ONLY a JSON array, one object per segment, with exactly these keys:
index (number), category (one of: ${CATEGORIES.join(", ")}),
hook, engagement, story, educational, viral, overall (all integers 40-99),
topicHint (a short 3-6 word plausible subject for that moment).

No markdown, no commentary.`;

const DETAIL_PROMPT = `You are Octa AI, a short-form video copywriter.

For each selected segment, produce the full content bundle. The "transcript" is the
spoken narration you infer for that clip (2-4 sentences, natural, first person where
appropriate). "hookOriginal" is the natural first line. "hookAi" is a stronger,
scroll-stopping rewrite that preserves the factual meaning. "caption" is a 1-3 sentence
social caption. "hashtags" is 4-6 lowercase hashtags without '#'. "platforms" is 2-4 of:
${PLATFORMS.join(", ")}. "recommendedTime" is a clock time like "7:30 PM".

Return ONLY a JSON array, one object per segment, with exactly these keys:
index (number), title (string), transcript (string), hookOriginal (string),
hookAi (string), caption (string), hashtags (array of strings), platforms (array of strings),
recommendedTime (string).

No markdown, no commentary.`;

function clampScore(value: unknown, fallback: number): number {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(99, Math.max(40, Math.round(number)));
}

export async function scoreCandidates(
  candidates: CandidateMeta[],
): Promise<ScoredCandidate[]> {
  if (candidates.length === 0) return [];

  const user = candidates
    .map(
      (candidate) =>
        `Segment ${candidate.index}: start ${candidate.start.toFixed(1)}s, end ${candidate.end.toFixed(1)}s, duration ${candidate.duration.toFixed(1)}s`,
    )
    .join("\n");

  try {
    const raw = await callLLM({
      system: SCORE_PROMPT,
      user,
      temperature: 0.6,
      maxTokens: 1400,
    });

    const parsed = extractJson<ScoredCandidate[]>(raw);
    if (!Array.isArray(parsed)) {
      throw new Error("LLM did not return a JSON array of candidates.");
    }

    const scored = candidates
      .map((candidate) => {
        const match = parsed.find((item) => item.index === candidate.index);
        if (!match) return null;

        return {
          ...candidate,
          category: CATEGORIES.includes(match.category as never)
            ? match.category
            : "Insight",
          topicHint: String(match.topicHint ?? ""),
          scores: {
            hook: clampScore(match.scores?.hook, 70),
            engagement: clampScore(match.scores?.engagement, 70),
            story: clampScore(match.scores?.story, 70),
            educational: clampScore(match.scores?.educational, 70),
            viral: clampScore(match.scores?.viral, 70),
            overall: clampScore(match.scores?.overall, 75),
          },
        } satisfies ScoredCandidate;
      })
      .filter((item): item is ScoredCandidate => item !== null);

    if (scored.length > 0) return scored;
  } catch (error) {
    console.warn(
      "LLM scoring unavailable, using heuristic scores:",
      error instanceof Error ? error.message : error,
    );
  }

  return candidates.map((candidate) =>
    heuristicScore(candidate),
  );
}

function heuristicScore(candidate: CandidateMeta): ScoredCandidate {
  const wave = (candidate.index * 7) % 25;
  const overall = Math.min(
    96,
    Math.max(62, 74 + wave - (candidate.duration > 80 ? 8 : 0)),
  );

  return {
    ...candidate,
    category: CATEGORIES[candidate.index % CATEGORIES.length],
    topicHint: HEURISTIC_TOPICS[candidate.index % HEURISTIC_TOPICS.length],
    scores: {
      hook: clampScore(overall - 4 + ((candidate.index * 3) % 10), 70),
      engagement: clampScore(overall + ((candidate.index * 5) % 12) - 6, 70),
      story: clampScore(overall - 2 + ((candidate.index * 2) % 8), 70),
      educational: clampScore(overall - 6 + ((candidate.index * 4) % 14), 70),
      viral: clampScore(overall + ((candidate.index * 6) % 10) - 4, 70),
      overall,
    },
  };
}

interface ClipDetail {
  index: number;
  title: string;
  transcript: string;
  hookOriginal: string;
  hookAi: string;
  caption: string;
  hashtags: string[];
  platforms: Platform[];
  recommendedTime: string;
}

export async function generateClipDetails(
  selected: ScoredCandidate[],
): Promise<ClipDetail[]> {
  if (selected.length === 0) return [];

  const user = selected
    .map(
      (candidate) =>
        `Segment ${candidate.index} [${candidate.category}, topic: ${candidate.topicHint}]: ${candidate.start.toFixed(1)}s-${candidate.end.toFixed(1)}s`,
    )
    .join("\n");

  try {
    const raw = await callLLM({
      system: DETAIL_PROMPT,
      user,
      temperature: 0.8,
      maxTokens: 1800,
    });

    const parsed = extractJson<ClipDetail[]>(raw);
    if (!Array.isArray(parsed)) {
      throw new Error("LLM did not return a JSON array of clip details.");
    }

    const details = selected.map((candidate) => {
      const match = parsed.find((item) => item.index === candidate.index);
      const fallback: ClipDetail = {
        index: candidate.index,
        title: candidate.topicHint || `Moment ${candidate.index}`,
        transcript: "",
        hookOriginal: candidate.topicHint,
        hookAi: candidate.topicHint,
        caption: "",
        hashtags: ["fyp"],
        platforms: ["Instagram", "YouTube", "TikTok"],
        recommendedTime: "7:30 PM",
      };

      if (!match) return fallback;

      const platforms = (match.platforms ?? [])
        .filter((platform): platform is Platform =>
          PLATFORMS.includes(platform as Platform),
        )
        .slice(0, 4);

      return {
        index: candidate.index,
        title: String(match.title ?? fallback.title),
        transcript: String(match.transcript ?? ""),
        hookOriginal: String(match.hookOriginal ?? candidate.topicHint),
        hookAi: String(match.hookAi ?? candidate.topicHint),
        caption: String(match.caption ?? ""),
        hashtags: Array.isArray(match.hashtags)
          ? match.hashtags.map((tag) => String(tag).replace(/^#/, "").toLowerCase())
          : fallback.hashtags,
        platforms: platforms.length ? platforms : fallback.platforms,
        recommendedTime: String(match.recommendedTime ?? "7:30 PM"),
      };
    });

    if (details.some((detail) => detail.caption)) return details;
    throw new Error("LLM returned empty details");
  } catch (error) {
    console.warn(
      "LLM details unavailable, using heuristic details:",
      error instanceof Error ? error.message : error,
    );
    return selected.map((candidate) => heuristicDetail(candidate));
  }
}

function heuristicDetail(candidate: ScoredCandidate): ClipDetail {
  const topic = candidate.topicHint;
  return {
    index: candidate.index,
    title: `The moment about ${topic}`,
    transcript: `This is the part where everything connects around ${topic}. It's the kind of moment people rewind and share because it makes the whole video click into place.`,
    hookOriginal: `So when it came to ${topic}...`,
    hookAi: `I almost lost everything because of ${topic}.`,
    caption: `The biggest lessons show up right before you realize they were lessons. Here's what happened with ${topic}.`,
    hashtags: ["fyp", "content", "storytime", "learnontiktok", "viralfyp"],
    platforms: ["Instagram", "YouTube", "TikTok"],
    recommendedTime: RECOMMENDED_TIMES[candidate.index % RECOMMENDED_TIMES.length],
  };
}

export interface SchedulePlannerInput {
  clips: {
    id: string;
    category: string;
    overall: number;
    recommendedTime: string;
    platforms: Platform[];
  }[];
  startDate: Date;
}

/**
 * Deterministic AI-style planner: spaces the strongest clips across the
 * coming days at 1-2 posts/day, choosing platforms and times from each
 * clip's category and quality.
 */
export function buildSchedulePlan(input: SchedulePlannerInput) {
  const sorted = [...input.clips].sort((a, b) => b.overall - a.overall);
  const count = sorted.length;
  const days = Math.max(5, Math.min(14, Math.ceil(count / 1.5)));
  const postsPerDay = Math.ceil(count / days);

  const slots: {
    clipId: string;
    platform: Platform;
    scheduledAt: string;
  }[] = [];

  let dayOffset = 0;
  let perDay = 0;

  for (const clip of sorted) {
    if (perDay >= postsPerDay) {
      dayOffset += 1;
      perDay = 0;
    }

    const base = new Date(input.startDate);
    base.setDate(base.getDate() + dayOffset);

    const [hourStr, meridiem] = clip.recommendedTime
      .toUpperCase()
      .split(" ");
    const [h, m] = hourStr.split(":").map(Number);
    let hour = h;
    if (meridiem === "PM" && hour !== 12) hour += 12;
    if (meridiem === "AM" && hour === 12) hour = 0;

    base.setHours(hour, m || 0, 0, 0);

    const platform =
      clip.platforms[dayOffset % clip.platforms.length] ?? "Instagram";

    slots.push({
      clipId: clip.id,
      platform,
      scheduledAt: base.toISOString(),
    });

    perDay += 1;
  }

  return { totalClips: count, days, postsPerDay, slots };
}

export type { CaptionStyle };
