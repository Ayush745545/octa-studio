"use client";

import { useState } from "react";
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

export default function AIStudioPage() {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState("");
  const [activeTool, setActiveTool] = useState("AI Studio");
  const [platform, setPlatform] = useState("Instagram");
  const [isGenerating, setIsGenerating] = useState(false);

  function selectTool(title: string) {
    setActiveTool(title);
    setPrompt("");
    setResult("");
  }


  async function handleGenerate() {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setResult("");

    try {
      const tool = tools.find((item) => item.title === activeTool);

      if (!tool) throw new Error("Unknown AI workflow.");

      const finalPrompt = tool.prompt(prompt.trim(), platform);

      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: finalPrompt,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Generation failed.");
      }

      setResult(data.result);
    } catch (error) {
      setResult(
        error instanceof Error
          ? error.message
          : "Something went wrong while generating content.",
      );
    } finally {
      setIsGenerating(false);
    }
  }


  function getContentTitle() {
    const cleanedPrompt = prompt
      .replace(
        /^(Generate 10 strong content ideas about |Write a complete content draft about |Generate 10 attention-grabbing hooks about |Generate 10 clickable titles about |Repurpose this content for another platform: )/i,
        "",
      )
      .trim();

    if (cleanedPrompt) {
      return cleanedPrompt.length > 100
        ? `${cleanedPrompt.slice(0, 97)}...`
        : cleanedPrompt;
    }

    return "AI Generated Content";
  }

  async function handleCreateContent() {
    if (!result.trim()) return;

    try {
      const content = await createContent({
        title: getContentTitle(),
        body: result.trim(),
        platform: platform || null,
      });

      window.location.href = `/content/${content.id}`;
    } catch (error) {
      console.error("Create content error:", error);
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

            <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <p className="text-xs text-zinc-400">
                  {prompt.length} characters
                </p>

                <select
                  value={platform}
                  onChange={(event) => setPlatform(event.target.value)}
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

          {result && (
            <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-950">
                    Generated result
                  </p>

                  <p className="mt-1 text-xs text-zinc-400">
                    Review the result before sending it into ContentOS.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(result)}
                  className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-950"
                >
                  Copy
                </button>
              </div>

              <div className="mt-5 whitespace-pre-wrap rounded-xl bg-zinc-50 p-5 text-sm leading-7 text-zinc-700">
                {result}
              </div>

              <div className="mt-5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="rounded-xl border border-zinc-200 px-4 py-3 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-950 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Regenerate
                </button>

                <button
                  type="button"
                  onClick={handleCreateContent}
                  disabled={!result.trim() || isGenerating}
                  className="rounded-xl bg-zinc-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Create Content
                </button>
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
