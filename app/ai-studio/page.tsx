"use client";

import { useState, useEffect, useRef, type ChangeEvent } from "react";
import { PromptDropdown } from "@/components/ai-studio/prompt-dropdown";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createContent } from "@/app/content/actions/create-content";
import { scheduleContent } from "@/app/content/actions/schedule-content";
import { PostPreviewPanel } from "@/components/ai-studio/post-preview-panel";
import { PhoneMockup } from "@/components/ai-studio/phone-mockup";
import VideoWithFallback from "@/components/video-with-fallback";

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
];

type Template = {
  key: string;
  name: string;
  tagline: string;
  tool: string;
  prompt: string;
  img: string;
  category?: string;
};

const TEMPLATES: Template[] = [
  {
    key: "remove-background",
    name: "Remove Background",
    tagline: "Clean cutout for any subject",
    tool: "Image",
    prompt: "Remove the background from this product photo and keep a clean, natural edge with studio-quality detail.",
    img: "/ai/templates/remove-object.png",
  },
  {
    key: "ai-background",
    name: "AI Background",
    tagline: "Swap scenes with styled backdrops",
    tool: "Image",
    prompt: "Replace the background with a premium styled backdrop while keeping the subject realistic, clean, and naturally integrated with matching lighting and shadows.",
    img: "/ai/templates/ai-background.png",
  },
  {
    key: "image-upscaler",
    name: "Image Upscaler",
    tagline: "Sharpen and enhance resolution",
    tool: "Video",
    prompt: "Upscale this image to high resolution, restore crisp details, and keep textures natural without oversmoothing.",
    img: "/ai/templates/promo.mp4",
  },
  {
    key: "thumbnail-7ed26e.webm",
    name: "Product Ad Generator",
    tagline: "Turn products into ad creatives",
    tool: "Video",
    prompt: "Create a premium product ad visual with dramatic lighting, luxury reflections, and clean marketing composition.",
    img: "/ai/templates/thumbnail-7ed26e.webm",
  },
  {
    key: "cinematic-scenario",
    name: "Cinematic Scenario",
    tagline: "Create a cinematic scene",
    tool: "Video",
    prompt: "Generate a cinematic scenario with dramatic lighting and storytelling elements.",
    img: "/ai/templates/thumbnail-c7dbbe (2).webm",
},
  {
    key: "product_spin",
    name: "Product Spin",
    tagline: "360-degree product visualization",
    tool: "Video",
    prompt: "Generate a 360-degree product spin animation.",
    img: "/ai/templates/product-spin.webm",
  },
  {
    key: "model_holding",
    name: "Model Holding Product",
    tagline: "Upload a photo of a person and your product to see them holding",
    tool: "Image",
    prompt: "Upload a photo of a person and your product to see them holding.",
    img: "/ai/templates/thumbnail-540062.avif",
  },
  {
    key: "auto-captions",
    name: "Auto Captions",
    tagline: "Transcribe speech into accurate captions",
    tool: "Video",
    category: "caption",
    prompt: "Transcribe the speech in this video and generate accurate, well-timed captions with natural punctuation.",
    img: "/ai/templates/thumbnail-7ed26e.webm",
  },
  {
    key: "caption-styles",
    name: "Caption Styles",
    tagline: "Trendy, animated caption looks",
    tool: "Video",
    category: "caption",
    prompt: "Add stylish, animated captions to this video using a modern social-media caption style with bold highlights.",
    img: "/ai/templates/product-spin.webm",
  },
  {
    key: "translate-captions",
    name: "Caption + Translate",
    tagline: "Caption and localize in one pass",
    tool: "Video",
    category: "caption",
    prompt: "Generate captions for this video and translate them into a new language for a wider audience.",
    img: "/ai/templates/thumbnail-c7dbbe (2).webm",
  },
  ];

const platforms = ["Instagram", "YouTube", "LinkedIn", "X", "Blog"];
const contentTypes = ["Post", "Reel", "Video", "Article", "Thread", "Caption"];
const tones = ["Professional", "Casual", "Educational", "Engaging", "Viral"];
const lengths = ["Short", "Medium", "Long"];

// Live creation-tool selector shown above the composer.
type CreationToolOption = {
  label: string;
  value: string;
  description: string;
  divider?: boolean;
};

const CREATION_TOOL_OPTIONS: CreationToolOption[] = [
  { label: "Auto edit", value: "Edit", description: "Upload a video to start" },
  { label: "Generate video", value: "Generate video", description: "Create a video from a prompt" },
  { label: "Generate image", value: "Generate image", description: "Create an image from a prompt" },
  { label: "Add captions", value: "Captions", description: "Add captions to a video" },
  { label: "Smart Cut", value: "Smart Cut", description: "Turn long videos into viral clips", divider: true },
];

type CreationComposerState = {
  title: string;
  description: string;
  button: string;
};

const CREATION_STATES: Record<string, CreationComposerState> = {
  Edit: {
    title: "AI that edits like a professional editor would.",
    description: "Upload a video to start",
    button: "Upload video",
  },
  "Generate video": {
    title: "Create a video from a prompt.",
    description: "Describe the video you want and let AI generate it.",
    button: "Generate video",
  },
  "Generate image": {
    title: "Create an image from a prompt.",
    description: "Describe the image and let AI bring it to life.",
    button: "Generate image",
  },
  Captions: {
    title: "Add captions automatically.",
    description: "Turn your video's speech into accurate captions.",
    button: "Add captions",
  },
  "Smart Cut": {
    title: "Turn long videos into viral clips.",
    description: "Find the best moments and create short-form clips.",
    button: "Smart Cut",
  },
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

function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatBytes(bytes: number | null): string {
  if (bytes == null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value < 10 ? 1 : 0)} ${units[unit]}`;
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
      theme: { color: "#C7E34F" },
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
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [templatePanelOpen, setTemplatePanelOpen] = useState(false);
  const [templateStep, setTemplateStep] = useState(1);
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [templatePreview, setTemplatePreview] = useState<string | null>(null);
  const [templateProcessing, setTemplateProcessing] = useState(false);
  const [templateError, setTemplateError] = useState("");
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
  const [showPhoneMockup, setShowPhoneMockup] = useState(false);
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

  // Live creation-tool selector state
  const [creationTool, setCreationTool] = useState("Edit");
  const [creationMediaName, setCreationMediaName] = useState<string | null>(null);
  const creationFileRef = useRef<HTMLInputElement>(null);

  // Captions upload + processing foundation (isolated to the Captions tool).
  type CaptionStage = "idle" | "uploading" | "processing" | "ready" | "error";
  type CaptionMedia = {
    id: string;
    url: string;
    filename: string;
    mimeType: string;
    size: number;
  };
  const [captionStage, setCaptionStage] = useState<CaptionStage>("idle");
  const [captionFileName, setCaptionFileName] = useState<string | null>(null);
  const [captionFileSize, setCaptionFileSize] = useState<number | null>(null);
  const [captionMedia, setCaptionMedia] = useState<CaptionMedia | null>(null);
  const [captionError, setCaptionError] = useState<string | null>(null);

  const creationState = CREATION_STATES[creationTool] ?? CREATION_STATES.Edit;
  const visibleTemplates =
    creationTool === "Captions"
      ? TEMPLATES.filter((template) => template.category === "caption")
      : TEMPLATES;

  async function uploadCaptionVideo(file: File) {
    setCaptionFileName(file.name);
    setCaptionFileSize(file.size);
    setCaptionError(null);
    setCaptionStage("uploading");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/media/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.error ?? "Upload failed.");
      }
      setCaptionMedia(data.media as CaptionMedia);
      setCaptionStage("ready");
    } catch (err) {
      setCaptionError(err instanceof Error ? err.message : "Upload failed.");
      setCaptionStage("error");
    }
  }

  function handleGenerateCaptions() {
    // Step 4 placeholder: no transcription yet. Transition into the
    // processing state so the next step has a clear entry point.
    setCaptionStage("processing");
  }

  function handleCreationMedia(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (creationTool === "Captions") {
      void uploadCaptionVideo(file);
    } else {
      setCreationMediaName(file.name);
    }
    event.target.value = "";
  }

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

    // Remove redirect - just set state flags
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
         title: prompt.trim().slice(0, 80) || `${activeTool} \${platform}`,
         body: result.trim(),
         platform: platform || null,
         // Remove contentType from client-side call
       });

       // Keep contentType tracking for UI purposes only
       const contentType = activeTab;

if (contentType in ['image', 'video']) {
          router.push(`/content/${content.id}`);
        } else {
          // Update UI with text content
          setResult(content.body ?? "");
        }
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
    // Remove redirect - stay on page
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
  const primaryBusy = Boolean(
    activeTab === "write"
      ? isGenerating
      : activeTab === "image"
        ? isGeneratingImage
        : activeTab === "video"
          ? isGeneratingVideo
          : isPipelineRunning
  );

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

  const primaryPlaceholder = activeTab === "image" ? "Describe the image you want to generate..." : activeTab === "video" ? "Describe the video you want to generate..." : activeTab === "pipeline" ? "Describe the post you want..." : tools.find((t) => t.title === activeTool)?.placeholder ?? "Type a prompt...";

  function handlePrimaryAction() {
    if (activeTab === "write") void handleGenerate();
    else if (activeTab === "image") void handleImageGenerate();
    else if (activeTab === "video") void handleVideoGenerate();
    else void handleRunPipeline();

    // Show phone mockup for visual generation tabs
    if (activeTab === "image" || activeTab === "video") {
      setShowPhoneMockup(true);
    }
  }

  function handleTemplateSelect(template: Template) {
    if (creationTool === "Captions") {
      setSelectedTemplate(template.key);
      setPrompt(template.prompt);
      return;
    }

    setActiveTab("image");
    setSelectedTemplate(template.key);
    setPrompt(template.prompt);
    setResult("");
    setStreamingText("");
    setError("");
    setActiveGenerationId(null);
    setGeneratedImage(null);
    setGeneratedVideo(null);

    setTemplateStep(1);
    setTemplateFile(null);
    setTemplatePreview(null);
    setTemplateError("");
    setTemplateProcessing(false);
    setTemplatePanelOpen(true);
  }

  async function handleTemplateProcess() {
    if (!templateFile || templateProcessing) return;

    if (selectedTemplate !== "remove-background") {
      setTemplateError("This template workflow is not connected yet.");
      return;
    }

    setTemplateProcessing(true);
    setTemplateError("");
    setTemplateStep(2);
    setIsGeneratingImage(true);
    setGeneratedImage(null);

    try {
      const formData = new FormData();
      formData.append("image", templateFile);

      const response = await fetch("/api/ai/remove-background", {
        method: "POST",
        body: formData,
      });

      const data = await safeJson(response);

      if (!response.ok) {
        throw new Error(data.error || "Background removal failed.");
      }

      if (!data.success || !data.outputUrl) {
        throw new Error("No processed image was returned.");
      }

      setGeneratedImage(data.outputUrl);
      setShowPhoneMockup(true);
      setTemplateStep(3);

      recordGeneration({
        type: "image",
        prompt: "Remove background",
        result: data.outputUrl,
      });

      setGenerations((prev) => [
        {
          id: `template-${Date.now()}`,
          prompt: "Remove background",
          result: data.outputUrl,
          tool: "Remove Background",
          platform,
          contentType: "Image",
          timestamp: Date.now(),
          type: "image",
          mediaUrl: data.outputUrl,
        },
        ...prev,
      ]);
    } catch (err) {
      setTemplateStep(1);
      setTemplateError(
        err instanceof Error
          ? err.message
          : "Background removal failed."
      );
    } finally {
      setTemplateProcessing(false);
      setIsGeneratingImage(false);
    }
  }

  // AI Editor suggestions
  const aiSuggestions = [
    { label: "Improve", instruction: "Improve this draft: make it clearer, more engaging, and better structured. Keep the core message." },
    { label: "Rewrite", instruction: "Rewrite this completely with a fresh perspective while keeping the same topic and intent." },
    { label: "Shorten", instruction: "Shorten this significantly while keeping the key points. Make it punchy and concise." },
    { label: "Expand", instruction: "Expand this with more detail, examples, and depth. Make it comprehensive." },
    { label: "Fix Grammar", instruction: "Fix any grammar, punctuation, or spelling errors. Keep the exact same wording otherwise." },
    { label: "Make Engaging", instruction: "Make this more engaging: add hooks, questions, emojis, and a conversational tone that drives interaction." },
  ];

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
            <span className="rounded-full border border-[#C7E34F]/40 bg-[#C7E34F]/10 px-2.5 py-1 text-[10px] font-semibold text-[#C7E34F]">PRO</span>
          ) : (
            <>
              <span className="hidden text-[10px] text-zinc-500 sm:block">{usage.used}/{usage.limit} free generations</span>
              <button
                type="button"
                onClick={() => setShowPurchase(true)}
                className="rounded-full bg-[#C7E34F] px-3 py-1 text-[10px] font-semibold text-zinc-900 transition hover:bg-[#C7E34F]"
              >
                Upgrade
              </button>
            </>
          )}
        </div>
</header>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Generations Sidebar */}
        <aside className={`border-r border-zinc-800/50 bg-[#0a0a0c] flex-shrink-0 transition-all duration-300 ${isSidebarOpen ? 'w-64 opacity-100' : 'w-0 opacity-0 overflow-hidden'}`}>
          <div className="p-4 border-b border-zinc-800/50">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Your Generations</h3>
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
                        ? 'bg-[#C7E34F]/15 border border-[#C7E34F]/40'
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
            {/* Cinematic hero */}
            <div className="relative mb-10 overflow-hidden rounded-3xl border border-white/30">
              <video
                autoPlay
                muted
                loop
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              >
                <source src="/logo/Octa%20ai.mp4" type="video/mp4" />
              </video>
              <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-white/5 to-[#0a0a0c]/70" />
              <div className="relative px-8 pb-28 pt-24 text-center sm:px-12 sm:pb-36 sm:pt-28" />
            </div>

            {/* Leonardo-style floating command bar */}
            <div className="animate-fade-up-delay mx-auto -mt-16 relative z-10 max-w-4xl">
              <div className="rounded-3xl border border-white/[0.14] bg-black/70 p-2.5 shadow-[0_0_0_1px_rgba(255,255,255,0.05)] backdrop-blur-2xl">
                {/* OCTA AI header */}
                <div className="flex items-center gap-2 px-2 pb-2">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-white text-black shadow-lg">
                    <svg
                      className="size-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" />
                      <path d="M19 16l.7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z" />
                    </svg>
                  </div>

                  <span className="text-sm font-semibold tracking-tight text-white">
                    OCTA AI
                  </span>

                  <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] font-medium tracking-wide text-white/40">
                    AI EDITOR
                  </span>

                  <PromptDropdown
                    value={creationTool}
                    options={CREATION_TOOL_OPTIONS}
                    onChange={setCreationTool}
                    ariaLabel="Creation tool"
                    align="right"
                    className="ml-auto"
                  />
                </div>

                {/* Prompt / upload / generate */}
                <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 transition-colors focus-within:border-white/25">
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
                    placeholder="Tell OCTA AI what you want to create or change..."
                    rows={1}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handlePrimaryAction();
                      }
                    }}
                    className="max-h-40 flex-1 resize-none bg-transparent px-1 py-1.5 text-sm text-zinc-200 outline-none placeholder:text-zinc-500"
                  />
                  <button
                    type="button"
                    onClick={insertExample}
                    title="Try an example prompt"
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-zinc-400 transition hover:border-white/25 hover:text-[#C7E34F]"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" /></svg>
                  </button>
                  <button
                    type="button"
                    onClick={handlePrimaryAction}
                    className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-[#C7E34F] px-4 text-sm font-medium text-zinc-900 transition hover:bg-[#C7E34F] disabled:opacity-50"
                  >
                    {primaryBusy && (
                      <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>
                    )}
                    {primaryLabel}
                  </button>
                </div>

                {/* OCTA AI quick actions */}
                <div className="mt-2 flex gap-2 overflow-x-auto px-1 pb-0.5">
                  {[
                    ["Auto edit", "write"],
                    ["Generate video", "video"],
                    ["Generate image", "image"],
                    ["Add captions", "write"],
                    ["Smart cut", "pipeline"],
                  ].map(([label, mode]) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => {
                        setActiveTab(mode as typeof activeTab);
                        setPrompt(label);
                      }}
                      className="flex shrink-0 items-center gap-1.5 rounded-lg border border-white/7 bg-white/[0.025] px-2.5 py-1.5 text-[11px] text-white/45 transition hover:border-white/15 hover:bg-white/[0.06] hover:text-white/80"
                    >
                      <span className="size-1.5 rounded-full bg-[#C7E34F]" />
                      {label}
                    </button>
                  ))}
                </div>

                {/* Row 2: mode pills (left) + setting chips (right) */}
                <div className="mt-2 flex flex-wrap items-center justify-between gap-3 px-1 pb-0.5">
                  <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] p-1">
                    {(["write", "image", "video", "pipeline"] as const).map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setActiveTab(tab)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium capitalize transition ${
                          activeTab === tab
                            ? "bg-[#C7E34F] text-zinc-900 shadow-lg shadow-[#C7E34F]/30"
                            : "text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        {tab === "write" && (
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                        )}
                        {tab === "image" && (
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" /></svg>
                        )}
                        {tab === "video" && (
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" /></svg>
                        )}
                        {tab === "pipeline" && (
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
                        )}
                        {tab}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {(activeTab === "write" || activeTab === "pipeline") && (
                      <>
                        <PromptDropdown
                          label="Content type"
                          value={contentType}
                          options={contentTypes}
                          onChange={setContentType}
                        />
                        <PromptDropdown
                          label="Platform"
                          value={platform}
                          options={platforms}
                          onChange={setPlatform}
                        />
                        <PromptDropdown
                          label="Tone"
                          value={tone}
                          options={tones}
                          onChange={setTone}
                        />
                      </>
                    )}
                    {(activeTab === "image" || activeTab === "video") && (
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-zinc-300">1:1</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* --- LIVE CREATION TOOL COMPOSER (updates with the selector in the bar) --- */}
            <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6">
              <h3 className="text-2xl font-semibold leading-tight text-white sm:text-3xl">
                {creationState.title}
              </h3>
              <p className="mt-2 max-w-xl text-sm text-zinc-400">{creationState.description}</p>

              {creationTool === "Captions" ? (
                <div className="mt-5 space-y-3">
                  {captionStage === "idle" && (
                    <button
                      type="button"
                      onClick={() => creationFileRef.current?.click()}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#C7E34F] px-4 py-2.5 text-sm font-medium text-zinc-900 transition hover:bg-[#C7E34F]"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 16.5V4.5m0 0L7.5 9m4.5-4.5L16.5 9M3 15v3.75A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V15" />
                      </svg>
                      Add captions
                    </button>
                  )}

                  {captionStage === "uploading" && (
                    <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-black/30 p-4">
                      <svg className="h-4 w-4 shrink-0 animate-spin text-[#C7E34F]" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white">Uploading…</p>
                        <p className="truncate text-xs text-zinc-400">{captionFileName} · {formatBytes(captionFileSize)}</p>
                      </div>
                    </div>
                  )}

                  {captionStage === "ready" && (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#C7E34F]/40 bg-[#C7E34F]/5 p-4">
                      <div className="flex items-center gap-3">
                        <video
                          src={captionMedia?.url}
                          muted
                          playsInline
                          className="h-12 w-12 shrink-0 rounded-lg border border-white/10 object-cover"
                        />
                        <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#C7E34F] text-zinc-900">
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white">Video ready</p>
                          <p className="truncate text-xs text-zinc-400">{captionFileName} · {formatBytes(captionFileSize)}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleGenerateCaptions}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#C7E34F] px-4 py-2.5 text-sm font-medium text-zinc-900 transition hover:bg-[#C7E34F]"
                      >
                        Generate captions
                      </button>
                    </div>
                  )}

                  {captionStage === "processing" && (
                    <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-black/30 p-4">
                      <svg className="h-4 w-4 shrink-0 animate-spin text-[#C7E34F]" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white">Processing captions…</p>
                        <p className="truncate text-xs text-zinc-400">{captionFileName} · preparing caption generation</p>
                      </div>
                    </div>
                  )}

                  {captionStage === "error" && (
                    <div className="rounded-xl border border-red-500/40 bg-red-500/5 p-4">
                      <p className="text-sm font-medium text-red-300">Upload failed</p>
                      <p className="mt-1 text-xs text-zinc-400">{captionError}</p>
                      <button
                        type="button"
                        onClick={() => creationFileRef.current?.click()}
                        className="mt-3 inline-flex items-center gap-2 rounded-xl border border-red-500/50 px-3 py-2 text-sm font-medium text-red-200 transition hover:bg-red-500/10"
                      >
                        Retry
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => creationFileRef.current?.click()}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#C7E34F] px-4 py-2.5 text-sm font-medium text-zinc-900 transition hover:bg-[#C7E34F]"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 16.5V4.5m0 0L7.5 9m4.5-4.5L16.5 9M3 15v3.75A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V15" />
                    </svg>
                    {creationState.button}
                  </button>
                  {creationMediaName && (
                    <span className="text-xs text-zinc-500">
                      Selected: <span className="text-zinc-300">{creationMediaName}</span>
                    </span>
                  )}
                </div>
              )}

              <input
                ref={creationFileRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={handleCreationMedia}
              />
            </section>

            <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-white">
                      {creationTool === "Captions" ? "Caption Templates" : "Image Templates"}
                    </h2>
                    <span className="rounded-full border border-[#C7E34F]/40 bg-[#C7E34F]/10 px-2 py-0.5 text-[10px] font-medium text-[#C7E34F]">
                      {visibleTemplates.length} templates
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">
                    {creationTool === "Captions"
                      ? "Pick a caption template to load the prompt and add captions to your video."
                      : "Pick a template to load the prompt and jump straight into AI image generation."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="inline-flex items-center gap-2 self-start rounded-full border border-zinc-800 bg-black/30 px-3 py-1.5 text-xs font-medium text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-200"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>
                  {isSidebarOpen ? "Hide" : "Show"} Your Generations
                </button>
              </div>

              <div className="mt-4 flex gap-3 overflow-x-auto pb-2 [scrollbar-width:thin]">
                {visibleTemplates.map((tpl) => (
                  <button
                    key={tpl.key}
                    type="button"
                    onClick={() => handleTemplateSelect(tpl)}
                    className={`group relative shrink-0 w-36 overflow-hidden rounded-2xl border text-left transition ${
                      selectedTemplate === tpl.key
                        ? "border-[#C7E34F] ring-2 ring-[#C7E34F]/40"
                        : "border-zinc-800 hover:border-[#C7E34F]/60"
                    }`}
                  >
                    {tpl.tool === "Video" && (tpl.img.endsWith(".webm") || tpl.img.endsWith(".mp4")) ? (
                      <video
                        src={tpl.img}
                        muted
                        loop
                        playsInline
                        autoPlay
                        className="h-44 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <img
                        src={tpl.img}
                        loading="lazy"
                        className="h-44 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent px-3 pb-3 pt-10">
                      <p className="text-sm font-semibold leading-tight text-white">{tpl.name}</p>
                      <p className="mt-1 text-[11px] leading-tight text-zinc-300">{tpl.tagline}</p>
                    </div>
                    {selectedTemplate === tpl.key && (
                      <span className="absolute right-2 top-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#C7E34F] text-zinc-900">
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {selectedTemplate && visibleTemplates.some((t) => t.key === selectedTemplate) && (
                <p className="mt-3 text-xs text-zinc-500">
                  Template loaded{" "}
                  <span className="font-medium text-[#C7E34F]">
                    {visibleTemplates.find((template) => template.key === selectedTemplate)?.name}
                  </span>
                  . Update the prompt if needed, then{" "}
                  {creationTool === "Captions" ? "press Add captions" : "press Generate Image"}.
                </p>
              )}
            </section>


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
                              step.status === "done" ? "bg-[#C7E34F]" : "bg-zinc-800"
                            }`}
                          />
                        )}
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                            step.status === "done"
                              ? "border-[#C7E34F] bg-[#C7E34F]/15 text-[#C7E34F]"
                              : step.status === "running"
                              ? "border-[#C7E34F] bg-[#C7E34F]/10 text-[#C7E34F]"
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
                            {step.status === "running" && <p className="text-xs text-[#C7E34F] animate-pulse">working…</p>}
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
                  <div className="rounded-2xl border border-[#C7E34F]/40 bg-[#C7E34F]/10 p-6">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-[#C7E34F]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.7-9.3a1 1 0 00-1.4-1.4L9 10.6 7.7 9.3a1 1 0 00-1.4 1.4l2 2a1 1 0 001.4 0l4-4z" clipRule="evenodd" /></svg>
                      <p className="text-sm font-semibold text-white">Your post is ready</p>
                    </div>
                    <div className="mt-3 max-h-56 overflow-y-auto rounded-xl border border-zinc-800 bg-[#0c0c0e] p-4">
                      <p className="whitespace-pre-wrap text-sm leading-6 text-zinc-200">{result}</p>
                    </div>

                    {/* Auto-generated media for this post */}
                    <div className="mt-4">
                      {isGeneratingImage && (
                        <div className="flex items-center gap-2.5 rounded-xl border border-zinc-800 bg-zinc-950 p-3">
                          <div className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-[#C7E34F] border-t-transparent" />
                          <p className="text-xs text-zinc-400">Generating a matching image for your post…</p>
                        </div>
                      )}
{!isGeneratingImage && (generatedImage || generatedVideo) && (
  <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
    {generatedVideo ? (
      <VideoWithFallback
        src={generatedVideo}
        autoPlay
        loop
        muted
        playsInline
        className="w-full"
      />
    ) : (
      <img src={generatedImage ?? undefined} alt="Generated for this post" className="w-full object-cover" />
    )}
  </div>
)}

{!isGeneratingImage && generatedImage && (
  <div className="mt-3 rounded-xl border border-[#C7E34F]/40 bg-[#C7E34F]/10 p-3">
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium text-[#C7E34F]">Last Generated Image</span>
      <button
        onClick={() => {
          setPreviewImage(generatedImage);
          // Scroll to preview panel or show success message
        }}
        className="rounded-lg bg-[#C7E34F] px-3 py-1.5 text-xs font-medium text-zinc-900 transition hover:bg-[#C7E34F]"
      >
        Use This
      </button>
    </div>
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
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#C7E34F] px-4 py-2.5 text-sm font-medium text-zinc-900 transition hover:bg-[#C7E34F]"
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
                          className="rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-200 outline-none focus:border-[#C7E34F]/60"
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
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#C7E34F] border-t-transparent" />
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
                    <VideoWithFallback
                      src={generatedVideo}
                      autoPlay
                      loop
                      playsInline
                      className="w-full"
                    />
                  </div>
                )}

                {activeTab === "video" && isGeneratingVideo && (
                  <div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-900">
                      <div className="h-full rounded-full bg-[#C7E34F] transition-all duration-300" style={{ width: `${videoProgress}%` }} />
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

{showPhoneMockup && activeTab !== "write" && (
        <PhoneMockup
          imageUrl={activeTab === "image" ? (generatedImage ?? undefined) : undefined}
          videoUrl={activeTab === "video" ? (generatedVideo ?? undefined) : undefined}
          isGenerating={isGeneratingImage || isGeneratingVideo}
          content={pipelineMediaPrompt || prompt}
          onClick={() => {
            // Only regenerate if there's no existing content
            if (activeTab === "image" && !generatedImage && !isGeneratingImage) {
              void handleImageGenerate();
            } else if (activeTab === "video" && !generatedVideo && !isGeneratingVideo) {
              void handleVideoGenerate();
            }
          }}
        />
      )}

      {templatePanelOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 px-4 py-6 backdrop-blur-md">
          <div className="relative flex max-h-[82vh] w-full max-w-3xl overflow-hidden rounded-3xl border border-zinc-800 bg-[#09090b] shadow-2xl">

            <button
              type="button"
              onClick={() => setTemplatePanelOpen(false)}
              className="absolute right-5 top-5 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-zinc-800 bg-black/60 text-zinc-400 transition hover:border-zinc-600 hover:text-white"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="hidden w-[32%] border-r border-zinc-800 bg-[#0c0c0f] p-5 md:block">
              <div className="flex h-full flex-col">
                <div>
                  <span className="inline-flex rounded-full border border-[#C7E34F]/30 bg-[#C7E34F]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#C7E34F]">
                    AI Template
                  </span>

                  <h2 className="mt-4 text-2xl font-semibold text-white">
                    {TEMPLATES.find((t) => t.key === selectedTemplate)?.name}
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-zinc-500">
                    {TEMPLATES.find((t) => t.key === selectedTemplate)?.tagline}
                  </p>
                </div>

                <div className="mt-8 overflow-hidden rounded-2xl border border-zinc-800 bg-black">
                  {(() => {
                    const tpl = TEMPLATES.find((t) => t.key === selectedTemplate);
                    if (!tpl) return null;

                    return tpl.img.endsWith(".webm") || tpl.img.endsWith(".mp4") ? (
                      <video
                        src={tpl.img}
                        muted
                        loop
                        playsInline
                        autoPlay
                        className="aspect-square w-full object-cover"
                      />
                    ) : (
                      <img
                        src={tpl.img}
                        className="aspect-square w-full object-cover"
                      />
                    );
                  })()}
                </div>

                <div className="mt-auto pt-6">
                  <div className="flex items-center gap-2">
                    {[1, 2, 3].map((step) => (
                      <div
                        key={step}
                        className={`h-1 flex-1 rounded-full ${
                          templateStep >= step
                            ? "bg-[#C7E34F]"
                            : "bg-zinc-800"
                        }`}
                      />
                    ))}
                  </div>

                  <p className="mt-3 text-xs text-zinc-600">
                    Step {templateStep} of 3
                  </p>
                </div>
              </div>
            </div>

            <div className="flex min-h-[480px] flex-1 flex-col p-6 md:p-7">
              {templateStep === 1 && (
                <>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-[#C7E34F]">
                      Step 1
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold text-white">
                      Add your image
                    </h3>
                    <p className="mt-2 max-w-lg text-sm leading-6 text-zinc-500">
                      Upload the image you want to process with this template.
                    </p>
                  </div>

                  <label
                    htmlFor="template-image-upload"
                    className="mt-8 flex min-h-[300px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-700 bg-zinc-950/70 p-8 text-center transition hover:border-[#C7E34F]/60 hover:bg-[#C7E34F]/[0.03]"
                  >
                    {templatePreview ? (
                      <img
                        src={templatePreview}
                        alt="Selected"
                        className="max-h-[260px] max-w-full rounded-xl object-contain"
                      />
                    ) : (
                      <>
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 text-[#C7E34F]">
                          <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 16V4m0 0l-4 4m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
                          </svg>
                        </div>
                        <p className="mt-4 text-sm font-medium text-white">
                          Upload an image
                        </p>
                        <p className="mt-1 text-xs text-zinc-600">
                          PNG, JPG or WEBP
                        </p>
                      </>
                    )}

                    <input
                      id="template-image-upload"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;

                        setTemplateFile(file);
                        setTemplateError("");

                        const url = URL.createObjectURL(file);
                        setTemplatePreview(url);
                      }}
                    />
                  </label>

                  {templateFile && (
                    <div className="mt-4 flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-white">
                          {templateFile.name}
                        </p>
                        <p className="text-xs text-zinc-600">
                          {(templateFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <span className="text-xs text-emerald-400">Ready</span>
                    </div>
                  )}

                  {templateError && (
                    <p className="mt-4 text-sm text-red-400">
                      {templateError}
                    </p>
                  )}

                  <div className="mt-auto flex justify-end pt-8">
                    <button
                      type="button"
                      disabled={!templateFile}
                      onClick={() => void handleTemplateProcess()}
                      className="rounded-xl bg-[#C7E34F] px-6 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-[#C7E34F] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Next →
                    </button>
                  </div>
                </>
              )}

              {templateStep === 2 && (
                <div className="flex flex-1 flex-col items-center justify-center text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#C7E34F]/30 bg-[#C7E34F]/10">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#C7E34F] border-t-transparent" />
                  </div>

                  <h3 className="mt-6 text-2xl font-semibold text-white">
                    Processing your image
                  </h3>

                  <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">
                    Octa Studio is sending your image to the local ComfyUI
                    workflow and removing the background with BiRefNet.
                  </p>

                  <div className="mt-8 w-full max-w-md overflow-hidden rounded-full bg-zinc-900">
                    <div className="h-1.5 w-2/3 animate-pulse rounded-full bg-[#C7E34F]" />
                  </div>
                </div>
              )}

              {templateStep === 3 && (
                <>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-emerald-400">
                      Complete
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold text-white">
                      Background removed
                    </h3>
                    <p className="mt-2 text-sm text-zinc-500">
                      Your transparent image is ready.
                    </p>
                  </div>

                  {generatedImage && (
                    <div className="mt-7 flex flex-1 items-center justify-center overflow-hidden rounded-2xl border border-zinc-800 bg-[linear-gradient(45deg,#18181b_25%,transparent_25%),linear-gradient(-45deg,#18181b_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#18181b_75%),linear-gradient(-45deg,transparent_75%,#18181b_75%)] bg-[length:24px_24px] bg-[position:0_0,0_12px,12px_-12px,-12px_0px]">
                      <img
                        src={generatedImage}
                        alt="Background removed"
                        className="max-h-[320px] max-w-full object-contain"
                      />
                    </div>
                  )}

                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setTemplateStep(1);
                        setTemplateFile(null);
                        setTemplatePreview(null);
                        setGeneratedImage(null);
                      }}
                      className="rounded-xl border border-zinc-800 px-5 py-3 text-sm font-medium text-zinc-300 transition hover:border-zinc-700 hover:text-white"
                    >
                      Start Again
                    </button>

                    {generatedImage && (
                      <>
                        <button
                          type="button"
                          disabled={isCreating}
                          onClick={async () => {
                            if (!generatedImage || isCreating) return;

                            setIsCreating(true);
                            setError("");

                            try {
                              const content = await createContent({
                                title:
                                  prompt.trim().slice(0, 80) ||
                                  "Background Removed Image",
                                body: result.trim() || "AI generated image",
                                platform: platform || "Instagram",
                              });

                              router.push(`/content/${content.id}`);
                            } catch (err) {
                              console.error(err);
                              setError(
                                err instanceof Error
                                  ? err.message
                                  : "Could not open this image in Post Content."
                              );
                            } finally {
                              setIsCreating(false);
                            }
                          }}
                          className="rounded-xl bg-[#C7E34F] px-5 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-[#C7E34F] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isCreating ? "Opening..." : "Use this image → Post"}
                        </button>

                        <a
                          href={generatedImage}
                          download
                          className="rounded-xl border border-zinc-700 px-5 py-3 text-sm font-semibold text-zinc-200 transition hover:border-zinc-600 hover:text-white"
                        >
                          Download PNG
                        </a>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

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

            <div className="mt-5 rounded-xl border border-[#C7E34F]/40 bg-[#C7E34F]/10 p-4">
              <div className="flex items-baseline justify-between">
                <p className="text-sm font-semibold text-white">octa-studio PRO</p>
                <p className="text-sm font-semibold text-[#C7E34F]">₹999<span className="text-[10px] text-zinc-500">/month</span></p>
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
                className="mt-5 w-full rounded-xl bg-[#C7E34F] px-4 py-2.5 text-sm font-medium text-zinc-900 transition hover:bg-[#C7E34F] disabled:opacity-60"
              >
                {purchaseBusy ? "Processing..." : "Buy with Razorpay"}
              </button>
            ) : (
              <div className="mt-5 grid gap-2">
                <Link href="/signup?next=/ai-studio" className="rounded-xl bg-[#C7E34F] px-4 py-2.5 text-center text-sm font-medium text-zinc-900 transition hover:bg-[#C7E34F]">
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
