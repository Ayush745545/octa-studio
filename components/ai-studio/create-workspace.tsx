"use client";

import { useState, useEffect, useRef, type ChangeEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createContent } from "@/app/content/actions/create-content";
import { scheduleContent } from "@/app/content/actions/schedule-content";
import { PostPreviewPanel } from "@/components/ai-studio/post-preview-panel";
import { STUDIO_TOOLS, VOICES, type StudioMode, type Voice } from "@/lib/ai/studio-templates";

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

const IMAGE_RATIOS = [
  { label: "2:3", width: 832, height: 1248 },
  { label: "1:1", width: 1024, height: 1024 },
  { label: "16:9", width: 1344, height: 768 },
  { label: "9:16", width: 768, height: 1344 },
];

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
async function safeJson(response: Response): Promise<Record<string, unknown>> {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return {
      error: `The server returned an unexpected response (${response.status}). Please try again.`,
    };
  }
}

function readString(data: Record<string, unknown>, key: string): string {
  const value = data[key];
  return typeof value === "string" ? value : "";
}

type RazorpayResponse = { razorpay_payment_id: string; razorpay_signature: string };

type RazorpayOptions = {
  key: string;
  order_id: string;
  name: string;
  description: string;
  theme: { color: string };
  handler: (response: RazorpayResponse) => void;
  modal: { ondismiss: () => void };
};

type RazorpayInstance = { open: () => void };

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
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
}): Promise<RazorpayResponse | null> {
  return new Promise((resolve) => {
    const Razorpay = window.Razorpay;
    if (!Razorpay) return resolve(null);
    const checkout = new Razorpay({
      key: options.key,
      order_id: options.orderId,
      name: options.name,
      description: options.description,
      theme: { color: "#7C3AED" },
      handler: (res) => resolve(res),
      modal: { ondismiss: () => resolve(null) },
    });
    checkout.open();
  });
}

type GenerationType = "text" | "image" | "video" | "voice";

type Generation = {
  id: string;
  prompt: string;
  result: string;
  tool: string;
  platform: string;
  contentType: string;
  timestamp: number;
  type: GenerationType;
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

function isStudioMode(value: string | null): value is StudioMode {
  return value === "image" || value === "video" || value === "voice" || value === "write" || value === "pipeline";
}

export function CreateWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode");
  const initialPrompt = searchParams.get("prompt") ?? "";

  const [activeTab, setActiveTab] = useState<StudioMode>(isStudioMode(initialMode) ? initialMode : "image");
  const [prompt, setPrompt] = useState(initialPrompt);
  const [result, setResult] = useState("");
  const [activeTool, setActiveTool] = useState("Generate Ideas");
  const [platform, setPlatform] = useState("Instagram");
  const [contentType, setContentType] = useState("Post");
  const [tone, setTone] = useState("Engaging");
  const [length, setLength] = useState("Medium");
  const [ratio, setRatio] = useState(IMAGE_RATIOS[1]);
  const [batchSize, setBatchSize] = useState(1);
  const [voice, setVoice] = useState<Voice>("alloy");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(true);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [user, setUser] = useState<{ id: string; email: string; name: string | null; plan: string } | null>(null);
  const [usage, setUsage] = useState({ used: 0, limit: 10 });
  const [showPurchase, setShowPurchase] = useState(false);
  const [purchaseBusy, setPurchaseBusy] = useState(false);
  const [purchaseError, setPurchaseError] = useState("");
  const [purchaseNotice, setPurchaseNotice] = useState("");
  const [streamingText, setStreamingText] = useState("");

  // Pipeline state
  const [pipelineSteps, setPipelineSteps] = useState<PipelineStep[]>([]);
  const [isPipelineRunning, setIsPipelineRunning] = useState(false);
  const [pipelineDone, setPipelineDone] = useState(false);
  const [pipelineMediaPrompt, setPipelineMediaPrompt] = useState("");

  // Media state
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [imageError, setImageError] = useState("");
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoError, setVideoError] = useState("");
  const [videoProgress, setVideoProgress] = useState(0);
  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);
  const [voiceError, setVoiceError] = useState("");
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
        if (me.user) setUser(me.user as typeof user);
        if (me.usage) setUsage(me.usage as { used: number; limit: number });
        if (Array.isArray(gens.items)) {
          setGenerations(
            (gens.items as Record<string, string>[]).map((g) => {
              const type: GenerationType =
                g.type === "image" || g.type === "video" || g.type === "voice" ? g.type : "text";
              return {
                id: g.id,
                prompt: g.prompt,
                result: g.result ?? "",
                tool: g.tool ?? "Write Content",
                platform: g.platform ?? "Instagram",
                contentType: "Post",
                timestamp: new Date(g.createdAt).getTime(),
                type,
                mediaUrl: type === "text" ? undefined : g.result ?? undefined,
              };
            }),
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
    type: GenerationType;
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

  function addToFeed(entry: {
    type: GenerationType;
    prompt: string;
    url: string;
    tool: string;
  }) {
    setGenerations((prev) => [
      {
        id: `${entry.type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        prompt: entry.prompt,
        result: entry.url,
        tool: entry.tool,
        platform,
        contentType: entry.tool,
        timestamp: Date.now(),
        type: entry.type,
        mediaUrl: entry.url,
      },
      ...prev,
    ]);
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
      if (!response.ok) throw new Error(readString(data, "error") || "Generation failed.");

      const finalResult = readString(data, "result");
      const entryPrompt = prompt.trim() || opts.promptText.trim();

      setGenerations((prev) => [
        {
          id: `text-${Date.now()}`,
          prompt: entryPrompt,
          result: finalResult,
          tool: opts.tool ?? activeTool,
          platform,
          contentType,
          timestamp: Date.now(),
          type: "text",
        },
        ...prev,
      ]);
      recordGeneration({
        type: "text",
        prompt: entryPrompt,
        result: finalResult,
        tool: opts.tool ?? activeTool,
        platform,
      });

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
        if (!response.ok) throw new Error(readString(data, "error") || "Pipeline step failed.");
        if (!readString(data, "result").trim()) throw new Error("AI returned an empty result.");

        context = readString(data, "result").trim();
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

    const count = customPrompt ? 1 : batchSize;

    try {
      for (let index = 0; index < count; index++) {
        const response = await fetch("/api/ai/image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: imagePrompt,
            negativePrompt: "",
            width: ratio.width,
            height: ratio.height,
          }),
        });

        const data = await safeJson(response);
        if (!response.ok) throw new Error(readString(data, "error") || "Image generation failed.");
        const url = readString(data, "url");
        if (!data.success || !url) throw new Error("No image returned.");

        setGeneratedImage(url);
        recordGeneration({ type: "image", prompt: imagePrompt, result: url });
        addToFeed({ type: "image", prompt: imagePrompt, url, tool: "Image" });
      }
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
      if (!response.ok) throw new Error(readString(data, "error") || "Video generation failed.");
      const url = readString(data, "url");
      if (!data.success || !url) throw new Error("No video returned.");

      setVideoProgress(100);
      recordGeneration({ type: "video", prompt: videoPrompt, result: url });
      addToFeed({ type: "video", prompt: videoPrompt, url, tool: "Video" });
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

  async function handleVoiceGenerate(customPrompt?: string) {
    const script = (customPrompt ?? prompt).trim();
    if (!script || isGeneratingVoice) return;
    if (limitReached) {
      setShowPurchase(true);
      return;
    }
    setIsGeneratingVoice(true);
    setVoiceError("");

    try {
      const response = await fetch("/api/ai/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: script, voice }),
      });

      const data = await safeJson(response);
      if (!response.ok) throw new Error(readString(data, "error") || "Voice generation failed.");
      const url = readString(data, "url");
      if (!data.success || !url) throw new Error("No audio returned.");

      recordGeneration({ type: "voice", prompt: script, result: url, tool: `Voice · ${voice}` });
      addToFeed({ type: "voice", prompt: script, url, tool: `Voice · ${voice}` });
    } catch (err) {
      setVoiceError(err instanceof Error ? err.message : "Voice generation failed. Please try again.");
    } finally {
      setIsGeneratingVoice(false);
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
        setPurchaseError(readString(order, "error") || "Could not start the payment.");
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
          key: readString(order, "keyId"),
          orderId: readString(order, "orderId"),
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
        body: JSON.stringify({ orderId: readString(order, "orderId"), paymentId, signature }),
      });
      const verify = await safeJson(verifyRes);
      if (!verifyRes.ok || !verify.success) {
        setPurchaseError(readString(verify, "error") || "Payment verification failed.");
        return;
      }

      setUser(verify.user as typeof user);
      setPurchaseNotice("PRO activated — unlimited AI generations unlocked.");
      window.setTimeout(() => setShowPurchase(false), 1400);
    } finally {
      setPurchaseBusy(false);
    }
  }

  const primaryBusy =
    activeTab === "write"
      ? isGenerating
      : activeTab === "image"
      ? isGeneratingImage
      : activeTab === "video"
      ? isGeneratingVideo
      : activeTab === "voice"
      ? isGeneratingVoice
      : isPipelineRunning;

  const primaryLabel = primaryBusy
    ? activeTab === "pipeline"
      ? "Running..."
      : "Generating..."
    : "Generate";

  const primaryPlaceholder =
    activeTab === "image"
      ? "Describe the image you want to generate..."
      : activeTab === "video"
      ? "Describe the video you want to generate..."
      : activeTab === "voice"
      ? "Paste the script you want narrated..."
      : activeTab === "pipeline"
      ? "Describe the post you want..."
      : tools.find((t) => t.title === activeTool)?.placeholder ?? "Type a prompt...";

  function handlePrimaryAction() {
    if (activeTab === "write") void handleGenerate();
    else if (activeTab === "image") void handleImageGenerate();
    else if (activeTab === "video") void handleVideoGenerate();
    else if (activeTab === "voice") void handleVoiceGenerate();
    else void handleRunPipeline();
  }

  // Sparkle button: drop a ready-to-run example into the prompt bar.
  function insertExample() {
    if (activeTab === "image") {
      setPrompt("A futuristic creator workspace, dark theme, purple neon accents");
    } else if (activeTab === "video") {
      setPrompt("Ocean waves at sunset, cinematic slow motion");
    } else if (activeTab === "voice") {
      setPrompt("Three things I wish I knew before posting my first video online.");
    } else if (activeTab === "pipeline") {
      setPrompt("Why consistency beats motivation for creators");
    } else {
      const example =
        tools.find((t) => t.title === activeTool)?.placeholder ??
        "AI tools for developers";
      setPrompt(example.replace(/^Example:\s*/, ""));
    }
  }

  const showPreview = (activeTab === "write" || activeTab === "pipeline") && isPreviewOpen;
  const displayResult = streamingText || result;
  const mediaError = imageError || videoError || voiceError;
  const isBusyMedia = isGeneratingImage || isGeneratingVideo || isGeneratingVoice;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayItems = generations.filter((g) => g.timestamp >= todayStart.getTime());
  const earlierItems = generations.filter((g) => g.timestamp < todayStart.getTime());

  function renderCard(gen: Generation) {
    return (
      <article
        key={gen.id}
        className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition hover:border-white/20"
      >
        {gen.type === "image" && gen.mediaUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={gen.mediaUrl} alt={gen.prompt} className="w-full object-cover" />
        )}
        {gen.type === "video" && gen.mediaUrl && (
          <video src={gen.mediaUrl} controls loop playsInline className="w-full" />
        )}
        {gen.type === "voice" && gen.mediaUrl && (
          <div className="p-4">
            <audio src={gen.mediaUrl} controls className="w-full" />
          </div>
        )}
        {gen.type === "text" && (
          <p className="max-h-56 overflow-y-auto whitespace-pre-wrap p-4 text-sm leading-6 text-zinc-300">
            {gen.result}
          </p>
        )}
        <div className="flex items-center justify-between gap-3 border-t border-white/5 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-xs text-zinc-300">{gen.prompt}</p>
            <p className="mt-1 text-[10px] uppercase tracking-wide text-zinc-600">
              {gen.tool} ·{" "}
              {new Date(gen.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPrompt(gen.prompt)}
              title="Reuse this prompt"
              className="rounded-lg border border-white/10 px-2.5 py-1 text-[11px] font-medium text-zinc-400 transition hover:border-white/25 hover:text-white"
            >
              Reuse
            </button>
            {gen.mediaUrl ? (
              <a
                href={gen.mediaUrl}
                download
                className="rounded-lg border border-white/10 px-2.5 py-1 text-[11px] font-medium text-zinc-400 transition hover:border-white/25 hover:text-white"
              >
                Download
              </a>
            ) : (
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(gen.result)}
                className="rounded-lg border border-white/10 px-2.5 py-1 text-[11px] font-medium text-zinc-400 transition hover:border-white/25 hover:text-white"
              >
                Copy
              </button>
            )}
          </div>
        </div>
      </article>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white">
      <header className="flex h-14 items-center gap-3 border-b border-white/10 bg-[#0a0a0c] px-4">
        <Link
          href="/ai-studio"
          title="Back to AI Studio library"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-white/5 hover:text-white"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        </Link>
        <span className="text-sm font-semibold tracking-wide">OCTA STUDIO</span>
        <span className="mx-auto text-sm font-medium text-zinc-300">AI Creation</span>
        <div className="flex items-center gap-2">
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
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-medium text-zinc-400">
                {Math.max(usage.limit - usage.used, 0)} credits
              </span>
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

      <div className="flex h-[calc(100vh-3.5rem)]">
        {/* Settings rail */}
        <aside className="hidden w-[248px] shrink-0 overflow-y-auto border-r border-white/10 bg-[#0c0c0e] p-4 lg:block">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">Mode</p>
          <div className="mt-2 grid gap-1.5">
            {STUDIO_TOOLS.map((tool) => (
              <button
                key={tool.mode}
                type="button"
                onClick={() => setActiveTab(tool.mode)}
                className={`rounded-xl border px-3 py-2 text-left transition ${
                  activeTab === tool.mode
                    ? "border-[#7C3AED]/60 bg-[#7C3AED]/15"
                    : "border-white/10 bg-white/[0.02] hover:border-white/20"
                }`}
              >
                <p className={`text-xs font-medium ${activeTab === tool.mode ? "text-violet-200" : "text-zinc-300"}`}>{tool.label}</p>
                <p className="mt-0.5 text-[10px] leading-4 text-zinc-600">{tool.description}</p>
              </button>
            ))}
          </div>

          {activeTab === "image" && (
            <>
              <p className="mt-6 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">Image dimensions</p>
              <div className="mt-2 grid grid-cols-4 gap-1.5">
                {IMAGE_RATIOS.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setRatio(item)}
                    className={`rounded-lg border py-2 text-[11px] font-medium transition ${
                      ratio.label === item.label
                        ? "border-[#7C3AED]/60 bg-[#7C3AED]/15 text-violet-200"
                        : "border-white/10 bg-white/[0.02] text-zinc-400 hover:border-white/20"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <p className="mt-2 rounded-lg border border-white/10 bg-white/[0.02] px-2 py-1 text-center text-[10px] text-zinc-500">
                {ratio.width}×{ratio.height}
              </p>

              <p className="mt-6 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">Number of generations</p>
              <div className="mt-2 grid grid-cols-4 gap-1.5">
                {[1, 2, 3, 4].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setBatchSize(count)}
                    className={`rounded-lg border py-2 text-[11px] font-medium transition ${
                      batchSize === count
                        ? "border-[#7C3AED]/60 bg-[#7C3AED]/15 text-violet-200"
                        : "border-white/10 bg-white/[0.02] text-zinc-400 hover:border-white/20"
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </>
          )}

          {activeTab === "voice" && (
            <>
              <p className="mt-6 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">Voice</p>
              <select
                value={voice}
                onChange={(e) => setVoice(e.target.value as Voice)}
                className="mt-2 w-full rounded-lg border border-white/10 bg-[#0c0c0e] px-2.5 py-2 text-xs capitalize text-zinc-300 outline-none focus:border-white/25"
              >
                {VOICES.map((item) => (
                  <option key={item} value={item} className="capitalize">
                    {item}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-[10px] leading-4 text-zinc-600">
                Paste up to 2000 characters. The clip is saved to your creations.
              </p>
            </>
          )}

          {(activeTab === "write" || activeTab === "pipeline") && (
            <>
              <p className="mt-6 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">Post settings</p>
              <div className="mt-2 grid gap-2">
                {[
                  { label: "Platform", value: platform, setValue: setPlatform, options: platforms },
                  { label: "Content type", value: contentType, setValue: setContentType, options: contentTypes },
                  { label: "Tone", value: tone, setValue: setTone, options: tones },
                  { label: "Length", value: length, setValue: setLength, options: lengths },
                ].map((field) => (
                  <label key={field.label} className="block text-[10px] font-medium text-zinc-600">
                    {field.label}
                    <select
                      value={field.value}
                      onChange={(e) => field.setValue(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-white/10 bg-[#0c0c0e] px-2.5 py-2 text-xs text-zinc-300 outline-none focus:border-white/25"
                    >
                      {field.options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>

              {activeTab === "write" && (
                <>
                </>
              )}

              <button
                type="button"
                onClick={() => setIsPreviewOpen((open) => !open)}
                className="mt-6 w-full rounded-lg border border-white/10 px-2.5 py-2 text-[11px] font-medium text-zinc-400 transition hover:border-white/25 hover:text-white"
              >
                {isPreviewOpen ? "Hide live preview" : "Show live preview"}
              </button>
            </>
          )}
        </aside>

        {/* Creation area */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6">
            {/* Prompt bar */}
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-2.5 backdrop-blur-xl transition-colors focus-within:border-white/25">
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageAttach} />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Add your own image"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-zinc-400 transition hover:border-white/25 hover:text-white"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
              {previewImage && (
                <span className="relative shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewImage} alt="Attached media" className="h-9 w-9 rounded-xl border border-white/10 object-cover" />
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
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" /></svg>
              </button>
              <button
                type="button"
                onClick={handlePrimaryAction}
                disabled={!prompt.trim() || primaryBusy}
                className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-[#7C3AED] px-4 text-sm font-medium text-white transition hover:bg-[#6D28D9] disabled:opacity-50"
              >
                {primaryBusy && (
                  <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>
                )}
                {primaryLabel}
              </button>
            </div>

            {/* Mode tabs */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {STUDIO_TOOLS.map((tool) => (
                <button
                  key={tool.mode}
                  type="button"
                  onClick={() => setActiveTab(tool.mode)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                    activeTab === tool.mode
                      ? "border-[#7C3AED]/60 bg-[#7C3AED]/15 text-violet-300"
                      : "border-white/10 bg-white/[0.02] text-zinc-500 hover:border-white/20 hover:text-zinc-200"
                  }`}
                >
                  {tool.label}
                </button>
              ))}
            </div>

            {/* Plan banner */}
            {user?.plan !== "PRO" && (
              <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/5 px-4 py-3">
                <div className="flex-1">
                  <p className="text-xs font-medium text-emerald-300">You are currently on a free plan.</p>
                  <p className="text-[11px] text-zinc-500">
                    {usage.used}/{usage.limit} generations used. Upgrade for unlimited image, video and voice generations.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPurchase(true)}
                  className="rounded-lg border border-emerald-500/40 px-3 py-1.5 text-[11px] font-semibold text-emerald-300 transition hover:bg-emerald-500/10"
                >
                  Upgrade Plan
                </button>
              </div>
            )}

            {mediaError && (
              <div className="mt-4 rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">{mediaError}</div>
            )}
            {error && (
              <div className="mt-4 rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">{error}</div>
            )}

            {/* In-progress card */}
            {isBusyMedia && (
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="flex items-center gap-3">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#7C3AED] border-t-transparent" />
                  <p className="text-xs text-zinc-400">
                    {isGeneratingImage
                      ? `Generating ${batchSize > 1 ? `${batchSize} images` : "your image"}…`
                      : isGeneratingVideo
                      ? "Rendering your video…"
                      : "Recording your voiceover…"}
                  </p>
                </div>
                {isGeneratingVideo && (
                  <div className="mt-3">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                      <div className="h-full rounded-full bg-[#7C3AED] transition-all duration-300" style={{ width: `${videoProgress}%` }} />
                    </div>
                    <p className="mt-2 text-center text-[11px] text-zinc-500">{Math.round(videoProgress)}% complete</p>
                  </div>
                )}
              </div>
            )}

            {/* Writing surface */}
            {activeTab === "write" && (
              <section className="mt-4 space-y-4">
                {(isGenerating || streamingText || result) && (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                    <p className="whitespace-pre-wrap text-sm leading-6 text-zinc-200">{displayResult}</p>
                    {isGenerating && <span className="ml-1 inline-block h-4 w-2 animate-pulse bg-[#7C3AED]" />}
                  </div>
                )}

                {result && !isGenerating && (
                  <div className="rounded-2xl border border-[#7C3AED]/30 bg-[#7C3AED]/5 p-5">
                    <p className="text-sm font-semibold text-white">Improve this draft</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {getSmartSuggestions(result, platform).map((s) => (
                        <button
                          key={s.label}
                          type="button"
                          onClick={() => handleSuggestion(s)}
                          className="rounded-full border border-[#7C3AED]/40 bg-black/40 px-3 py-1.5 text-xs font-medium text-violet-300 transition hover:border-[#8B5CF6]"
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <button
                        onClick={handleCreateContent}
                        disabled={isCreating}
                        className="rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:opacity-50"
                      >
                        {isCreating ? "Creating..." : "Create Content"}
                      </button>
                      <button
                        onClick={openScheduler}
                        className="rounded-xl bg-[#7C3AED] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#6D28D9]"
                      >
                        Schedule
                      </button>
                      <button
                        onClick={() => navigator.clipboard.writeText(result)}
                        className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-white/25 hover:text-white"
                      >
                        Copy
                      </button>
                      <button
                        onClick={handleGenerate}
                        disabled={!prompt.trim() || isGenerating}
                        className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-white/25 hover:text-white disabled:opacity-50"
                      >
                        Regenerate
                      </button>
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Pipeline surface */}
            {activeTab === "pipeline" && pipelineSteps.length > 0 && (
              <ol className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                {pipelineSteps.map((step, index) => (
                  <li key={step.id} className="relative flex gap-4 pb-8 last:pb-0">
                    {index < pipelineSteps.length - 1 && (
                      <span
                        className={`absolute left-[13px] top-8 h-[calc(100%-2rem)] w-px ${
                          step.status === "done" ? "bg-[#7C3AED]" : "bg-white/10"
                        }`}
                      />
                    )}
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                        step.status === "done" || step.status === "running"
                          ? "border-[#7C3AED] bg-[#7C3AED]/15 text-violet-300"
                          : step.status === "error"
                          ? "border-red-500/50 bg-red-500/10 text-red-400"
                          : "border-white/10 bg-white/[0.03] text-zinc-500"
                      }`}
                    >
                      {step.status === "done" ? (
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                      ) : step.status === "running" ? (
                        <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>
                      ) : (
                        index + 1
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        <p className="text-sm font-medium text-white">{step.title}</p>
                        <p className="text-xs text-zinc-500">{step.description}</p>
                      </div>
                      {step.error && <p className="mt-1 text-xs text-red-400">{step.error}</p>}
                      {step.status === "done" && step.result && (
                        <div className="mt-2 max-h-28 overflow-y-auto whitespace-pre-wrap rounded-lg border border-white/10 bg-black/40 p-3 text-xs leading-5 text-zinc-400">
                          {step.result}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            )}

            {activeTab === "pipeline" && pipelineDone && result && !isPipelineRunning && (
              <div className="mt-4 rounded-2xl border border-[#7C3AED]/40 bg-[#7C3AED]/10 p-5">
                <p className="text-sm font-semibold text-white">Your post is ready</p>
                <div className="mt-3 max-h-56 overflow-y-auto rounded-xl border border-white/10 bg-black/40 p-4">
                  <p className="whitespace-pre-wrap text-sm leading-6 text-zinc-200">{result}</p>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button
                    onClick={openScheduler}
                    className="rounded-xl bg-[#7C3AED] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#6D28D9]"
                  >
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
                    onClick={() => handleVideoGenerate(pipelineMediaPrompt)}
                    disabled={!pipelineMediaPrompt || isGeneratingVideo || isGeneratingImage}
                    className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-white/25 hover:text-white disabled:opacity-50"
                  >
                    Generate Video
                  </button>
                  <button
                    onClick={() => handleImageGenerate(pipelineMediaPrompt)}
                    disabled={!pipelineMediaPrompt || isGeneratingImage}
                    className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-white/25 hover:text-white disabled:opacity-50"
                  >
                    Regenerate Image
                  </button>
                </div>
              </div>
            )}

            {isScheduleOpen && (
              <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <label className="text-sm font-medium text-zinc-400" htmlFor="schedule-at">
                  Publish at
                </label>
                <input
                  id="schedule-at"
                  type="datetime-local"
                  value={scheduleAt}
                  min={toLocalInputValue(new Date(Date.now() + 5 * 60 * 1000))}
                  onChange={(e) => setScheduleAt(e.target.value)}
                  className="rounded-lg border border-white/10 bg-black px-3 py-2 text-sm text-zinc-200 outline-none focus:border-[#7C3AED]/60"
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
                  className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-zinc-400 transition hover:border-white/25 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Generation feed */}
            <div className="mt-6 space-y-6 pb-10">
              {generations.length === 0 && !isBusyMedia && (
                <div className="rounded-2xl border border-dashed border-white/10 py-16 text-center">
                  <p className="text-sm text-zinc-500">Nothing generated yet</p>
                  <p className="mt-1 text-xs text-zinc-600">Describe what you want above and press Generate.</p>
                </div>
              )}
              {todayItems.length > 0 && (
                <section>
                  <p className="mb-3 text-xs font-medium text-zinc-500">Today</p>
                  <div className="grid gap-4 sm:grid-cols-2">{todayItems.map(renderCard)}</div>
                </section>
              )}
              {earlierItems.length > 0 && (
                <section>
                  <p className="mb-3 text-xs font-medium text-zinc-500">Earlier</p>
                  <div className="grid gap-4 sm:grid-cols-2">{earlierItems.map(renderCard)}</div>
                </section>
              )}
            </div>
          </div>
        </main>

        {/* Live preview */}
        <aside
          className={`hidden shrink-0 overflow-hidden border-l border-white/10 bg-[#0a0a0c] transition-all duration-300 xl:block ${
            showPreview ? "w-[420px] opacity-100" : "w-0 opacity-0"
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
                imageUrl={previewImage ?? generatedImage}
              />
            </div>
          )}
        </aside>
      </div>

      {showPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-zinc-950 p-6">
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
                <li>· Unlimited AI text, image, video & voice generations</li>
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
                <Link href="/login?next=/ai-studio" className="rounded-xl border border-white/10 px-4 py-2.5 text-center text-sm font-medium text-zinc-300 transition hover:border-white/25 hover:text-white">
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
