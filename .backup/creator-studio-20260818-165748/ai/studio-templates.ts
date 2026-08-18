export type StudioMode = "image" | "video" | "voice" | "write" | "pipeline";

export const VOICES = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"] as const;
export type Voice = (typeof VOICES)[number];

export type StudioTool = {
  mode: StudioMode;
  label: string;
  description: string;
};

export const STUDIO_TOOLS: StudioTool[] = [
  { mode: "image", label: "Image", description: "Generate images from a prompt" },
  { mode: "video", label: "Video", description: "Turn a prompt into a short clip" },
  { mode: "voice", label: "Voice", description: "Narrate your script with AI voices" },
  { mode: "write", label: "Text", description: "Write posts, hooks and captions" },
  { mode: "pipeline", label: "Pipeline", description: "Plan, write and illustrate in one run" },
];

export type StudioTemplate = {
  id: string;
  title: string;
  subtitle: string;
  mode: StudioMode;
  prompt: string;
  gradient: string;
  badge?: string;
};

// Curated starting points shown in the AI Studio library.
export const STUDIO_TEMPLATES: StudioTemplate[] = [
  {
    id: "product-hero",
    title: "Product Hero Shot",
    subtitle: "Studio-lit product photography",
    mode: "image",
    prompt:
      "Studio product photography of a matte black skincare bottle on a stone pedestal, soft rim light, deep shadows, 85mm lens, ultra detailed",
    gradient: "from-[#7FFB50] via-[#7FFB50] to-[#f97316]",
    badge: "Popular",
  },
  {
    id: "cinematic-portrait",
    title: "Cinematic Portrait",
    subtitle: "Moody film-still portraits",
    mode: "image",
    prompt:
      "Cinematic portrait of a young creator in a neon-lit studio, shallow depth of field, teal and magenta grading, film grain",
    gradient: "from-[#0ea5e9] via-[#7FFB50] to-[#7FFB50]",
  },
  {
    id: "logo-creator",
    title: "Logo Creator",
    subtitle: "Clean marks for your brand",
    mode: "image",
    prompt:
      "Minimal vector logo for a creator studio, geometric monogram, flat colors, white background, high contrast",
    gradient: "from-[#f43f5e] via-[#f59e0b] to-[#facc15]",
  },
  {
    id: "background-change",
    title: "Background Change",
    subtitle: "Reframe a subject anywhere",
    mode: "image",
    prompt:
      "Same subject, replaced background: sunlit rooftop at golden hour, soft bokeh city skyline, natural color grading",
    gradient: "from-[#22c55e] via-[#14b8a6] to-[#0ea5e9]",
  },
  {
    id: "reel-opener",
    title: "Reel Opener",
    subtitle: "3 second scroll stopper",
    mode: "video",
    prompt:
      "Cinematic slow motion opener: ink dropping into water, dark background, purple lighting, dramatic reveal",
    gradient: "from-[#7FFB50] via-[#ec4899] to-[#f97316]",
    badge: "Video",
  },
  {
    id: "product-loop",
    title: "Product Loop",
    subtitle: "Seamless rotating product clip",
    mode: "video",
    prompt:
      "Looping shot of a sneaker rotating on a pedestal, studio lighting, clean gradient backdrop, crisp reflections",
    gradient: "from-[#06b6d4] via-[#3b82f6] to-[#7FFB50]",
  },
  {
    id: "voiceover-hook",
    title: "Voiceover Hook",
    subtitle: "Narrate your opening line",
    mode: "voice",
    prompt:
      "Most creators do not fail because of talent. They fail because they stop posting before the algorithm learns who they are.",
    gradient: "from-[#f59e0b] via-[#f43f5e] to-[#7FFB50]",
    badge: "Voice",
  },
  {
    id: "podcast-intro",
    title: "Podcast Intro",
    subtitle: "Warm, confident narration",
    mode: "voice",
    prompt:
      "Welcome back to the show. Today we are breaking down how small creators build an audience without paid ads.",
    gradient: "from-[#14b8a6] via-[#22c55e] to-[#84cc16]",
  },
  {
    id: "carousel-script",
    title: "Carousel Script",
    subtitle: "Five slides that convert",
    mode: "write",
    prompt: "A 5-slide carousel about growing on Instagram without paid ads",
    gradient: "from-[#7FFB50] via-[#7FFB50] to-[#7FFB50]",
  },
  {
    id: "launch-post",
    title: "Launch Post",
    subtitle: "Announce a product properly",
    mode: "write",
    prompt: "Announcement post for launching my AI content workspace",
    gradient: "from-[#ef4444] via-[#f97316] to-[#facc15]",
  },
  {
    id: "full-post",
    title: "Full Post Pipeline",
    subtitle: "Idea to post with image",
    mode: "pipeline",
    prompt: "Why consistency beats motivation for creators",
    gradient: "from-[#7FFB50] via-[#7FFB50] to-[#0ea5e9]",
    badge: "Auto",
  },
  {
    id: "repurpose",
    title: "Repurpose to LinkedIn",
    subtitle: "One idea, every platform",
    mode: "write",
    prompt: "Repurpose my latest Instagram reel script into a LinkedIn post",
    gradient: "from-[#0ea5e9] via-[#22d3ee] to-[#a3e635]",
  },
];

export function createUrl(params: { mode: StudioMode; prompt?: string }): string {
  const search = new URLSearchParams({ mode: params.mode });
  if (params.prompt) search.set("prompt", params.prompt);
  return `/ai-studio/create?${search.toString()}`;
}
