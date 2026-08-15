"use client";

import { useState, useEffect, useRef, type ChangeEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createContent } from "@/app/content/actions/create-content";
import { scheduleContent } from "@/app/content/actions/schedule-content";
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

type Suggestion = {
  label: string;
  instruction: string;
};

const AI_CLICHES = [
  "in today's",
  "fast-paced",
  "delve",
  "unlock",
  "elevate",
  "game-changer",
  "furthermore",
  "in conclusion",
];

// Analyzes the generated text and proposes concrete improvements.
function getSmartSuggestions(text: string, platform: string): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const lower = text.toLowerCase();

  if (!/\?/.test(text)) {
    suggestions.push({
      label: "Add a question",
      instruction:
        "Keep this content exactly as it is, but end with one short engaging question that invites comments.",
    });
  }

  if (platform === "Instagram" && !/#[a-z]/i.test(text)) {
    suggestions.push({
      label: "Add hashtags",
      instruction:
        "Keep this content and add 4 relevant hashtags on the last line.",
    });
  }

  if (AI_CLICHES.some((c) => lower.includes(c))) {
    suggestions.push({
      label: "Humanize it",
      instruction:
        "Rewrite this to sound like a real person wrote it. Remove generic phrases, keep the meaning.",
    });
  }

  if (text.split(/\s+/).length > 180) {
    suggestions.push({
      label: "Make it shorter",
      instruction:
        "Shorten this to under 120 words while keeping the strongest points.",
    });
  }

  suggestions.push({
    label: "Stronger hook",
    instruction:
      "Rewrite only the first line to be a stronger attention-grabbing hook. Keep everything else.",
  });

  return suggestions.slice(0, 4);
}

function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// Parses API responses without crashing on non-JSON bodies
// (dev overlay, HTML error pages, proxy hiccups).
async function safeJson(response: Response): Promise<Record<string, any>> {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return {
      error: `The server returned an unexpected response (${response.status}). Please try again.`,
    };
  }
}

declare global {
  interface Window {
    Razorpay?: any;
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function openRazorpayCheckout(options: {
  key: string;
  orderId: string;
  name: string;
  description: string;
}): Promise<{ razorpay_payment_id: string; razorpay_signature: string } | null> {
  return new Promise((resolve) => {
    if (!window.Razorpay) return resolve(null);
    const checkout = new window.Razorpay({
      key: options.key,
      order_id: options.orderId,
      name: options.name,
      description: options.description,
      theme: { color: "#7C3AED" },
      handler: (res: any) => resolve(res),
      modal: { ondismiss: () => resolve(null) },
    });
    checkout.open();
  });
}

type Generation = {
  id: string;
  prompt: string;
  result: string;
  tool: string;
  platform: string;
  contentType: string;
  timestamp: number;
  type?: "text" | "image" | "video";
  mediaUrl?: string;
};

type PipelineStep = {
  id: string;
  tool: string;
  title: string;
  description: string;
  prompt: string;
  status: "idle" | "running" | "done" | "error";
  result?: string;
  error?: string;
};

const PIPELINE_STAGES: {
  tool: string;
  title: string;
  description: string;
  makePrompt: (instruction: string) => string;
}[] = [
  {
    tool: "Generate Ideas",
    title: "Plan",
    description: "Finding the best angles for your topic",
    makePrompt: (instruction) => `Give 3 short, specific content angles for: ${instruction}`,
  },
  {
    tool: "Write Content",
    title: "Write",
    description: "Writing the full post",
    makePrompt: (instruction) => instruction,
  },
  {
    tool: "Write Content",
    title: "Polish",
    description: "Sharpening the hook and closing line",
    makePrompt: () =>
      "Polish this post: make the first line a stronger hook, tighten the lines, and end with a question or call-to-action. Keep the meaning.",
  },
  {
    tool: "Write Content",
    title: "Enhance",
    description: "Adding emojis, rhythm and engagement hooks",
    makePrompt: () =>
      "Enhance this post for social media: add 2-4 natural emojis, improve line rhythm and readability, and make it feel more human. Keep the same meaning and similar length.",
  },
  {
    tool: "Generate Hashtags",
    title: "Hashtags",
    description: "Generating relevant hashtags",
    makePrompt: () => "Generate the hashtag line for this post.",
  },
  {
    tool: "Generate Media Prompt",
    title: "Media Prompt",
    description: "Writing a visual prompt for image or video",
    makePrompt: () =>
      "Write a visual prompt for an image or short video that matches this post.",
  },
];

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
  const [user, setUser] = useState<{ id: string; email: string; name: string | null; plan: string } | null>(null);
  const [usage, setUsage] = useState({ used: 0, limit: 10 });
  const [showPurchase, setShowPurchase] = useState(false);
  const [purchaseBusy, setPurchaseBusy] = useState(false);
  const [purchaseError, setPurchaseError] = useState("");
  const [purchaseNotice, setPurchaseNotice] = useState("");
  const [streamingText, setStreamingText] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Pipeline state
  const [pipelineSteps, setPipelineSteps] = useState<PipelineStep[]>([]);
  const [isPipelineRunning, setIsPipelineRunning] = useState(false);
  const [pipelineDone, setPipelineDone] = useState(false);
  const [pipelineMediaPrompt, setPipelineMediaPrompt] = useState("");

  // Image & Video state
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageError, setImageError] = useState("");
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoError, setVideoError] = useState("");
  const [videoProgress, setVideoProgress] = useState(0);
  const videoProgressTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Schedule state
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [scheduleAt, setScheduleAt] = useState("");
  const [isScheduling, setIsScheduling] = useState(false);

  // Post image attachment (preview only)
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleImageAttach(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (previewImage) URL.revokeObjectURL(previewImage);
    setPreviewImage(URL.createObjectURL(file));
    event.target.value = "";
  }

  function removePreviewImage() {
    if (previewImage) URL.revokeObjectURL(previewImage);
    setPreviewImage(null);
  }

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [streamingText, result, isGenerating]);

  // Load session, usage and persisted recent generations
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [meRes, genRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/ai/generations"),
        ]);
        const me = await safeJson(meRes);
        const gens = await safeJson(genRes);
        if (cancelled) return;
        if (me.user) setUser(me.user);
        if (me.usage) setUsage(me.usage);
        if (Array.isArray(gens.items)) {
          setGenerations(
            gens.items.map((g: any) => ({
              id: g.id,
              prompt: g.prompt,
              result: g.result ?? "",
              tool: g.tool ?? "Write Content",
              platform: g.platform ?? "Instagram",
              contentType: "Post",
              timestamp: new Date(g.createdAt).getTime(),
              type: g.type === "image" || g.type === "video" ? g.type : "text",
              mediaUrl: g.type === "text" ? undefined : g.result ?? undefined,
            })),
          );
        }
      } catch {
        // keep defaults when offline
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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

  const limitReached = user?.plan !== "PRO" && usage.used >= usage.limit;

  function recordGeneration(entry: {
    type: "text" | "image" | "video";
    prompt: string;
    result: string;
    tool?: string;
    platform?: string;
  }) {
    setUsage((prev) => ({ ...prev, used: prev.used + 1 }));
    void fetch("/api/ai/generations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    }).catch(() => {});
  }

  async function runGeneration(opts: {
    promptText: string;
    tool?: string;
    context?: string;
  }) {
    if (!opts.promptText.trim() || isGenerating) return;
    if (limitReached) {
      setShowPurchase(true);
      return;
    }

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
          prompt: opts.promptText.trim(),
          tool: opts.tool ?? activeTool,
          platform,
          contentType,
          tone,
          length,
          context: opts.context ?? "",
        }),
      });

      const data = await safeJson(response);
      if (!response.ok) throw new Error(data.error || "Generation failed.");
      
      const finalResult = data.result || "";
      
      // Add to generations history
      const newGeneration: Generation = {
        id: generationId,
        prompt: prompt.trim() || opts.promptText.trim(),
        result: finalResult,
        tool: opts.tool ?? activeTool,
        platform,
        contentType,
        timestamp: Date.now(),
        type: "text",
      };
      
      setGenerations((prev) => [newGeneration, ...prev]);
      recordGeneration({
        type: "text",
        prompt: newGeneration.prompt,
        result: finalResult,
        tool: newGeneration.tool,
        platform,
      });
      
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

  function handleGenerate() {
    runGeneration({ promptText: prompt });
  }

  function handleSuggestion(suggestion: Suggestion) {
    if (!result.trim()) return;
    runGeneration({
      promptText: suggestion.instruction,
      tool: "Write Content",
      context: result,
    });
  }

  function loadGeneration(gen: Generation) {
    setPrompt(gen.prompt);
    setActiveGenerationId(gen.id);
    setStreamingText("");
    if (gen.type === "image") {
      setActiveTab("image");
      setGeneratedImage(gen.mediaUrl ?? null);
      return;
    }
    if (gen.type === "video") {
      setActiveTab("video");
      setGeneratedVideo(gen.mediaUrl ?? null);
      return;
    }
    setResult(gen.result);
    setActiveTool(gen.tool);
    setPlatform(gen.platform);
    setContentType(gen.contentType);
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

  function openScheduler() {
    if (!scheduleAt) {
      // Default: tomorrow at 9:00 AM local time
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      tomorrow.setHours(9, 0, 0, 0);
      setScheduleAt(toLocalInputValue(tomorrow));
    }
    setIsScheduleOpen(true);
  }

  async function handleSchedule() {
    if (!result.trim() || !scheduleAt || isScheduling) return;
    setIsScheduling(true);
    setError("");

    try {
      const content = await createContent({
        title: prompt.trim().slice(0, 80) || `${activeTool} — ${platform}`,
        body: result.trim(),
        platform: platform || null,
      });
      await scheduleContent(content.id, scheduleAt);
      router.push("/calendar");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Could not schedule content.");
      setIsScheduling(false);
    }
  }

  // Pipeline handlers
  async function handleRunPipeline() {
    if (isPipelineRunning || !prompt.trim()) return;
    if (limitReached) {
      setShowPurchase(true);
      return;
    }
    setIsPipelineRunning(true);
    setPipelineDone(false);
    setResult("");
    setError("");

    const steps: PipelineStep[] = PIPELINE_STAGES.map((stage, index) => ({
      id: String(index + 1),
      tool: stage.tool,
      title: stage.title,
      description: stage.description,
      prompt: stage.makePrompt(prompt.trim()),
      status: "idle",
    }));
    setPipelineSteps(steps);

    let context = "";
    let postText = "";
    let hashtags = "";
    let mediaPrompt = "";

    for (const step of steps) {
      setPipelineSteps((prev) => prev.map((s) => (s.id === step.id ? { ...s, status: "running" } : s)));
      try {
        const response = await fetch("/api/ai/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: step.prompt,
            tool: step.tool,
            platform,
            contentType,
            tone,
            length,
            context,
          }),
        });

        const data = await safeJson(response);
        if (!response.ok) throw new Error(data.error || "Pipeline step failed.");
        if (!data.result?.trim()) throw new Error("AI returned an empty result.");

        context = data.result.trim();
        if (step.title === "Polish" || step.title === "Enhance") postText = context;
        if (step.title === "Hashtags") hashtags = context;
        if (step.title === "Media Prompt") mediaPrompt = context;
        setPipelineSteps((prev) => prev.map((s) => (s.id === step.id ? { ...s, status: "done", result: context } : s)));
      } catch (err) {
        const message = err instanceof Error ? err.message : "Pipeline step failed.";
        setPipelineSteps((prev) => prev.map((s) => (s.id === step.id ? { ...s, status: "error", error: message } : s)));
        setIsPipelineRunning(false);
        return;
      }
    }

    setResult(hashtags ? `${postText}\n\n${hashtags}` : postText);
    setPipelineMediaPrompt(mediaPrompt);
    setPipelineDone(true);
    recordGeneration({
      type: "text",
      prompt: prompt.trim(),
      result: hashtags ? `${postText}\n\n${hashtags}` : postText,
      tool: "Pipeline",
      platform,
    });
    setIsPipelineRunning(false);

    // Automatically generate a matching image from the AI-written media prompt.
    if (mediaPrompt) void handleImageGenerate(mediaPrompt);
  }

  // Image & Video handlers (real generation via /api/ai/image + /api/ai/video)
  async function handleImageGenerate(customPrompt?: string) {
    const imagePrompt = (customPrompt ?? prompt).trim();
    if (!imagePrompt || isGeneratingImage) return;
    if (limitReached) {
      setShowPurchase(true);
      return;
    }
    setIsGeneratingImage(true);
    setGeneratedImage(null);
    setImageError("");

    try {
      const response = await fetch("/api/ai/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: imagePrompt,
          negativePrompt: "",
          width: 1024,
          height: 1024,
        }),
      });

      const data = await safeJson(response);
      if (!response.ok) throw new Error(data.error || "Image generation failed.");
      if (!data.success || !data.url) throw new Error("No image returned.");

      setGeneratedImage(data.url);
      recordGeneration({ type: "image", prompt: imagePrompt, result: data.url });
      setGenerations((prev) => [
        {
          id: `img-${Date.now()}`,
          prompt: imagePrompt,
          result: data.url,
          tool: "Image",
          platform,
          contentType: "Image",
          timestamp: Date.now(),
          type: "image",
          mediaUrl: data.url,
        },
        ...prev,
      ]);
    } catch (err) {
      setImageError(err instanceof Error ? err.message : "Image generation failed. Please try again.");
    } finally {
      setIsGeneratingImage(false);
    }
  }

  async function handleVideoGenerate(customPrompt?: string) {
    const videoPrompt = (customPrompt ?? prompt).trim();
    if (!videoPrompt || isGeneratingVideo) return;
    if (limitReached) {
      setShowPurchase(true);
      return;
    }
    setIsGeneratingVideo(true);
    setGeneratedVideo(null);
    setVideoError("");
    setVideoProgress(5);

    // Creep toward 90% while the server renders frames + encodes the clip.
    videoProgressTimer.current = setInterval(() => {
      setVideoProgress((value) => Math.min(value + Math.random() * 6, 90));
    }, 2500);

    try {
      const response = await fetch("/api/ai/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: videoPrompt,
          negativePrompt: "",
          width: 832,
          height: 480,
          fps: 24,
        }),
      });

      const data = await safeJson(response);
      if (!response.ok) throw new Error(data.error || "Video generation failed.");
      if (!data.success || !data.url) throw new Error("No video returned.");

      setVideoProgress(100);
      setGeneratedVideo(data.url);
      recordGeneration({ type: "video", prompt: videoPrompt, result: data.url });
      setGenerations((prev) => [
        {
          id: `vid-${Date.now()}`,
          prompt: videoPrompt,
          result: data.url,
          tool: "Video",
          platform,
          contentType: "Video",
          timestamp: Date.now(),
          type: "video",
          mediaUrl: data.url,
        },
        ...prev,
      ]);
    } catch (err) {
      setVideoError(err instanceof Error ? err.message : "Video generation failed. Please try again.");
    } finally {
      if (videoProgressTimer.current) {
        clearInterval(videoProgressTimer.current);
        videoProgressTimer.current = null;
      }
      setIsGeneratingVideo(false);
    }
  }

  // ── Subscription purchase (Razorpay with test-mode fallback) ──
  async function handlePurchase() {
    if (purchaseBusy) return;
    setPurchaseBusy(true);
    setPurchaseError("");
    setPurchaseNotice("");

    try {
      const orderRes = await fetch("/api/billing/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "PRO" }),
      });
      const order = await safeJson(orderRes);
      if (!orderRes.ok) {
        setPurchaseError(order.error || "Could not start the payment.");
        return;
      }

      let paymentId = "pay_simulated";
      let signature = "";

      if (!order.simulated) {
        const loaded = await loadRazorpayScript();
        if (!loaded) {
          setPurchaseError("Could not load Razorpay checkout. Check your connection.");
          return;
        }
        const paid = await openRazorpayCheckout({
          key: order.keyId,
          orderId: order.orderId,
          name: "octa-studio",
          description: "PRO subscription — unlimited AI generations",
        });
        if (!paid) {
          setPurchaseError("Payment was cancelled.");
          return;
        }
        paymentId = paid.razorpay_payment_id;
        signature = paid.razorpay_signature;
      } else {
        setPurchaseNotice("Test mode: Razorpay keys not configured — activating PRO without charge.");
      }

      const verifyRes = await fetch("/api/billing/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.orderId, paymentId, signature }),
      });
      const verify = await safeJson(verifyRes);
      if (!verifyRes.ok || !verify.success) {
        setPurchaseError(verify.error || "Payment verification failed.");
        return;
      }

      setUser(verify.user);
      setPurchaseNotice("PRO activated — unlimited AI generations unlocked.");
      window.setTimeout(() => setShowPurchase(false), 1400);
    } finally {
      setPurchaseBusy(false);
    }
  }

  // Primary prompt bar state (shared across all tabs)
  const primaryBusy =
    activeTab === "write"
      ? isGenerating
      : activeTab === "image"
      ? isGeneratingImage
      : activeTab === "video"
      ? isGeneratingVideo
      : isPipelineRunning;

  const primaryLabel = primaryBusy
    ? activeTab === "pipeline"
      ? "Running..."
      : "Generating..."
    : activeTab === "image"
    ? "Generate Image"
    : activeTab === "video"
    ? "Generate Video"
    : activeTab === "pipeline"
    ? "Run Pipeline"
    : "Generate";

  const primaryPlaceholder =
    activeTab === "image"
      ? "Describe the image you want to generate..."
      : activeTab === "video"
      ? "Describe the video you want to generate..."
      : activeTab === "pipeline"
      ? "Describe the post you want..."
      : tools.find((t) => t.title === activeTool)?.placeholder ?? "Type a prompt...";

  function handlePrimaryAction() {
    if (activeTab === "write") void handleGenerate();
    else if (activeTab === "image") void handleImageGenerate();
    else if (activeTab === "video") void handleVideoGenerate();
    else void handleRunPipeline();
  }

  // Sparkle button: drop a ready-to-run example into the prompt bar.
  function insertExample() {
    if (activeTab === "image") {
      setPrompt("A futuristic creator workspace, dark theme, purple neon accents");
    } else if (activeTab === "video") {
      setPrompt("Ocean waves at sunset, cinematic slow motion");
    } else if (activeTab === "pipeline") {
      setPrompt("Why consistency beats motivation for creators");
    } else {
      const example =
        tools.find((t) => t.title === activeTool)?.placeholder ??
        "AI tools for developers";
      setPrompt(example.replace(/^Example:\s*/, ""));
    }
  }

  const showPreview = activeTab === "write" && isPreviewOpen;
  const displayResult = streamingText || result;

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white">
      <header className="flex h-16 items-center border-b border-zinc-800 bg-[#0a0a0c] px-4 sm:px-6 lg:px-8">
        <Link href="/calendar" className="mr-4 flex items-center text-sm font-medium text-zinc-500 hover:text-white transition">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back to Workspace
        </Link>
        <span className="text-sm font-medium text-zinc-400 border-l border-zinc-800 pl-4">Draft once. Preview everywhere.</span>
        <div className="ml-auto flex items-center gap-3">
          {user ? (
            <span className="hidden max-w-[160px] truncate text-xs text-zinc-500 sm:block">{user.name || user.email}</span>
          ) : (
            <Link href="/login?next=/ai-studio" className="text-xs font-medium text-zinc-400 transition hover:text-white">
              Sign in
            </Link>
          )}
          {user?.plan === "PRO" ? (
            <span className="rounded-full border border-[#7C3AED]/40 bg-[#7C3AED]/10 px-2.5 py-1 text-[10px] font-semibold text-violet-300">PRO</span>
          ) : (
            <>
              <span className="hidden text-[10px] text-zinc-500 sm:block">{usage.used}/{usage.limit} free generations</span>
              <button
                type="button"
                onClick={() => setShowPurchase(true)}
                className="rounded-full bg-[#7C3AED] px-3 py-1 text-[10px] font-semibold text-white transition hover:bg-[#6D28D9]"
              >
                Upgrade
              </button>
            </>
          )}
        </div>
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
                        ? 'bg-[#7C3AED]/15 border border-[#7C3AED]/40'
                        : 'bg-zinc-900/30 border border-transparent hover:bg-zinc-900/60 hover:border-zinc-800'
                    }`}
                  >
                    <p className="text-xs font-medium text-zinc-200 truncate">{gen.prompt}</p>
                    <p className="text-[10px] text-zinc-500 mt-1 truncate">
                      {gen.type === "image" ? "Image" : gen.type === "video" ? "Video" : gen.tool} · {gen.platform}
                    </p>
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
          <div className={`mx-auto px-4 py-8 sm:px-6 lg:px-7 ${showPreview ? 'max-w-4xl' : 'max-w-6xl'}`}>
            <div className="max-w-3xl">
              <h1 className="text-3xl font-semibold tracking-tight text-white">
                Draft once. <span className="text-violet-400">Preview everywhere.</span>
              </h1>
              <p className="mt-2 text-sm leading-6 text-zinc-500">Write posts, chain pipelines, and generate images or videos — with a live preview on phone, tablet, and MacBook.</p>
            </div>

            {/* Primary prompt bar */}
            <div className="mt-6 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-2.5 backdrop-blur-xl transition-colors focus-within:border-white/25">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageAttach}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Add image to post"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-zinc-400 transition hover:border-white/25 hover:text-white"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
              {previewImage && (
                <span className="relative shrink-0">
                  <img
                    src={previewImage}
                    alt="Attached post media"
                    className="h-9 w-9 rounded-xl border border-zinc-800 object-cover"
                  />
                  <button
                    type="button"
                    onClick={removePreviewImage}
                    title="Remove image"
                    className="absolute -right-1.5 -top-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-zinc-800 text-zinc-300 transition hover:bg-red-500 hover:text-white"
                  >
                    <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </span>
              )}
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={primaryPlaceholder}
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handlePrimaryAction();
                  }
                }}
                className="max-h-40 flex-1 resize-none bg-transparent px-1 py-1.5 text-sm text-zinc-200 outline-none placeholder:text-zinc-600"
              />
              <button
                type="button"
                onClick={insertExample}
                title="Try an example prompt"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-zinc-400 transition hover:border-white/25 hover:text-violet-300"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" /></svg>
              </button>
              <button
                type="button"
                onClick={handlePrimaryAction}
                disabled={!prompt.trim() || !!primaryBusy}
                className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-[#7C3AED] px-4 text-sm font-medium text-white transition hover:bg-[#6D28D9] disabled:opacity-50"
              >
                {primaryBusy && (
                  <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>
                )}
                {primaryLabel}
              </button>
            </div>

            {/* Mode chips */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {(["write", "image", "video", "pipeline"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-medium capitalize transition ${
                    activeTab === tab
                      ? "border-[#7C3AED]/60 bg-[#7C3AED]/15 text-violet-300"
                      : "border-zinc-800 bg-black text-zinc-500 hover:border-zinc-700 hover:text-zinc-200"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Global Settings */}
            {(activeTab === "write" || activeTab === "pipeline") && (
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                <label className="flex items-center gap-1.5 text-xs font-medium text-zinc-600">
                  Platform
                  <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="rounded-lg border border-zinc-800 bg-[#0c0c0e] px-2.5 py-1.5 text-xs font-medium text-zinc-300 outline-none focus:border-zinc-700">
                    {platforms.map((i) => <option key={i} value={i}>{i}</option>)}
                  </select>
                </label>
                <label className="flex items-center gap-1.5 text-xs font-medium text-zinc-600">
                  Content type
                  <select value={contentType} onChange={(e) => setContentType(e.target.value)} className="rounded-lg border border-zinc-800 bg-[#0c0c0e] px-2.5 py-1.5 text-xs font-medium text-zinc-300 outline-none focus:border-zinc-700">
                    {contentTypes.map((i) => <option key={i} value={i}>{i}</option>)}
                  </select>
                </label>
                <label className="flex items-center gap-1.5 text-xs font-medium text-zinc-600">
                  Tone
                  <select value={tone} onChange={(e) => setTone(e.target.value)} className="rounded-lg border border-zinc-800 bg-[#0c0c0e] px-2.5 py-1.5 text-xs font-medium text-zinc-300 outline-none focus:border-zinc-700">
                    {tones.map((i) => <option key={i} value={i}>{i}</option>)}
                  </select>
                </label>
                <label className="flex items-center gap-1.5 text-xs font-medium text-zinc-600">
                  Length
                  <select value={length} onChange={(e) => setLength(e.target.value)} className="rounded-lg border border-zinc-800 bg-[#0c0c0e] px-2.5 py-1.5 text-xs font-medium text-zinc-300 outline-none focus:border-zinc-700">
                    {lengths.map((i) => <option key={i} value={i}>{i}</option>)}
                  </select>
                </label>
              </div>
            )}

            {/* --- WRITE TAB --- */}
            {activeTab === "write" && (
              <>
                <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden">
                  {/* Tool Selector */}
                  <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        {tools.map((t) => (
                          <button
                            key={t.title}
                            type="button"
                            onClick={() => setActiveTool(t.title)}
                            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
                              activeTool === t.title
                                ? "border-[#7C3AED]/60 bg-[#7C3AED]/15 text-violet-300"
                                : "border-zinc-800 bg-black text-zinc-500 hover:border-zinc-700 hover:text-zinc-200"
                            }`}
                          >
                            {t.title}
                          </button>
                        ))}
                      </div>
                      <p className="mt-2 text-xs text-zinc-600">Tell AI what you want to create.</p>
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
                  <div className="p-5 min-h-[280px]">
                    {prompt && (isGenerating || Boolean(result)) && (
                      <div className="flex justify-end mb-4">
                        <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-[#7C3AED]/15 border border-[#7C3AED]/25 px-4 py-3">
                          <p className="text-sm text-zinc-100 whitespace-pre-wrap">{prompt}</p>
                        </div>
                      </div>
                    )}

                    {(isGenerating || streamingText) && (
                      <div className="flex gap-3 mb-4">
                        <div className="w-8 h-8 rounded-full bg-[#7C3AED] flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-white">AI</span>
                        </div>
                        <div className="flex-1 bg-zinc-900/50 rounded-2xl rounded-tl-sm px-4 py-3 border border-[#7C3AED]/40">
                          <p className="text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed">{streamingText}</p>
                          {isGenerating && (
                            <span className="inline-block w-2 h-4 ml-1 bg-[#7C3AED] animate-pulse" />
                          )}
                        </div>
                      </div>
                    )}

                    {!isGenerating && !result && !streamingText && (
                      <div className="flex flex-col items-center justify-center py-10 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-zinc-900/80 border border-zinc-800/50 flex items-center justify-center mb-3">
                          <svg className="w-6 h-6 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </div>
                        <p className="text-sm text-zinc-500 font-medium">Start a conversation</p>
                        <p className="text-xs text-zinc-600 mt-1">Enter a prompt above and AI will respond in real-time</p>
                      </div>
                    )}

                    <div ref={chatEndRef} />
                  </div>
                </section>



                {/* AI Assistant */}
                <section className="mt-5 rounded-2xl border border-[#7C3AED]/30 bg-gradient-to-br from-[#7C3AED]/10 via-zinc-950 to-zinc-950 p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#7C3AED] to-violet-600">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" /></svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-white">AI Assistant</p>
                      <p className="mt-1 text-sm leading-6 text-zinc-400">
                        {isGenerating
                          ? "Writing your post now — clean text, human tone, no markdown symbols."
                          : result
                          ? "Nice draft. Polish it with a smart suggestion below, or schedule it to go live automatically."
                          : "Pick a tool, describe your topic, and press Enter. I will draft it, improve it, and schedule it for you."}
                      </p>

                      {result && !isGenerating && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {getSmartSuggestions(result, platform).map((s) => (
                            <button
                              key={s.label}
                              type="button"
                              onClick={() => handleSuggestion(s)}
                              className="inline-flex items-center gap-1.5 rounded-full border border-[#7C3AED]/40 bg-black/40 px-3 py-1.5 text-xs font-medium text-violet-300 transition hover:border-[#8B5CF6] hover:bg-[#6D28D9]/10"
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M10 1l2.2 5.3L18 8l-5.8 1.7L10 15l-2.2-5.3L2 8l5.8-1.7L10 1z" /></svg>
                              {s.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                {/* Result Actions */}
                {result && !isGenerating && (
                  <div className="mt-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleCreateContent}
                          disabled={isCreating}
                          className="rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:opacity-50"
                        >
                          {isCreating ? "Creating..." : "Create Content"}
                        </button>
                        <button
                          onClick={openScheduler}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-[#7C3AED] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#6D28D9]"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          Schedule
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

                    {isScheduleOpen && (
                      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                        <label className="text-sm font-medium text-zinc-400" htmlFor="schedule-at">
                          Publish at
                        </label>
                        <input
                          id="schedule-at"
                          type="datetime-local"
                          value={scheduleAt}
                          min={toLocalInputValue(new Date(Date.now() + 5 * 60 * 1000))}
                          onChange={(e) => setScheduleAt(e.target.value)}
                          className="rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-200 outline-none focus:border-[#7C3AED]/60"
                        />
                        <button
                          onClick={handleSchedule}
                          disabled={!scheduleAt || isScheduling}
                          className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:opacity-50"
                        >
                          {isScheduling ? "Scheduling..." : "Confirm Schedule"}
                        </button>
                        <button
                          onClick={() => setIsScheduleOpen(false)}
                          className="rounded-xl border border-zinc-800 px-4 py-2 text-sm font-medium text-zinc-400 transition hover:border-zinc-700 hover:text-white"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {error && <div className="mt-4 rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">{error}</div>}
              </>
            )}

            {/* --- PIPELINE TAB --- */}
            {activeTab === "pipeline" && (
              <section className="mt-6 space-y-5">
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
                  <h2 className="text-lg font-medium text-white">Sequential Pipeline</h2>
                  <p className="mt-1 text-sm text-zinc-500">
                    Give one instruction in the prompt bar above — the pipeline plans, writes, enhances, adds hashtags, and generates a matching image automatically.
                  </p>
                </div>

                {pipelineSteps.length > 0 && (
                  <ol className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
                    {pipelineSteps.map((step, index) => (
                      <li key={step.id} className="relative flex gap-4 pb-8 last:pb-0">
                        {index < pipelineSteps.length - 1 && (
                          <span
                            className={`absolute left-[13px] top-8 h-[calc(100%-2rem)] w-px ${
                              step.status === "done" ? "bg-[#7C3AED]" : "bg-zinc-800"
                            }`}
                          />
                        )}
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                            step.status === "done"
                              ? "border-[#7C3AED] bg-[#7C3AED]/15 text-violet-300"
                              : step.status === "running"
                              ? "border-[#7C3AED] bg-[#7C3AED]/10 text-violet-300"
                              : step.status === "error"
                              ? "border-red-500/50 bg-red-500/10 text-red-400"
                              : "border-zinc-800 bg-zinc-900 text-zinc-500"
                          }`}
                        >
                          {step.status === "done" ? (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                          ) : step.status === "running" ? (
                            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>
                          ) : step.status === "error" ? (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                          ) : (
                            index + 1
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-baseline gap-x-2">
                            <p className="text-sm font-medium text-white">{step.title}</p>
                            <p className="text-xs text-zinc-500">{step.description}</p>
                            {step.status === "running" && <p className="text-xs text-violet-400 animate-pulse">working…</p>}
                          </div>
                          {step.error && <p className="mt-1 text-xs text-red-400">{step.error}</p>}
                          {step.status === "done" && step.result && (
                            <div className="mt-2 max-h-28 overflow-y-auto rounded-lg border border-zinc-800 bg-[#0c0c0e] p-3 text-xs leading-5 text-zinc-400 whitespace-pre-wrap">
                              {step.result}
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                )}

                {pipelineDone && result && !isPipelineRunning && (
                  <div className="rounded-2xl border border-[#7C3AED]/40 bg-[#7C3AED]/10 p-6">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-violet-300" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.7-9.3a1 1 0 00-1.4-1.4L9 10.6 7.7 9.3a1 1 0 00-1.4 1.4l2 2a1 1 0 001.4 0l4-4z" clipRule="evenodd" /></svg>
                      <p className="text-sm font-semibold text-white">Your post is ready</p>
                    </div>
                    <div className="mt-3 max-h-56 overflow-y-auto rounded-xl border border-zinc-800 bg-[#0c0c0e] p-4">
                      <p className="whitespace-pre-wrap text-sm leading-6 text-zinc-200">{result}</p>
                    </div>

                    {/* Auto-generated media for this post */}
                    <div className="mt-4">
                      {isGeneratingImage && (
                        <div className="flex items-center gap-2.5 rounded-xl border border-zinc-800 bg-zinc-950 p-3">
                          <div className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-[#7C3AED] border-t-transparent" />
                          <p className="text-xs text-zinc-400">Generating a matching image for your post…</p>
                        </div>
                      )}
                      {!isGeneratingImage && (generatedImage || generatedVideo) && (
                        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
                          {generatedVideo ? (
                            <video src={generatedVideo} controls autoPlay loop playsInline muted className="w-full" />
                          ) : (
                            <img src={generatedImage ?? undefined} alt="Generated for this post" className="w-full object-cover" />
                          )}
                        </div>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => handleVideoGenerate(pipelineMediaPrompt)}
                          disabled={!pipelineMediaPrompt || isGeneratingVideo || isGeneratingImage}
                          className="rounded-xl border border-zinc-800 px-3.5 py-2 text-xs font-medium text-zinc-300 transition hover:border-zinc-700 hover:text-white disabled:opacity-50"
                        >
                          {isGeneratingVideo ? "Rendering video..." : "Generate Video"}
                        </button>
                        <button
                          onClick={() => handleImageGenerate(pipelineMediaPrompt)}
                          disabled={!pipelineMediaPrompt || isGeneratingImage}
                          className="rounded-xl border border-zinc-800 px-3.5 py-2 text-xs font-medium text-zinc-300 transition hover:border-zinc-700 hover:text-white disabled:opacity-50"
                        >
                          Regenerate Image
                        </button>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="rounded-xl border border-zinc-800 px-3.5 py-2 text-xs font-medium text-zinc-300 transition hover:border-zinc-700 hover:text-white"
                        >
                          Add Your Image
                        </button>
                      </div>
                      {previewImage && (
                        <p className="mt-1.5 text-[10px] text-zinc-500">Your attached image is shown in the live preview post.</p>
                      )}
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <button
                        onClick={openScheduler}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#7C3AED] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#6D28D9]"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        Schedule
                      </button>
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
                    {isScheduleOpen && (
                      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                        <label className="text-sm font-medium text-zinc-400" htmlFor="pipeline-schedule-at">
                          Publish at
                        </label>
                        <input
                          id="pipeline-schedule-at"
                          type="datetime-local"
                          value={scheduleAt}
                          min={toLocalInputValue(new Date(Date.now() + 5 * 60 * 1000))}
                          onChange={(e) => setScheduleAt(e.target.value)}
                          className="rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-200 outline-none focus:border-[#7C3AED]/60"
                        />
                        <button
                          onClick={handleSchedule}
                          disabled={!scheduleAt || isScheduling}
                          className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:opacity-50"
                        >
                          {isScheduling ? "Scheduling..." : "Confirm Schedule"}
                        </button>
                        <button
                          onClick={() => setIsScheduleOpen(false)}
                          className="rounded-xl border border-zinc-800 px-4 py-2 text-sm font-medium text-zinc-400 transition hover:border-zinc-700 hover:text-white"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </section>
            )}

            {/* --- IMAGE & VIDEO TABS --- */}
            {(activeTab === "image" || activeTab === "video") && (
              <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
                {(imageError || videoError) && (
                  <div className="text-sm text-red-400">{imageError || videoError}</div>
                )}

                {activeTab === "image" && isGeneratingImage && (
                  <div className="flex flex-col items-center gap-3 py-10">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#7C3AED] border-t-transparent" />
                    <p className="text-xs text-zinc-500">Generating your image…</p>
                  </div>
                )}

                {activeTab === "image" && generatedImage && !isGeneratingImage && (
                  <div className="rounded-xl border border-zinc-800 overflow-hidden">
                    <img src={generatedImage} alt="Generated" className="w-full object-cover" />
                  </div>
                )}

                {activeTab === "image" && !isGeneratingImage && !generatedImage && !imageError && (
                  <p className="py-10 text-center text-xs text-zinc-600">
                    Describe the image in the prompt bar above, then press Generate Image.
                  </p>
                )}

                {activeTab === "video" && generatedVideo && !isGeneratingVideo && (
                  <div className="rounded-xl border border-zinc-800 overflow-hidden">
                    <video src={generatedVideo} controls autoPlay loop playsInline className="w-full" />
                  </div>
                )}

                {activeTab === "video" && isGeneratingVideo && (
                  <div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-900">
                      <div className="h-full rounded-full bg-[#7C3AED] transition-all duration-300" style={{ width: `${videoProgress}%` }} />
                    </div>
                    <p className="mt-2 text-xs text-zinc-500 text-center">{videoProgress}% complete</p>
                  </div>
                )}

                {activeTab === "video" && !isGeneratingVideo && !generatedVideo && !videoError && (
                  <p className="py-10 text-center text-xs text-zinc-600">
                    Describe the video in the prompt bar above, then press Generate Video.
                  </p>
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
            <div className="h-full">
              <PostPreviewPanel
                content={displayResult}
                platform={platform}
                contentType={contentType}
                isGenerating={isGenerating}
                prompt={prompt}
                imageUrl={previewImage}
              />
            </div>
          )}
        </aside>
      </div>

      {showPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Unlock unlimited AI</h2>
                <p className="mt-1 text-xs text-zinc-500">
                  You used all {usage.limit} free generations. Go PRO to keep creating.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPurchase(false)}
                className="rounded-lg p-1 text-zinc-500 transition hover:bg-zinc-900 hover:text-white"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="mt-5 rounded-xl border border-[#7C3AED]/40 bg-[#7C3AED]/10 p-4">
              <div className="flex items-baseline justify-between">
                <p className="text-sm font-semibold text-white">octa-studio PRO</p>
                <p className="text-sm font-semibold text-violet-300">₹999<span className="text-[10px] text-zinc-500">/month</span></p>
              </div>
              <ul className="mt-3 space-y-1.5 text-xs text-zinc-300">
                <li>· Unlimited AI text, image & video generations</li>
                <li>· Full pipeline automation</li>
                <li>· Priority generation queue</li>
              </ul>
            </div>

            {purchaseError && (
              <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">{purchaseError}</p>
            )}
            {purchaseNotice && (
              <p className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">{purchaseNotice}</p>
            )}

            {user ? (
              <button
                type="button"
                onClick={() => void handlePurchase()}
                disabled={purchaseBusy}
                className="mt-5 w-full rounded-xl bg-[#7C3AED] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#6D28D9] disabled:opacity-60"
              >
                {purchaseBusy ? "Processing..." : "Buy with Razorpay"}
              </button>
            ) : (
              <div className="mt-5 grid gap-2">
                <Link href="/signup?next=/ai-studio" className="rounded-xl bg-[#7C3AED] px-4 py-2.5 text-center text-sm font-medium text-white transition hover:bg-[#6D28D9]">
                  Sign up to buy PRO
                </Link>
                <Link href="/login?next=/ai-studio" className="rounded-xl border border-zinc-800 px-4 py-2.5 text-center text-sm font-medium text-zinc-300 transition hover:border-zinc-700 hover:text-white">
                  Sign in
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
