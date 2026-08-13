"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createContent } from "@/app/content/actions/create-content";
import { PostPreviewPanel } from "@/components/ai-studio/post-preview-panel";

const tools = [
  {
    title: "Generate Ideas",
    description: "Turn a topic into fresh content ideas.",
    placeholder: "Example: AI tools for developers",
  },
  {
    title: "Write Content",
    description: "Create a first draft from a simple brief.",
    placeholder: "Example: The future of AI coding",
  },
  {
    title: "Generate Hook",
    description: "Create strong opening hooks.",
    placeholder: "Example: AI coding tools",
  },
  {
    title: "Generate Title",
    description: "Turn your topic into clickable titles.",
    placeholder: "Example: AI tools developers should know",
  },
  {
    title: "Repurpose",
    description: "Transform existing content for another platform.",
    placeholder: "Paste the content you want to repurpose...",
  },
];

const platforms = ["Instagram", "YouTube", "LinkedIn", "X", "Blog"];
const contentTypes = ["Post", "Reel", "Video", "Article", "Thread", "Caption"];
const tones = ["Professional", "Casual", "Educational", "Engaging", "Viral"];
const lengths = ["Short", "Medium", "Long"];

type Generation = {
  id: string;
  prompt: string;
  result: string;
  tool: string;
  platform: string;
  contentType: string;
  timestamp: number;
};

type PipelineStep = {
  id: string;
  tool: string;
  prompt: string;
  status: "idle" | "running" | "done" | "error";
  result?: string;
  error?: string;
};

export default function AIStudioPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"write" | "image" | "video" | "pipeline">("write");
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState("");
  const [activeTool, setActiveTool] = useState("Generate Ideas");
  const [platform, setPlatform] = useState("Instagram");
  const [contentType, setContentType] = useState("Post");
  const [tone, setTone] = useState("Engaging");
  const [length, setLength] = useState("Medium");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [activeGenerationId, setActiveGenerationId] = useState<string | null>(null);
  const [streamingText, setStreamingText] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Pipeline state
  const [pipelineSteps, setPipelineSteps] = useState<PipelineStep[]>([
    { id: "1", tool: "Generate Ideas", prompt: "", status: "idle" },
  ]);
  const [isPipelineRunning, setIsPipelineRunning] = useState(false);

  // Image & Video state
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageError, setImageError] = useState("");
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoError, setVideoError] = useState("");
  const [videoProgress, setVideoProgress] = useState(0);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [streamingText, result, isGenerating]);

  // Simulate streaming effect
  function simulateStream(fullText: string, onComplete: (text: string) => void) {
    setStreamingText("");
    let index = 0;
    const speed = 8;
    
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

  async function handleGenerate() {
    if (!prompt.trim() || isGenerating) return;
    
    setIsGenerating(true);
    setResult("");
    setError("");
    setStreamingText("");
    const generationId = Date.now().toString();
    setActiveGenerationId(generationId);

    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      if (!response.ok) throw new Error(data.error || "Generation failed.");
      
      const finalResult = data.result || "";
      
      // Add to generations history
      const newGeneration: Generation = {
        id: generationId,
        prompt: prompt.trim(),
        result: finalResult,
        tool: activeTool,
        platform,
        contentType,
        timestamp: Date.now(),
      };
      
      setGenerations((prev) => [newGeneration, ...prev]);
      
      // Simulate streaming
      simulateStream(finalResult, (text) => {
        setResult(text);
        setIsGenerating(false);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStreamingText("");
      setIsGenerating(false);
    }
  }

  function loadGeneration(gen: Generation) {
    setPrompt(gen.prompt);
    setResult(gen.result);
    setActiveTool(gen.tool);
    setPlatform(gen.platform);
    setContentType(gen.contentType);
    setActiveGenerationId(gen.id);
    setStreamingText("");
  }

  async function handleCreateContent() {
    if (!result.trim() || isCreating) return;
    setIsCreating(true);
    setError("");

    try {
      const content = await createContent({
        title: prompt.trim().slice(0, 80) || `${activeTool} — ${platform}`,
        body: result.trim(),
        platform: platform || null,
      });
      router.push(`/content/${content.id}`);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Could not create content.");
      setIsCreating(false);
    }
  }

  // Pipeline handlers
  function addPipelineStep() {
    setPipelineSteps((prev) => [
      ...prev,
      { id: Date.now().toString(), tool: "Write Content", prompt: "", status: "idle" },
    ]);
  }

  function updatePipelineStep(id: string, updates: Partial<PipelineStep>) {
    setPipelineSteps((prev) => prev.map((step) => (step.id === id ? { ...step, ...updates } : step)));
  }

  function removePipelineStep(id: string) {
    setPipelineSteps((prev) => prev.filter((step) => step.id !== id));
  }

  async function handleRunPipeline() {
    if (isPipelineRunning) return;
    setIsPipelineRunning(true);
    
    const currentSteps = pipelineSteps.map((step) => ({ ...step, status: "idle" as const, result: undefined, error: undefined }));
    setPipelineSteps(currentSteps);

    let context = "";

    for (let i = 0; i < currentSteps.length; i++) {
      const step = currentSteps[i];
      updatePipelineStep(step.id, { status: "running" });

      try {
        const response = await fetch("/api/ai/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: step.prompt.trim() || "Continue with the given context.",
            tool: step.tool,
            platform,
            contentType,
            tone,
            length,
            context,
          }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Generation failed.");

        context = data.result;
        updatePipelineStep(step.id, { status: "done", result: data.result });
      } catch (err) {
        updatePipelineStep(step.id, { status: "error", error: err instanceof Error ? err.message : "Pipeline step failed." });
        break;
      }
    }

    setIsPipelineRunning(false);
  }

  // Image & Video handlers
  async function handleImageGenerate() {
    if (!prompt.trim() || isGeneratingImage) return;
    setIsGeneratingImage(true);
    setGeneratedImage(null);
    setImageError("");

    try {
      await new Promise((res) => setTimeout(res, 2000));
      setGeneratedImage(`https://images.unsplash.com/photo-${1618005182384 + Math.floor(Math.random() * 100000)}?w=800&q=80`);
    } catch {
      setImageError("Image generation failed. Please try again.");
    } finally {
      setIsGeneratingImage(false);
    }
  }

  async function handleVideoGenerate() {
    if (!prompt.trim() || isGeneratingVideo) return;
    setIsGeneratingVideo(true);
    setGeneratedVideo(null);
    setVideoError("");
    setVideoProgress(0);

    try {
      const steps = [
        { progress: 20, delay: 500 },
        { progress: 45, delay: 800 },
        { progress: 70, delay: 600 },
        { progress: 90, delay: 400 },
        { progress: 100, delay: 300 },
      ];
      for (const step of steps) {
        await new Promise((res) => setTimeout(res, step.delay));
        setVideoProgress(step.progress);
      }
      setGeneratedVideo(`https://images.unsplash.com/photo-${1618005182384 + Math.floor(Math.random() * 100000)}?w=800&q=80`);
    } catch {
      setVideoError("Video generation failed. Please try again.");
    } finally {
      setIsGeneratingVideo(false);
    }
  }

  const showPreview = activeTab === "write" && isPreviewOpen;
  const displayResult = streamingText || result;

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="flex h-16 items-center border-b border-zinc-900 bg-black px-4 sm:px-6 lg:px-8">
        <Link href="/" className="mr-4 flex items-center text-sm font-medium text-zinc-500 hover:text-white transition">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back to Workspace
        </Link>
        <span className="text-sm font-medium text-zinc-400 border-l border-zinc-900 pl-4">AI Studio</span>
      </header>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Posts Sidebar */}
        <aside className={`border-r border-zinc-800/50 bg-[#0a0a0c] flex-shrink-0 transition-all duration-300 ${isSidebarOpen ? 'w-64 opacity-100' : 'w-0 opacity-0 overflow-hidden'}`}>
          <div className="p-4 border-b border-zinc-800/50">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Recent Generations</h3>
              <span className="text-[10px] text-zinc-600">{generations.length}</span>
            </div>
          </div>
          <div className="overflow-y-auto h-[calc(100%-60px)]">
            {generations.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-xs text-zinc-600">No generations yet</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {generations.map((gen) => (
                  <button
                    key={gen.id}
                    onClick={() => loadGeneration(gen)}
                    className={`w-full text-left p-3 rounded-xl transition ${
                      activeGenerationId === gen.id
                        ? 'bg-fuchsia-500/10 border border-fuchsia-500/30'
                        : 'bg-zinc-900/30 border border-transparent hover:bg-zinc-900/60 hover:border-zinc-800'
                    }`}
                  >
                    <p className="text-xs font-medium text-zinc-200 truncate">{gen.prompt}</p>
                    <p className="text-[10px] text-zinc-500 mt-1 truncate">{gen.tool} · {gen.platform}</p>
                    <p className="text-[10px] text-zinc-600 mt-1">
                      {new Date(gen.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Main Content Area */}
        <main className={`flex-1 overflow-y-auto transition-all duration-300 ${showPreview ? 'mr-0' : ''}`}>
          <div className={`mx-auto px-4 py-12 sm:px-6 lg:px-7 ${showPreview ? 'max-w-4xl' : 'max-w-6xl'}`}>
            <div className="max-w-3xl">
              <p className="text-sm text-zinc-500">Create with AI</p>
              <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white">Your OLED Creative Workspace.</h1>
              <p className="mt-4 text-base leading-7 text-zinc-400">Write text, build pipelines, generate images, and create videos in dark mode.</p>
            </div>

            <div className="mt-8 flex items-center gap-2">
              {(["write", "image", "video", "pipeline"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium capitalize transition ${
                    activeTab === tab
                      ? "border-fuchsia-500 bg-fuchsia-500/10 text-fuchsia-400"
                      : "border-zinc-900 bg-zinc-950 text-zinc-500 hover:border-zinc-800 hover:text-white"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Global Settings */}
            {(activeTab === "write" || activeTab === "pipeline") && (
              <div className="mt-8 grid gap-4 sm:grid-cols-4 rounded-2xl border border-zinc-900 bg-zinc-950 p-6">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-500">Platform</label>
                  <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="w-full rounded-lg border border-zinc-900 bg-black px-3 py-2.5 text-sm font-medium text-zinc-300 outline-none focus:border-zinc-700">
                    {platforms.map((i) => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-500">Content type</label>
                  <select value={contentType} onChange={(e) => setContentType(e.target.value)} className="w-full rounded-lg border border-zinc-900 bg-black px-3 py-2.5 text-sm font-medium text-zinc-300 outline-none focus:border-zinc-700">
                    {contentTypes.map((i) => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-500">Tone</label>
                  <select value={tone} onChange={(e) => setTone(e.target.value)} className="w-full rounded-lg border border-zinc-900 bg-black px-3 py-2.5 text-sm font-medium text-zinc-300 outline-none focus:border-zinc-700">
                    {tones.map((i) => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-500">Length</label>
                  <select value={length} onChange={(e) => setLength(e.target.value)} className="w-full rounded-lg border border-zinc-900 bg-black px-3 py-2.5 text-sm font-medium text-zinc-300 outline-none focus:border-zinc-700">
                    {lengths.map((i) => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
              </div>
            )}

            {/* --- WRITE TAB --- */}
            {activeTab === "write" && (
              <>
                <section className="mt-8 rounded-2xl border border-zinc-900 bg-zinc-950 overflow-hidden">
                  {/* Tool Selector */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-900">
                    <div>
                      <select
                        value={activeTool}
                        onChange={(e) => setActiveTool(e.target.value)}
                        className="bg-transparent text-sm font-medium text-white outline-none"
                      >
                        {tools.map((t) => (
                          <option key={t.title} value={t.title} className="bg-zinc-950 text-white">
                            {t.title}
                          </option>
                        ))}
                      </select>
                      <p className="mt-1 text-sm text-zinc-500">Tell AI what you want to create.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                      className="flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>
                      {isSidebarOpen ? "Hide" : "Show"} Posts
                    </button>
                  </div>

                  {/* Chat Area */}
                  <div className="p-6 min-h-[300px]">
                    {prompt && !isGenerating && !result && (
                      <div className="flex gap-3 mb-4">
                        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-zinc-300">You</span>
                        </div>
                        <div className="flex-1 bg-zinc-900/50 rounded-2xl rounded-tl-sm px-4 py-3 border border-zinc-800/50">
                          <p className="text-sm text-zinc-200 whitespace-pre-wrap">{prompt}</p>
                        </div>
                      </div>
                    )}

                    {(isGenerating || streamingText) && (
                      <div className="flex gap-3 mb-4">
                        <div className="w-8 h-8 rounded-full bg-fuchsia-600 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-white">AI</span>
                        </div>
                        <div className="flex-1 bg-zinc-900/50 rounded-2xl rounded-tl-sm px-4 py-3 border border-fuchsia-500/30">
                          <p className="text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed">{streamingText}</p>
                          {isGenerating && (
                            <span className="inline-block w-2 h-4 ml-1 bg-fuchsia-500 animate-pulse" />
                          )}
                        </div>
                      </div>
                    )}

                    {!prompt && !isGenerating && !result && (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-zinc-900/80 border border-zinc-800/50 flex items-center justify-center mb-4">
                          <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </div>
                        <p className="text-sm text-zinc-500 font-medium">Start a conversation</p>
                        <p className="text-xs text-zinc-600 mt-1">Enter a prompt below and AI will respond in real-time</p>
                      </div>
                    )}

                    <div ref={chatEndRef} />
                  </div>

                  {/* Input Area */}
                  <div className="border-t border-zinc-900 p-4">
                    <div className="flex gap-3">
                      <div className="flex-1 relative">
                        <textarea
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          placeholder={tools.find((t) => t.title === activeTool)?.placeholder}
                          className="w-full rounded-xl border border-zinc-900 bg-black px-4 py-3 pr-12 text-sm text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-zinc-700 resize-none"
                          rows={1}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleGenerate();
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleGenerate}
                          disabled={!prompt.trim() || isGenerating}
                          className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-fuchsia-600 text-white transition hover:bg-fuchsia-500 disabled:opacity-50"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Result Actions */}
                {result && !isGenerating && (
                  <div className="mt-6 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCreateContent}
                        disabled={isCreating}
                        className="rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:opacity-50"
                      >
                        {isCreating ? "Creating..." : "Create Content"}
                      </button>
                      <button
                        onClick={() => navigator.clipboard.writeText(result)}
                        className="rounded-xl border border-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-zinc-700 hover:text-white"
                      >
                        Copy
                      </button>
                    </div>
                    <button
                      onClick={handleGenerate}
                      disabled={!prompt.trim() || isGenerating}
                      className="rounded-xl border border-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-zinc-700 hover:text-white disabled:opacity-50"
                    >
                      Regenerate
                    </button>
                  </div>
                )}

                {error && <div className="mt-4 rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">{error}</div>}
              </>
            )}

            {/* --- PIPELINE TAB --- */}
            {activeTab === "pipeline" && (
              <section className="mt-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-medium text-white">Sequential Pipeline</h2>
                    <p className="text-sm text-zinc-500">Chain AI prompts together. The result of each step is passed to the next.</p>
                  </div>
                  <button
                    onClick={handleRunPipeline}
                    disabled={isPipelineRunning || pipelineSteps.length === 0}
                    className="rounded-xl bg-fuchsia-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-fuchsia-500 disabled:opacity-50 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" /></svg>
                    {isPipelineRunning ? "Running..." : "Run Pipeline"}
                  </button>
                </div>

                <div className="space-y-4">
                  {pipelineSteps.map((step, index) => (
                    <div key={step.id} className="rounded-2xl border border-zinc-900 bg-zinc-950 p-6 relative">
                      {pipelineSteps.length > 1 && (
                        <button onClick={() => removePipelineStep(step.id)} className="absolute top-4 right-4 text-zinc-600 hover:text-red-400">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      )}
                      <div className="flex items-center gap-3 mb-4">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-xs font-medium text-zinc-400">
                          {index + 1}
                        </span>
                        <select
                          value={step.tool}
                          onChange={(e) => updatePipelineStep(step.id, { tool: e.target.value })}
                          className="bg-transparent text-sm font-medium text-white outline-none cursor-pointer"
                        >
                          {tools.map((t) => <option key={t.title} value={t.title} className="bg-zinc-950 text-white">{t.title}</option>)}
                        </select>
                        {step.status === "running" && <span className="text-xs text-fuchsia-500 animate-pulse">Running...</span>}
                        {step.status === "done" && <span className="text-xs text-green-500">Done ✓</span>}
                      </div>
                      <textarea
                        value={step.prompt}
                        onChange={(e) => updatePipelineStep(step.id, { prompt: e.target.value })}
                        placeholder="Enter prompt for this step..."
                        className="min-h-24 w-full resize-none rounded-xl border border-zinc-900 bg-black px-4 py-4 text-sm text-zinc-200 outline-none focus:border-zinc-700 placeholder:text-zinc-700"
                      />
                      {step.error && <p className="mt-2 text-xs text-red-400">{step.error}</p>}
                      {step.result && (
                        <div className="mt-4 pt-4 border-t border-zinc-900">
                          <p className="text-xs font-medium text-zinc-500 mb-2">Output:</p>
                          <div className="text-sm text-zinc-300 bg-black border border-zinc-900 rounded-lg p-4 whitespace-pre-wrap">
                            {step.result}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  onClick={addPipelineStep}
                  className="w-full rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/50 py-4 text-sm font-medium text-zinc-500 hover:text-white hover:border-zinc-700 hover:bg-zinc-950 transition"
                >
                  + Add Step
                </button>
              </section>
            )}

            {/* --- IMAGE & VIDEO TABS --- */}
            {(activeTab === "image" || activeTab === "video") && (
              <section className="mt-8 rounded-2xl border border-zinc-900 bg-zinc-950 p-6">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={`Describe the ${activeTab} you want to generate...`}
                  className="min-h-36 w-full resize-none rounded-xl border border-zinc-900 bg-black px-4 py-4 text-sm text-zinc-200 outline-none focus:border-zinc-700 placeholder:text-zinc-700"
                />
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={activeTab === "image" ? handleImageGenerate : handleVideoGenerate}
                    disabled={!prompt.trim() || isGeneratingImage || isGeneratingVideo}
                    className="rounded-xl bg-fuchsia-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-fuchsia-500 disabled:opacity-50"
                  >
                    {activeTab === "image" ? (isGeneratingImage ? "Generating..." : "Generate Image") : (isGeneratingVideo ? "Generating..." : "Generate Video")}
                  </button>
                </div>
                
                {(imageError || videoError) && (
                  <div className="mt-4 text-sm text-red-400">{imageError || videoError}</div>
                )}
                
                {activeTab === "image" && generatedImage && !isGeneratingImage && (
                  <div className="mt-6 rounded-xl border border-zinc-900 overflow-hidden">
                    <img src={generatedImage} alt="Generated" className="w-full object-cover" />
                  </div>
                )}
                
                {activeTab === "video" && generatedVideo && !isGeneratingVideo && (
                  <div className="mt-6 rounded-xl border border-zinc-900 overflow-hidden">
                    <img src={generatedVideo} alt="Video preview" className="w-full object-cover" />
                  </div>
                )}

                {activeTab === "video" && isGeneratingVideo && (
                  <div className="mt-6">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-900">
                      <div className="h-full rounded-full bg-fuchsia-600 transition-all duration-300" style={{ width: `${videoProgress}%` }} />
                    </div>
                    <p className="mt-2 text-xs text-zinc-500 text-center">{videoProgress}% complete</p>
                  </div>
                )}
              </section>
            )}
          </div>
        </main>

        {/* Right Preview Panel */}
        <aside
          className={`border-l border-zinc-800/50 bg-[#0a0a0c] flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden ${
            showPreview ? 'w-[440px] opacity-100' : 'w-0 opacity-0'
          }`}
        >
          {showPreview && (
            <PostPreviewPanel
              content={displayResult}
              platform={platform}
              contentType={contentType}
              isGenerating={isGenerating}
              prompt={prompt}
            />
          )}
        </aside>
      </div>
    </div>
  );
}
