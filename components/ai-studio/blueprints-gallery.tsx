"use client";

import { useMemo, useRef, useState } from "react";

export type Blueprint = {
  id: string;
  title: string;
  description: string;
  image: string;
  section: string;
  audience: string;
  tab?: "write" | "image" | "video" | "pipeline";
  tool?: string;
  contentType?: string;
  prompt?: string;
};

const FEATURED: Blueprint[] = [
  {
    id: "ideas-engine",
    title: "Content Ideas Engine",
    description: "Turn a topic into fresh, specific content ideas.",
    image: "/ai/idea.png",
    section: "Featured",
    audience: "Content Creators",
    tool: "Generate Ideas",
    prompt: "AI tools for busy creators",
  },
  {
    id: "post-writer",
    title: "Post Writer",
    description: "A full first draft from a simple brief.",
    image: "/ai/content.png",
    section: "Featured",
    audience: "Content Creators",
    tool: "Write Content",
    prompt: "The future of AI coding assistants",
  },
  {
    id: "hook-lab",
    title: "Hook Laboratory",
    description: "Three strong opening lines, every time.",
    image: "/images/step1-ideas.jpg",
    section: "Featured",
    audience: "Content Creators",
    tool: "Generate Hook",
    prompt: "Why consistency beats motivation for creators",
  },
  {
    id: "old-photo-restoration",
    title: "Old Photo Restoration",
    description: "Reimagine old shots with fresh clarity and color.",
    image: "/uploads/9b818838-e091-493d-9b94-fa82ac2e7de8.gif",
    section: "Featured",
    audience: "Photographers & Videographers",
    tab: "image",
    prompt: "A restored vintage family photo with warm natural color",
  },
  {
    id: "consistent-character",
    title: "Consistent Character",
    description: "The same character in new situations and styles.",
    image: "/uploads/1786621468566-yskjci0oci-contentos-ai_00003_.png",
    section: "Featured",
    audience: "Photographers & Videographers",
    tab: "image",
    prompt: "A creator mascot character exploring a neon city at night",
  },
  {
    id: "logo-creator",
    title: "Logo Creator",
    description: "Brand marks with a consistent identity.",
    image: "/uploads/1786623526584-i0rbfpz42lf-contentos-ai_00004_.png",
    section: "Featured",
    audience: "Creatives & Graphic Designers",
    tab: "image",
    prompt: "A minimal brand poster mockup on a city street at dusk",
  },
  {
    id: "background-change",
    title: "Background Change",
    description: "Swap the scene, keep the subject.",
    image: "/images/group-friends-chilling-with-smartphones-outside_1257223-92182.avif",
    section: "Featured",
    audience: "Photographers & Videographers",
    tab: "image",
    prompt: "Friends on a city street at golden hour, cinematic background",
  },
  {
    id: "weekly-planner",
    title: "Weekly Planner",
    description: "Plan, write, polish and illustrate a post end-to-end.",
    image: "/ai/calendar.png",
    section: "Featured",
    audience: "Marketing Professionals",
    tab: "pipeline",
    prompt: "Why consistency beats motivation for creators",
  },
  {
    id: "video-generation",
    title: "Motion Generator",
    description: "Short cinematic clips from a text prompt.",
    image: "/images/bg.png",
    section: "Featured",
    audience: "Photographers & Videographers",
    tab: "video",
    prompt: "Ocean waves at sunset, cinematic slow motion",
  },
  {
    id: "product-showcase",
    title: "Product Showcase",
    description: "Motion-ready visuals for your product drops.",
    image: "/uploads/1786612386436-fgnn3e2suy-contentos-ai_00001_.png",
    section: "Featured",
    audience: "Marketing Professionals",
    tab: "video",
    prompt: "A sleek product rotating on a dark stage with neon rim light",
  },
  {
    id: "reel-script",
    title: "Reel Script",
    description: "Beat-by-beat scripts for short-form video.",
    image: "/uploads/1786619420845-fsbeyvmhboe-contentos-ai_00002_.png",
    section: "Featured",
    audience: "Content Creators",
    tool: "Write Content",
    contentType: "Reel",
    prompt: "3 AI tools that save creators hours every week",
  },
  {
    id: "storyboard-sheet",
    title: "Storyboard Sheet",
    description: "Sketch the shot list before you shoot.",
    image: "/uploads/8934e4a1-86c5-45c1-9119-1b71655b4bb9.gif",
    section: "Featured",
    audience: "Creatives & Graphic Designers",
    tab: "image",
    prompt: "A six-frame storyboard for a product launch reel",
  },
];

export function FeaturedRow({ onPick }: { onPick: (blueprint: Blueprint) => void }) {
  const scroller = useRef<HTMLDivElement>(null);

  return (
    <section className="mt-4">
      <div className="flex items-baseline gap-5 px-4 sm:px-6 lg:px-10">
        <h2 className="text-sm font-semibold text-white">Featured</h2>
        <button
          type="button"
          onClick={() => scroller.current?.scrollBy({ left: 640, behavior: "smooth" })}
          className="flex items-center gap-1 text-xs font-medium text-zinc-400 transition hover:text-white"
        >
          View More
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
        </button>
      </div>
      <div className="group/row relative mt-3">
        <div
          ref={scroller}
          className="flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:px-6 lg:px-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {FEATURED.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => onPick(b)}
              title={b.description}
              className="group relative w-40 shrink-0 snap-start overflow-hidden rounded-xl border border-zinc-900 bg-zinc-950 text-left transition hover:border-zinc-700 sm:w-44"
            >
              <div className="h-52 w-full overflow-hidden">
                <img
                  src={b.image}
                  alt={b.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
              </div>
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />
              <p className="absolute inset-x-0 bottom-0 p-3 text-xs font-semibold text-white">{b.title}</p>
            </button>
          ))}
        </div>
        <button
          type="button"
          aria-label="Scroll featured forward"
          onClick={() => scroller.current?.scrollBy({ left: 640, behavior: "smooth" })}
          className="absolute right-3 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-700 bg-black/70 text-white backdrop-blur transition hover:bg-black group-hover/row:flex"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
    </section>
  );
}

type CommunityItem = {
  id: string;
  image: string;
  title: string;
  category: string;
  prompt: string;
  aspect: string;
};

const COMMUNITY_CATEGORIES = ["All", "Photography", "Animals", "Anime", "Architecture", "Character", "Food", "Sci-Fi"];

const COMMUNITY: CommunityItem[] = [
  { id: "c1", image: "/images/jellyfish.png", title: "Neon jellyfish study", category: "Animals", prompt: "A glowing jellyfish drifting through dark water, neon rim light", aspect: "aspect-[3/4]" },
  { id: "c2", image: "/uploads/1786621468566-yskjci0oci-contentos-ai_00003_.png", title: "Neon city character", category: "Character", prompt: "A creator mascot character exploring a neon city at night", aspect: "aspect-square" },
  { id: "c3", image: "/images/group-friends-chilling-with-smartphones-outside_1257223-92182.avif", title: "Golden hour friends", category: "Photography", prompt: "Friends hanging out on a city street at golden hour", aspect: "aspect-[4/5]" },
  { id: "c4", image: "/uploads/1786623526584-i0rbfpz42lf-contentos-ai_00004_.png", title: "Street poster mockup", category: "Architecture", prompt: "A minimal brand poster mockup on a city street at dusk", aspect: "aspect-[3/4]" },
  { id: "c5", image: "/uploads/8934e4a1-86c5-45c1-9119-1b71655b4bb9.gif", title: "Anime storyboard", category: "Anime", prompt: "An anime-style six-frame storyboard for a launch reel", aspect: "aspect-square" },
  { id: "c6", image: "/uploads/9b818838-e091-493d-9b94-fa82ac2e7de8.gif", title: "Restored vintage picnic", category: "Photography", prompt: "A restored vintage family photo with warm natural color", aspect: "aspect-[4/5]" },
  { id: "c7", image: "/uploads/1786612386436-fgnn3e2suy-contentos-ai_00001_.png", title: "Product on a dark stage", category: "Sci-Fi", prompt: "A sleek product rotating on a dark stage with neon rim light", aspect: "aspect-[3/4]" },
  { id: "c8", image: "/images/step3-schedule.jpg", title: "Cafe interior light", category: "Architecture", prompt: "A sunlit cafe interior with soft window light", aspect: "aspect-square" },
  { id: "c9", image: "/uploads/1786619420845-fsbeyvmhboe-contentos-ai_00002_.png", title: "Retro-future hero", category: "Character", prompt: "A retro-future hero portrait with cinematic lighting", aspect: "aspect-[4/5]" },
  { id: "c10", image: "/images/step1-ideas.jpg", title: "Street style portrait", category: "Photography", prompt: "A street style portrait with shallow depth of field", aspect: "aspect-[3/4]" },
  { id: "c11", image: "/images/bg.png", title: "Aurora gradient world", category: "Sci-Fi", prompt: "An aurora gradient dreamscape, cinematic slow motion", aspect: "aspect-square" },
  { id: "c12", image: "/images/step2-write.jpg", title: "Desk setup story", category: "Character", prompt: "A cozy creator desk setup telling a story", aspect: "aspect-[4/5]" },
];

export function CommunityGrid({ onUse }: { onUse: (prompt: string) => void }) {
  const [category, setCategory] = useState("All");

  const items = useMemo(
    () => COMMUNITY.filter((item) => category === "All" || item.category === category),
    [category],
  );

  return (
    <section className="mt-10 pb-24">
      <div className="px-4 sm:px-6 lg:px-10">
        <h2 className="text-sm font-semibold text-white">Community Creations</h2>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-xs font-medium text-zinc-300">
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            Trending
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </span>
          {COMMUNITY_CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                category === c
                  ? "border-[#7C3AED] bg-[#7C3AED]/15 text-white"
                  : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-white"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 columns-2 gap-4 px-4 sm:columns-3 sm:px-6 lg:columns-4 lg:px-10">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onUse(item.prompt)}
            title={`Use prompt: ${item.prompt}`}
            className={`group relative mb-4 block w-full break-inside-avoid overflow-hidden rounded-xl border border-zinc-900 bg-zinc-950 text-left transition hover:border-zinc-700 ${item.aspect}`}
          >
            <img
              src={item.image}
              alt={item.title}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
            <p className="absolute inset-x-0 bottom-0 translate-y-2 p-3 text-xs font-medium text-white opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100">
              {item.title}
            </p>
          </button>
        ))}
      </div>
    </section>
  );
}
