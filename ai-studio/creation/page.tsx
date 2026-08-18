"use client";

import { useState, useEffect, useRef, type ChangeEvent } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

type GenType = "text" | "image" | "video";

interface Generation {
  id: string;
  prompt: string;
  result: string;
  type: GenType;
  tool?: string | null;
  platform?: string | null;
  mediaUrl?: string | null;
  timestamp?: number;
  createdAt?: number;
}

const MODELS = ["GPT Image 2", "FLUX", "Leonardo Phoenix", "Auto"];
const STYLES = ["Dynamic", "Cinematic", "Anime", "Photorealistic", "3D Model"];

function tsOf(g: Generation): number {
  return g.timestamp || g.createdAt || 0;
}

export default function AICreationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialPrompt = searchParams.get("p") || "";
  const initialTab = (searchParams.get("tab") as "image" | "video" | "write") || "write";
  const initialTool = searchParams.get("tool") || "Generate Ideas";
  const initialPlatform = searchParams.get("platform") || "Instagram";
  const initialTone = searchParams.get("tone") || "Engaging";

  const [activeTab, setActiveTab] = useState<"write" | "image" | "video">(initialTab);
  const [prompt, setPrompt] = useState(initialPrompt);
  const [model, setModel] = useState("Auto");
  const [style, setStyle] = useState("Dynamic");
  const [aspect, setAspect] = useState("1:1");
  const [numGens, setNumGens] = useState(1);
  const [privateMode, setPrivateMode] = useState(false);

  const [result, setResult] = useState("");
  const [streamingText, setStreamingText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [error, setError] = useState("");
  const [imageError, setImageError] = useState("");
  const [videoError, setVideoError] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [scheduleAt, setScheduleAt] = useState("");
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [notice, setNotice] = useState("");
  const [today, setToday] = useState<Generation[]>([]);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const videoProgressTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-start generation if a prompt came from the explore page
  const startedRef = useRef(false);
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void loadToday();
    if (initialPrompt.trim()) {
      window.setTimeout(() => {
        if (initialTab === "image") void runImageGeneration(initialPrompt);
        else if (initialTab === "video") void runVideoGeneration(initialPrompt);
        else void runTextGeneration(initialPrompt, initialTool);
      }, 300);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [streamingText, result]);

  useEffect(() => {
    return () => {
      if (videoProgressTimer.current) window.clearInterval(videoProgressTimer.current);
    };
  }, []);

  async function loadToday() {
    try {
      const response = await fetch("/api/ai/generations");
      const data = await response.json();
      if (Array.isArray(data.items)) setToday(data.items);
    } catch {
      /* ignore */
    }
  }

  function showNotice(text: string) {
    setNotice(text);
    window.setTimeout(() => setNotice(""), 4000);
  }

  function simulateStream(fullText: string, onComplete: (text: string) => void) {
    setStreamingText("");
    let index = 0;
    const speed = Math.max(6, Math.min(20, Math.round(1800 / fullText.length)));
    function type() {
      if (index < fullText.length) {
        setStreamingText(fullText.slice(0, index + 1));
        index += 1;
        setTimeout(type, speed);
      } else {
        setStreamingText("");
        onComplete(fullText);
      }
    }
    type();
  }

  async function runTextGeneration(customPrompt?: string, customTool?: string) {
    const textPrompt = (customPrompt ?? prompt).trim();
    if (!textPrompt || isGenerating) return;
    setIsGenerating(true);
    setResult("");
    setError("");
    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: textPrompt,
          tool: customTool ?? initialTool,
          platform: initialPlatform,
          contentType: "Post",
          tone: initialTone,
          length: "medium",
          context: "",
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Generation failed.");
      const finalResult = data.result || "";
      void fetch("/api/ai/generations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "text", prompt: textPrompt, result: finalResult, tool: customTool ?? initialTool, platform: initialPlatform }),
      }).catch(() => {});
      simulateStream(finalResult, (text) => {
        setResult(text);
        setIsGenerating(false);
        void loadToday();
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setIsGenerating(false);
    }
  }

  async function runImageGeneration(customPrompt?: string) {
    const imagePrompt = (customPrompt ?? prompt).trim();
    if (!imagePrompt || isGeneratingImage) return;
    setIsGeneratingImage(true);
    setGeneratedImage(null);
    setImageError("");
    try {
      const response = await fetch("/api/ai/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: imagePrompt, negativePrompt: "", width: 1024, height: 1024 }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Image generation failed.");
      if (!data.success || !data.url) throw new Error("No image returned.");
      setGeneratedImage(data.url);
      void fetch("/api/ai/generations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "image", prompt: imagePrompt, result: data.url, tool: "Image", platform: initialPlatform }),
      }).catch(() => {});
      void loadToday();
    } catch (err) {
      setImageError(err instanceof Error ? err.message : "Image generation failed. Please try again.");
    } finally {
      setIsGeneratingImage(false);
    }
  }

  async function runVideoGeneration(customPrompt?: string) {
    const videoPrompt = (customPrompt ?? prompt).trim();
    if (!videoPrompt || isGeneratingVideo) return;
    setIsGeneratingVideo(true);
    setGeneratedVideo(null);
    setVideoError("");
    try {
      const response = await fetch("/api/ai/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: videoPrompt, negativePrompt: "", width: 832, height: 480, fps: 24 }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Video generation failed.");
      if (!data.url) throw new Error("No video returned.");
      setGeneratedVideo(data.url);
      void fetch("/api/ai/generations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "video", prompt: videoPrompt, result: data.url, tool: "Video", platform: initialPlatform }),
      }).catch(() => {});
      void loadToday();
    } catch (err) {
      setVideoError(err instanceof Error ? err.message : "Video generation failed. Please try again.");
    } finally {
      setIsGeneratingVideo(false);
    }
  }

  function handleGenerate() {
    if (!prompt.trim()) return;
    if (activeTab === "image") void runImageGeneration();
    else if (activeTab === "video") void runVideoGeneration();
    else void runTextGeneration();
  }

  async function handleCreateContent() {
    if (isCreating) return;
    const body = activeTab === "image" ? (generatedImage ? `Image: ${generatedImage}` : "") : result.trim();
    if (!body) return;
    setIsCreating(true);
    try {
      const { createContent } = await import("@/app/content/actions/create-content");
      await createContent({
        title: prompt.trim().slice(0, 80) || `${initialTool} — ${initialPlatform}`,
        body,
        platform: initialPlatform || null,
      });
      showNotice("Content saved to your library — keep creating.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create content.");
      setIsCreating(false);
    }
  }

  function toLocalInputValue(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  function openScheduler() {
    setScheduleAt(toLocalInputValue(new Date(Date.now() + 24 * 60 * 60 * 1000)));
    setIsScheduleOpen(true);
  }

  async function handleSchedule() {
    if (!scheduleAt || isScheduling) return;
    setIsScheduling(true);
    try {
      const body = activeTab === "image" ? (generatedImage ? `Image: ${generatedImage}` : "") : result.trim();
      const { createContent } = await import("@/app/content/actions/create-content");
      const { scheduleContent } = await import("@/app/content/actions/schedule-content");
      const content = await createContent({
        title: prompt.trim().slice(0, 80) || `${initialTool} — ${initialPlatform}`,
        body,
        platform: initialPlatform || null,
      });
      await scheduleContent(content.id, scheduleAt);
      setIsScheduling(false);
      setIsScheduleOpen(false);
      showNotice("Post scheduled.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not schedule content.");
      setIsScheduling(false);
    }
  }

  function resetDefaults() {
    setModel("Auto");
    setStyle("Dynamic");
    setAspect("1:1");
    setNumGens(1);
    setPrivateMode(false);
  }

  const busy = isGenerating || isGeneratingImage || isGeneratingVideo;
  const hasOutput = Boolean(result) || Boolean(generatedImage) || Boolean(generatedVideo);
  const todayItems = today.slice(0, 12);

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white">
      {/* Top bar */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-zinc-900 bg-[#0a0a0c]/90 px-4 backdrop-blur sm:px-6">
        <Link href="/ai-studio" className="flex items-center text-xs font-medium text-zinc-500 transition hover:text-white">
          <svg className="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Workspace
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-white">AI Creation</span>
          <span className="rounded-full border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[10px] text-zinc-400">142</span>
          <button className="rounded-full bg-emerald-500 px-3 py-1 text-[10px] font-semibold text-white transition hover:bg-emerald-400">Upgrade</button>
        </div>
        <Link href="/ai-studio" className="rounded-lg border border-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-zinc-700 hover:text-white">
          Back to Studio
        </Link>
      </header>

      <div className="flex">
        {/* Left settings sidebar */}
        <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-56 shrink-0 flex-col overflow-y-auto border-r border-zinc-900 bg-[#0a0a0c] p-4 lg:flex">
          <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-sm bg-[#7FFB50]" />
              <span className="text-xs font-medium text-white">{model}</span>
            </div>
            <svg className="h-3.5 w-3.5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </div>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="mt-2 hidden"
          >
            {MODELS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          <div className="mt-6">
            <p className="flex items-center gap-1 text-xs font-medium text-zinc-300">
              Style
              <svg className="h-3 w-3 text-zinc-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
            </p>
            <div className="mt-2 flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2">
              <div className="flex items-center gap-2">
                <svg className="h-3.5 w-3.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>
                <span className="text-xs font-medium text-white">{style}</span>
              </div>
              <svg className="h-3.5 w-3.5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
            <div className="mt-1 flex flex-wrap gap-1">
              {STYLES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStyle(s)}
                  className={`rounded-md px-2 py-1 text-[10px] font-medium transition ${
                    style === s
                      ? "border border-[#7FFB50] bg-[#7FFB50]/15 text-[#7FFB50]"
                      : "border border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <p className="flex items-center gap-1 text-xs font-medium text-zinc-300">
              Image Dimensions
              <svg className="h-3 w-3 text-zinc-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
            </p>
            <div className="mt-2 flex gap-2">
              {[
                { ratio: "2:3", icon: "M5 3h14v18H5z" },
                { ratio: "1:1", icon: "M4 4h16v16H4z" },
                { ratio: "16:9", icon: "M3 6h18v12H3z" },
              ].map(({ ratio, icon }) => (
                <button
                  key={ratio}
                  type="button"
                  onClick={() => setAspect(ratio)}
                  className={`flex h-10 w-10 items-center justify-center rounded-lg border transition ${
                    aspect === ratio
                      ? "border-[#7FFB50] bg-[#7FFB50]/15 text-[#7FFB50]"
                      : "border-zinc-800 bg-zinc-900/60 text-zinc-500 hover:border-zinc-700"
                  }`}
                  title={ratio}
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icon} /></svg>
                </button>
              ))}
              <div className="flex h-10 items-center rounded-lg border border-dashed border-zinc-700 px-2 text-[10px] text-zinc-500">Custom</div>
            </div>
            <div className="mt-2 inline-flex items-center gap-1 rounded-md border border-zinc-800 bg-zinc-900/60 px-2 py-1 text-[10px] text-zinc-400">
              <span className="text-[#7FFB50]">{aspect}</span> 1024×1024
            </div>
          </div>

          <div className="mt-6">
            <p className="flex items-center gap-1 text-xs font-medium text-zinc-300">
              Number of generations
              <svg className="h-3 w-3 text-zinc-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
            </p>
            <div className="mt-2 flex gap-1">
              {[1, 2, 3, 4].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setNumGens(n)}
                  className={`flex h-8 w-8 items-center justify-center rounded-md text-xs transition ${
                    numGens === n
                      ? "border border-[#7FFB50] bg-[#7FFB50]/15 text-[#7FFB50]"
                      : "border border-zinc-800 text-zinc-500 hover:border-zinc-700"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <p className="flex items-center gap-1 text-xs font-medium text-zinc-300">
              Private Mode
              <svg className="h-3 w-3 text-zinc-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
            </p>
            <button
              type="button"
              onClick={() => setPrivateMode(!privateMode)}
              className={`relative h-5 w-9 rounded-full transition ${privateMode ? "bg-emerald-500" : "bg-zinc-700"}`}
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${privateMode ? "left-4" : "left-0.5"}`}
              />
            </button>
          </div>

          <div className="mt-auto flex flex-col gap-2 pt-8">
            <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2">
              <p className="flex items-center gap-1 text-xs font-medium text-zinc-400">
                Add to Collection
                <svg className="h-3 w-3 text-zinc-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
              </p>
              <svg className="h-3.5 w-3.5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
            <button
              type="button"
              onClick={resetDefaults}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-zinc-800 px-3 py-2 text-xs font-medium text-zinc-400 transition hover:border-zinc-700 hover:text-white"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              Reset to Defaults
            </button>
          </div>
        </aside>

        {/* Main area */}
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-8">
          {/* Prompt bar */}
          <div className="mx-auto max-w-3xl">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/90 p-3 backdrop-blur">
              <textarea
                value={prompt}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setPrompt(e.target.value)}
                placeholder="Describe what you want to create…"
                rows={Math.min(6, Math.max(2, prompt.split("\n").length))}
                className="w-full resize-none bg-transparent px-2 py-1.5 text-sm leading-relaxed text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
              />
              <div className="mt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPrompt("");
                    setResult("");
                    setGeneratedImage(null);
                    setGeneratedVideo(null);
                  }}
                  className="rounded-lg border border-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-400 transition hover:border-zinc-700 hover:text-white"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={!prompt.trim() || busy}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#7FFB50] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#7FFB50] disabled:opacity-50"
                >
                  {busy ? (
                    <>
                      <span className="h-3.5 w-3.5 animate-pulse rounded-full border-2 border-white/40 border-t-white" />
                      {isGenerating ? "Generating…" : isGeneratingImage ? "Rendering image…" : "Rendering video…"}
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 1l2.2 5.3L18 8l-5.8 1.7L10 15l-2.2-5.3L2 8l5.8-1.7L10 1z" /></svg>
                      Generate
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Type tabs */}
            <div className="mt-3 flex flex-wrap gap-2">
              {(
                [
                  ["write", "Image", "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14"],
                  ["image", "Video", "M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"],
                  ["video", "Audio", "M15.536 8.464a5 5 0 010 7.072m2.625-9.697a8.5 8.5 0 010 12.35M9 19v-7a1 1 0 00-1-1H5a1 1 0 00-1 1v7a1 1 0 001 1h3a1 1 0 001-1z"],
                ] as const
              ).map(([tab, label, iconPath]) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    activeTab === tab
                      ? "border-[#7FFB50] bg-[#7FFB50]/15 text-[#7FFB50]"
                      : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-white"
                  }`}
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPath} /></svg>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Upgrade banner */}
          <div className="mx-auto mt-6 flex max-w-3xl items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-3">
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
              <p className="text-xs text-zinc-400">
                <span className="font-medium text-white">You are currently on a free plan.</span> Upgrade for additional tokens, private generations, and much more!
              </p>
            </div>
            <button className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-400">
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" /></svg>
              Upgrade Plan
            </button>
          </div>

          {/* Result area */}
          {(busy || streamingText || hasOutput || notice || error || imageError || videoError) && (
            <section className="mx-auto mt-8 max-w-3xl">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/90 backdrop-blur">
                <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#7FFB50]/15">
                      <svg className="h-4 w-4 text-[#7FFB50]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-white">AI Creation</p>
                      <p className="text-[10px] uppercase tracking-wider text-zinc-500">
                        {initialTab === "image" ? "Image" : initialTab === "video" ? "Video" : initialTool}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-[10px] text-zinc-400">{initialPlatform}</span>
                    <span className="rounded-full border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-[10px] text-zinc-400">{initialTone}</span>
                    {busy && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#7FFB50]/50 bg-[#7FFB50]/15 px-2 py-0.5 text-[10px] font-medium text-[#7FFB50]">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#7FFB50]" />
                        {activeTab === "image" ? "Rendering" : activeTab === "video" ? "Rendering" : "Generating"}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-5">
                  {/* Prompt chip */}
                  {prompt && (busy || hasOutput) && (
                    <div className="mb-4 flex justify-end">
                      <div className="max-w-[85%] rounded-xl border border-[#7FFB50]/25 bg-[#7FFB50]/15 px-3.5 py-2">
                        <p className="text-sm font-medium text-zinc-100">{prompt}</p>
                      </div>
                    </div>
                  )}

                  {/* Text stream / result */}
                  {(busy || streamingText) && activeTab === "write" && (
                    <div className="mb-4 flex gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#7FFB50]">
                        <span className="text-[10px] font-bold text-white">AI</span>
                      </div>
                      <div className="flex-1 rounded-2xl rounded-tl-sm px-5 py-4">
                        <p className="whitespace-pre-wrap text-[15px] leading-[2] text-zinc-100">{streamingText}</p>
                        {busy && <span className="ml-1 inline-block h-4 w-2 animate-pulse bg-[#7FFB50]" />}
                      </div>
                    </div>
                  )}
                  {result && !busy && activeTab === "write" && (
                    <div className="flex gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#7FFB50]">
                        <span className="text-[10px] font-bold text-white">AI</span>
                      </div>
                      <div className="max-h-[520px] flex-1 overflow-y-auto rounded-2xl rounded-tl-sm px-5 py-4">
                        <p className="whitespace-pre-wrap text-[15px] leading-[2] text-zinc-100">{result}</p>
                      </div>
                    </div>
                  )}

                  {/* Image output */}
                  {activeTab === "image" && (
                    <div className="flex justify-center">
                      {isGeneratingImage ? (
                        <div className="flex h-64 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/40">
                          <span className="mb-3 h-10 w-10 animate-spin rounded-full border-2 border-[#7FFB50]/30 border-t-[#7FFB50]" />
                          <p className="text-sm text-zinc-400">Rendering image…</p>
                        </div>
                      ) : generatedImage ? (
                        <img src={generatedImage} alt="Generated image" className="max-h-[480px] w-full rounded-2xl border border-zinc-800 object-contain" />
                      ) : null}
                    </div>
                  )}

                  {/* Video output */}
                  {activeTab === "video" && (
                    <div className="flex justify-center">
                      {isGeneratingVideo ? (
                        <div className="flex h-64 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/40">
                          <span className="mb-3 h-10 w-10 animate-spin rounded-full border-2 border-[#7FFB50]/30 border-t-[#7FFB50]" />
                          <p className="text-sm text-zinc-400">Rendering video…</p>
                        </div>
                      ) : generatedVideo ? (
                        <video src={generatedVideo} controls autoPlay loop className="max-h-[480px] w-full rounded-2xl border border-zinc-800" />
                      ) : null}
                    </div>
                  )}

                  {notice && (
                    <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-300">{notice}</div>
                  )}
                  {error && <div className="mt-4 rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-2.5 text-sm text-red-400">{error}</div>}
                  {imageError && <div className="mt-4 rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-2.5 text-sm text-red-400">{imageError}</div>}
                  {videoError && <div className="mt-4 rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-2.5 text-sm text-red-400">{videoError}</div>}

                  {/* Actions */}
                  {hasOutput && !busy && (
                    <div className="mt-5 flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => void handleCreateContent()}
                        disabled={isCreating}
                        className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:opacity-50"
                      >
                        {isCreating ? "Creating..." : "Create Content"}
                      </button>
                      <button
                        onClick={openScheduler}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#7FFB50] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#7FFB50]"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2v12a2 2 0 002 2z" /></svg>
                        Schedule
                      </button>
                      <button
                        onClick={() => {
                          const text = result || prompt;
                          void navigator.clipboard.writeText(text);
                        }}
                        className="rounded-lg border border-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-zinc-700 hover:text-white"
                      >
                        Copy
                      </button>
                      <button
                        onClick={handleGenerate}
                        disabled={!prompt.trim() || busy}
                        className="rounded-lg border border-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-zinc-700 hover:text-white disabled:opacity-50"
                      >
                        Regenerate
                      </button>
                    </div>
                  )}

                  {isScheduleOpen && (
                    <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950 p-3">
                      <label className="text-sm font-medium text-zinc-400" htmlFor="schedule-at">
                        Publish at
                      </label>
                      <input
                        id="schedule-at"
                        type="datetime-local"
                        value={scheduleAt}
                        min={toLocalInputValue(new Date(Date.now() + 5 * 60 * 1000))}
                        onChange={(e) => setScheduleAt(e.target.value)}
                        className="rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-200 outline-none focus:border-[#7FFB50]/60"
                      />
                      <button
                        onClick={() => void handleSchedule()}
                        disabled={!scheduleAt || isScheduling}
                        className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:opacity-50"
                      >
                        {isScheduling ? "Scheduling..." : "Confirm Schedule"}
                      </button>
                      <button
                        onClick={() => setIsScheduleOpen(false)}
                        className="rounded-lg border border-zinc-800 px-4 py-2 text-sm font-medium text-zinc-400 transition hover:border-zinc-700 hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  <div ref={chatEndRef} />
                </div>
              </div>
            </section>
          )}

          {/* Today feed */}
          {todayItems.length > 0 && (
            <section className="mx-auto mt-10 max-w-5xl">
              <h2 className="mb-4 text-sm font-medium text-zinc-400">Today</h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {todayItems.map((g) => {
                  const gTs = tsOf(g);
                  return (
                    <article
                      key={g.id}
                      className="group overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/60 transition hover:border-zinc-700"
                    >
                      {(g.type === "image" && (g.mediaUrl || g.result)) || (g.type === "video" && (g.mediaUrl || g.result)) ? (
                        g.type === "image" ? (
                          <img src={(g.mediaUrl || g.result) as string} alt={g.prompt} className="aspect-square w-full object-cover" />
                        ) : (
                          <video src={(g.mediaUrl || g.result) as string} className="aspect-video w-full object-cover" muted />
                        )
                      ) : (
                        <div className="flex h-32 items-center justify-center bg-zinc-900/50 px-4">
                          <p className="line-clamp-4 text-[11px] leading-relaxed text-zinc-500">{g.result || g.prompt}</p>
                        </div>
                      )}
                      <div className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {g.prompt && (
                            <span className="inline-block max-w-[70%] truncate rounded-md border border-zinc-800 bg-zinc-900/60 px-1.5 py-0.5 text-[9px] text-zinc-400" title={g.prompt}>
                              {g.prompt}
                            </span>
                          )}
                          {g.tool && (
                            <span className="rounded-md border border-zinc-800 bg-zinc-900/60 px-1.5 py-0.5 text-[9px] text-zinc-500">{g.tool}</span>
                          )}
                        </div>
                        {gTs ? (
                          <p className="mt-2 text-[9px] text-zinc-600">
                            {new Date(gTs).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        ) : null}
                      </div>
                    </article>
                  );
                })}
              </div>
              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 transition hover:text-white"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                  Back to top
                </button>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
