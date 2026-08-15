"use client";

import { useEffect, useMemo, useState } from "react";
import WorkspaceLayout from "@/components/layout/workspace-layout";
import {
  STUDIO_TEMPLATES,
  STUDIO_TOOLS,
  createUrl,
  type StudioMode,
} from "@/lib/ai/studio-templates";

type Creation = {
  id: string;
  type: StudioMode | "text";
  prompt: string;
  result: string | null;
  tool: string | null;
  createdAt: string;
};

const TOOL_ICONS: Record<StudioMode, React.ReactNode> = {
  image: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  ),
  video: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
  ),
  voice: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M19 11a7 7 0 01-14 0m7 7v3m0-3a4 4 0 004-4V7a4 4 0 10-8 0v7a4 4 0 004 4z" />
  ),
  write: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  ),
  pipeline: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M13 10V3L4 14h7v7l9-11h-7z" />
  ),
};

const FILTERS: { key: "all" | StudioMode | "text"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "image", label: "Images" },
  { key: "video", label: "Video" },
  { key: "voice", label: "Voice" },
  { key: "text", label: "Text" },
];

function openCreate(mode: StudioMode, prompt?: string) {
  window.open(createUrl({ mode, prompt }), "_blank", "noopener,noreferrer");
}

export default function AIStudioPage() {
  const [heroPrompt, setHeroPrompt] = useState("");
  const [heroMode, setHeroMode] = useState<StudioMode>("image");
  const [creations, setCreations] = useState<Creation[]>([]);
  const [filter, setFilter] = useState<"all" | StudioMode | "text">("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/ai/generations");
        const data = await response.json();
        if (!cancelled && Array.isArray(data.items)) setCreations(data.items);
      } catch {
        // gallery stays empty when the API is unreachable
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const visibleCreations = useMemo(
    () => (filter === "all" ? creations : creations.filter((item) => item.type === filter)),
    [creations, filter],
  );

  return (
    <WorkspaceLayout activeItem="ai-studio">
      <div className="min-h-screen bg-[#0a0a0c] pb-16">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-white/10">
          <div className="absolute inset-0 bg-gradient-to-br from-[#7C3AED]/40 via-[#c026d3]/20 to-[#f97316]/25" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.12),transparent_55%)]" />
          <div className="relative mx-auto max-w-5xl px-4 py-16 text-center sm:px-6">
            <h1 className="text-4xl font-extrabold uppercase tracking-tight text-white sm:text-5xl">Yours to create</h1>
            <p className="mt-3 text-sm text-zinc-300">
              Pick a template or describe your idea — images, video and voiceovers, all in one studio.
            </p>

            <div className="mx-auto mt-8 max-w-3xl rounded-2xl border border-white/15 bg-black/50 p-3 backdrop-blur-xl">
              <input
                value={heroPrompt}
                onChange={(e) => setHeroPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") openCreate(heroMode, heroPrompt.trim() || undefined);
                }}
                placeholder="Type a prompt..."
                className="w-full bg-transparent px-2 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500"
              />
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {(["image", "video", "voice"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setHeroMode(mode)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium capitalize transition ${
                      heroMode === mode
                        ? "border-[#7C3AED] bg-[#7C3AED]/25 text-white"
                        : "border-white/15 bg-white/[0.04] text-zinc-400 hover:border-white/30 hover:text-white"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => openCreate(heroMode, heroPrompt.trim() || undefined)}
                  className="ml-auto rounded-lg bg-[#7C3AED] px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-[#6D28D9]"
                >
                  Generate
                </button>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              {STUDIO_TOOLS.map((tool) => (
                <button
                  key={tool.mode}
                  type="button"
                  onClick={() => openCreate(tool.mode)}
                  title={`${tool.description} — opens in a new tab`}
                  className="flex w-20 flex-col items-center gap-1.5 rounded-2xl border border-white/10 bg-black/40 py-3 text-zinc-300 transition hover:border-white/30 hover:text-white"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {TOOL_ICONS[tool.mode]}
                  </svg>
                  <span className="text-[11px] font-medium">{tool.label}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Featured templates */}
        <section className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold text-white">Featured templates</h2>
            <p className="text-[11px] text-zinc-600">Opens in a new tab</p>
          </div>
          <div className="no-scrollbar mt-3 flex gap-3 overflow-x-auto pb-2">
            {STUDIO_TEMPLATES.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => openCreate(template.mode, template.prompt)}
                className="group relative h-40 w-44 shrink-0 overflow-hidden rounded-2xl border border-white/10 text-left transition hover:border-white/30"
              >
                <span className={`absolute inset-0 bg-gradient-to-br ${template.gradient} opacity-80 transition group-hover:opacity-100`} />
                <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                {template.badge && (
                  <span className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white">
                    {template.badge}
                  </span>
                )}
                <span className="absolute inset-x-0 bottom-0 p-3">
                  <span className="block text-xs font-semibold text-white">{template.title}</span>
                  <span className="mt-0.5 block text-[10px] leading-4 text-zinc-300">{template.subtitle}</span>
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* User creations */}
        <section className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
          <h2 className="text-sm font-semibold text-white">Your creations</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {FILTERS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setFilter(item.key)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  filter === item.key
                    ? "border-[#7C3AED] bg-[#7C3AED]/20 text-violet-200"
                    : "border-white/10 bg-white/[0.03] text-zinc-500 hover:border-white/25 hover:text-zinc-200"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[0, 1, 2, 3].map((key) => (
                <div key={key} className="h-56 animate-pulse rounded-2xl border border-white/5 bg-white/[0.03]" />
              ))}
            </div>
          ) : visibleCreations.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-white/10 py-16 text-center">
              <p className="text-sm text-zinc-500">No creations yet</p>
              <button
                type="button"
                onClick={() => openCreate("image")}
                className="mt-3 rounded-xl bg-[#7C3AED] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#6D28D9]"
              >
                Create your first one
              </button>
            </div>
          ) : (
            <div className="mt-6 columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4">
              {visibleCreations.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    openCreate(item.type === "text" ? "write" : (item.type as StudioMode), item.prompt)
                  }
                  className="group mb-4 block w-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] text-left transition hover:border-white/30"
                >
                  {item.type === "image" && item.result && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.result} alt={item.prompt} className="w-full object-cover" />
                  )}
                  {item.type === "video" && item.result && (
                    <video src={item.result} muted loop playsInline className="w-full" />
                  )}
                  {item.type === "voice" && item.result && (
                    <div className="flex items-center gap-3 p-4">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#7C3AED]/20 text-violet-300">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">{TOOL_ICONS.voice}</svg>
                      </span>
                      <span className="text-xs text-zinc-400">Voiceover clip</span>
                    </div>
                  )}
                  {item.type === "text" && (
                    <p className="max-h-48 overflow-hidden p-4 text-xs leading-5 text-zinc-400">{item.result}</p>
                  )}
                  <div className="border-t border-white/5 px-3 py-2.5">
                    <p className="truncate text-xs text-zinc-300">{item.prompt}</p>
                    <p className="mt-0.5 text-[10px] uppercase tracking-wide text-zinc-600">
                      {item.tool || item.type} · {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </WorkspaceLayout>
  );
}
