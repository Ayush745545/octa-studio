"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/layout/app-shell";
import { createContent } from "@/app/content/actions/create-content";

const tools = [
  {
    title: "Generate Ideas",
    description: "Turn a topic into fresh content ideas.",
    placeholder: "Example: AI tools for developers",
    prompt: (input: string, platform: string) =>
      `Generate 10 strong content ideas about ${input} for ${platform}.`,
  },
  {
    title: "Write Content",
    description: "Create a first draft from a simple brief.",
    placeholder: "Example: The future of AI coding",
    prompt: (input: string, platform: string) =>
      `Write a complete ${platform} content draft about ${input}.`,
  },
  {
    title: "Generate Hook",
    description: "Create strong opening hooks.",
    placeholder: "Example: AI coding tools",
    prompt: (input: string, platform: string) =>
      `Generate 10 attention-grabbing hooks about ${input} for ${platform}.`,
  },
  {
    title: "Generate Title",
    description: "Turn your topic into clickable titles.",
    placeholder: "Example: AI tools developers should know",
    prompt: (input: string, platform: string) =>
      `Generate 10 clickable ${platform} titles about ${input}.`,
  },
  {
    title: "Repurpose",
    description: "Transform existing content for another platform.",
    placeholder: "Paste the content you want to repurpose...",
    prompt: (input: string, platform: string) =>
      `Repurpose this content for ${platform}:\n\n${input}`,
  },
];

const platforms = [
  "Instagram",
  "YouTube",
  "LinkedIn",
  "X",
  "Blog",
];

const contentTypes = [
  "Post",
  "Reel",
  "Video",
  "Article",
  "Thread",
  "Caption",
];

const tones = [
  "Professional",
  "Casual",
  "Educational",
  "Engaging",
  "Viral",
];

const lengths = [
  "Short",
  "Medium",
  "Long",
];

const presets = [
  {
    name: "Viral Post",
    icon: "🚀",
    platform: "Instagram",
    contentType: "Post",
    tone: "Viral",
    length: "Medium",
  },
  {
    name: "Educational",
    icon: "🎓",
    platform: "LinkedIn",
    contentType: "Post",
    tone: "Educational",
    length: "Medium",
  },
  {
    name: "Thread",
    icon: "🧵",
    platform: "X",
    contentType: "Thread",
    tone: "Engaging",
    length: "Medium",
  },
  {
    name: "Reel Script",
    icon: "🎬",
    platform: "Instagram",
    contentType: "Reel",
    tone: "Viral",
    length: "Medium",
  },
  {
    name: "YouTube Script",
    icon: "▶",
    platform: "YouTube",
    contentType: "Video",
    tone: "Engaging",
    length: "Long",
  },
  {
    name: "LinkedIn",
    icon: "💼",
    platform: "LinkedIn",
    contentType: "Post",
    tone: "Professional",
    length: "Medium",
  },
];

export default function AIStudioPage() {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState("")
  const [isCopied, setIsCopied] = useState(false);
  const [copiedHistoryId, setCopiedHistoryId] = useState<string | null>(null);

  const [history, setHistory] = useState<
    {
      id: string;
      prompt: string;
      result: string;
      platform: string;
      contentType: string;
      tone: string;
      length: string;
      createdAt: string;
    }[]
  >([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [activeTool, setActiveTool] = useState("Generate Ideas");
  const [platform, setPlatform] = useState("Instagram");
  const [contentType, setContentType] = useState("Post");
  const [tone, setTone] = useState("Engaging");
  const [length, setLength] = useState("Medium");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("contentos-ai-history");

      if (saved) {
        const parsed = JSON.parse(saved);

        if (Array.isArray(parsed)) {
          setHistory(parsed.slice(0, 10));
        }
      }
    } catch {
      // Ignore invalid localStorage data.
    } finally {
      setHistoryLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!historyLoaded) return;

    try {
      window.localStorage.setItem(
        "contentos-ai-history",
        JSON.stringify(history.slice(0, 10)),
      );
    } catch {
      // Ignore localStorage errors.
    }
  }, [history, historyLoaded]);

  function restoreHistoryItem(item: (typeof history)[number]) {
    setPrompt(item.prompt);
    setResult(item.result);
    setPlatform(item.platform);
    setContentType(item.contentType);
    setTone(item.tone);
    setLength(item.length);
    setIsCopied(false);
    setError("");
  }

  function deleteHistoryItem(id: string) {
    setHistory((current) => current.filter((item) => item.id !== id));
  }

  function clearHistory() {
    setHistory([]);
  }

  function selectTool(title: string) {
    setActiveTool(title);
    setPrompt("");
    setResult("");
  }

  function applyPreset(preset: (typeof presets)[number]) {
    setPlatform(preset.platform);
    setContentType(preset.contentType);
    setTone(preset.tone);
    setLength(preset.length);
    setResult("");
    setError("");
  }


  async function handleCopyResult() {
    navigator.clipboard.writeText(result);
    setIsCopied(true);

    window.setTimeout(() => {
      setIsCopied(false);
    }, 1600);
  }

  async function handleGenerate() {
    setIsCopied(false);
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setResult("");
    setError("");

    try {
      const tool = tools.find((item) => item.title === activeTool);

      if (!tool) throw new Error("Unknown AI workflow.");

      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          tool: activeTool,
          platform,
          contentType,
          tone,
          length,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Generation failed.");
      }

      setResult(data.result);

    setHistory((current) => [
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        prompt: prompt.trim(),
        result: data.result,
        platform,
        contentType,
        tone,
        length,
        createdAt: new Date().toISOString(),
      },
      ...current,
    ].slice(0, 10));
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong while generating content.",
      );
    } finally {
      setIsGenerating(false);
    }
  }


  function getContentTitle() {
    const cleaned = prompt.trim().replace(/\\s+/g, " ");

    if (!cleaned) {
      return `${activeTool} — ${platform}`;
    }

    return cleaned.length > 80
      ? `${cleaned.slice(0, 77)}...`
      : cleaned;
  }

  async function handleCreateContent() {
    if (!result.trim() || isCreating) return;

    setIsCreating(true);
    setError("");

    try {
      const content = await createContent({
        title: getContentTitle(),
        body: result.trim(),
        platform: platform || null,
      });

      window.location.href = `/content/${content.id}`;
    } catch (error) {
      console.error("Create content error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Could not create content.",
      );

      setIsCreating(false);
    }
  }

  return (
    <AppShell>
      <div className="min-h-screen bg-white">
        <header className="flex h-14 items-center border-b border-zinc-200 px-7">
          <span className="text-sm font-medium text-zinc-500">
            AI Studio
          </span>
        </header>

        <main className="mx-auto max-w-6xl px-7 py-12">
          <div className="max-w-3xl">
            <p className="text-sm text-zinc-400">
              Content intelligence
            </p>

            <h1 className="mt-2 text-4xl font-semibold tracking-tight text-zinc-950">
              Create with AI.
            </h1>

            <p className="mt-4 text-base leading-7 text-zinc-500">
              Turn ideas into content, improve your drafts, and repurpose
              everything from one workspace.
            </p>
          </div>

          <section className="mt-8">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-sm text-zinc-400">
                  Quick presets
                </p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight text-zinc-950">
                  Start with a workflow.
                </h2>
              </div>

              <span className="text-xs text-zinc-400">
                One click setup
              </span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {presets.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className="group rounded-2xl border border-zinc-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg">
                      {preset.icon}
                    </span>

                    <span className="text-xs text-zinc-300 transition group-hover:text-zinc-600">
                      Apply →
                    </span>
                  </div>

                  <p className="mt-4 text-sm font-medium text-zinc-950">
                    {preset.name}
                  </p>

                  <p className="mt-1 text-xs text-zinc-400">
                    {preset.platform} · {preset.contentType} · {preset.tone}
                  </p>
                </button>
              ))}
            </div>
          </section>

          <section className="mt-10 rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-950">
                  {activeTool}
                </p>

                <p className="mt-1 text-sm text-zinc-500">
                  Tell AI what you want to create.
                </p>
              </div>

              <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-500">
                AI Studio
              </span>
            </div>

            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder={
  tools.find((tool) => tool.title === activeTool)?.placeholder ||
  "Tell AI what you want to create..."
}
              className="mt-6 min-h-36 w-full resize-none rounded-xl border border-zinc-200 bg-white px-4 py-4 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400"
            />

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div>
                <label
                  htmlFor="content-type"
                  className="mb-1.5 block text-xs font-medium text-zinc-500"
                >
                  Content type
                </label>

                <select
                  id="content-type"
                  value={contentType}
                  onChange={(event) => setContentType(event.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-xs font-medium text-zinc-700 outline-none focus:border-zinc-400"
                >
                  {contentTypes.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="content-tone"
                  className="mb-1.5 block text-xs font-medium text-zinc-500"
                >
                  Tone
                </label>

                <select
                  id="content-tone"
                  value={tone}
                  onChange={(event) => setTone(event.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-xs font-medium text-zinc-700 outline-none focus:border-zinc-400"
                >
                  {tones.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="content-length"
                  className="mb-1.5 block text-xs font-medium text-zinc-500"
                >
                  Length
                </label>

                <select
                  id="content-length"
                  value={length}
                  onChange={(event) => setLength(event.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-xs font-medium text-zinc-700 outline-none focus:border-zinc-400"
                >
                  {lengths.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <p className="text-xs text-zinc-400">
                  {prompt.length} characters
                </p>

                <select
                  value={platform}
                  onChange={(event) => setPlatform(event.target.value)}
                  aria-label="Platform"
                  className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-600 outline-none focus:border-zinc-400"
                >
                  {platforms.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={!prompt.trim() || isGenerating}
                className="rounded-xl bg-zinc-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isGenerating ? "Generating..." : "Generate"}
              </button>
            </div>
          </section>

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {result && (
            <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-zinc-950">
                    Generated result
                  </p>

                  <p className="mt-1 text-xs text-zinc-400">
                    Review and refine before sending it into ContentOS.
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[11px] font-medium text-zinc-500">
                      {platform}
                    </span>

                    <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[11px] font-medium text-zinc-500">
                      {contentType}
                    </span>

                    <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[11px] font-medium text-zinc-500">
                      {tone}
                    </span>

                    <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[11px] font-medium text-zinc-500">
                      {length}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCopyResult}
                  className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-950"
                >
                  {isCopied ? "Copied ✓" : "Copy"}
                </button>
              </div>

              <textarea
                value={result}
                onChange={(event) => setResult(event.target.value)}
                className="mt-5 min-h-72 w-full resize-y rounded-xl border border-zinc-200 bg-zinc-50 p-5 text-sm leading-7 text-zinc-700 outline-none transition focus:border-zinc-400"
                placeholder="Your generated content will appear here..."
              />

              <div className="mt-5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isGenerating || isCreating}
                  className="rounded-xl border border-zinc-200 px-4 py-3 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-950 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Regenerate
                </button>

                <button
                  type="button"
                  onClick={handleCreateContent}
                  disabled={!result.trim() || isGenerating || isCreating}
                  className="rounded-xl bg-zinc-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isCreating ? "Creating..." : "Create Content"}
                </button>
              </div>
            </section>
          )}

          {history.length > 0 && (
            <section className="mt-8">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm text-zinc-400">
                    Recent generations
                  </p>

                  <h2 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950">
                    Generation history
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => setHistory([])}
                  className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-950"
                >
                  Clear history
                </button>
              </div>

              <div className="mt-5 space-y-3">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="group rounded-2xl border border-zinc-200 bg-white p-5 transition hover:border-zinc-300 hover:shadow-sm"
                  >
                    <div className="flex items-start gap-4">
                      <button
                        type="button"
                        onClick={() => {
                          setPrompt(item.prompt);
                          setResult(item.result);
                          setPlatform(item.platform);
                          setContentType(item.contentType);
                          setTone(item.tone);
                          setLength(item.length);
                          setIsCopied(false);
                        }}
                        className="min-w-0 flex-1 text-left"
                      >
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-medium text-zinc-950">
                            {item.prompt}
                          </p>

                          <span className="shrink-0 text-[11px] text-zinc-400">
                            Reuse
                          </span>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="rounded-full bg-zinc-50 px-2.5 py-1 text-[11px] font-medium text-zinc-500">
                            {item.platform}
                          </span>

                          <span className="rounded-full bg-zinc-50 px-2.5 py-1 text-[11px] font-medium text-zinc-500">
                            {item.contentType}
                          </span>

                          <span className="rounded-full bg-zinc-50 px-2.5 py-1 text-[11px] font-medium text-zinc-500">
                            {item.tone}
                          </span>

                          <span className="rounded-full bg-zinc-50 px-2.5 py-1 text-[11px] font-medium text-zinc-500">
                            {item.length}
                          </span>
                        </div>
                      </button>

                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(item.result);
                            setCopiedHistoryId(item.id);

                            window.setTimeout(() => {
                              setCopiedHistoryId((current) =>
                                current === item.id ? null : current,
                              );
                            }, 1600);
                          }}
                          className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-950"
                        >
                          {copiedHistoryId === item.id ? "Copied ✓" : "Copy"}
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteHistoryItem(item.id)}
                          aria-label="Delete generation"
                          className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-400 transition hover:border-red-200 hover:text-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setPrompt(item.prompt);
                        setResult(item.result);
                        setPlatform(item.platform);
                        setContentType(item.contentType);
                        setTone(item.tone);
                        setLength(item.length);
                        setIsCopied(false);
                      }}
                      className="mt-4 block w-full text-left"
                    >
                      <p className="line-clamp-2 text-xs leading-5 text-zinc-400 transition group-hover:text-zinc-500">
                        {item.result}
                      </p>

                      <p className="mt-3 text-[11px] text-zinc-300">
                        {new Date(item.createdAt).toLocaleString()}
                      </p>
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="mt-12">
            <p className="text-sm text-zinc-400">
              Quick tools
            </p>

            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950">
              Choose a workflow.
            </h2>

            <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {tools.map((tool) => (
                <button
                  key={tool.title}
                  type="button"
                  onClick={() => selectTool(tool.title)}
                  className="group rounded-2xl border border-zinc-200 bg-white p-6 text-left transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <h3 className="font-medium text-zinc-950">
                      {tool.title}
                    </h3>

                    <span className="text-zinc-300 transition group-hover:text-zinc-950">
                      →
                    </span>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-zinc-500">
                    {tool.description}
                  </p>

                  <span className="mt-6 block text-xs font-medium text-zinc-400">
                    {tool.title}
                  </span>
                </button>
              ))}
            </div>
          </section>
        </main>
      </div>
    </AppShell>
  );
}
