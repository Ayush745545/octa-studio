"use client";

import { useState } from "react";

type GenerationMode = "text" | "image" | "video";

interface MediaItem {
  url: string;
  filename: string;
  mimeType?: string;
  type?: string;
  preview?: string;
}

interface AIAssistantPanelProps {
  onClose: () => void;
  onUseResult: (result: string) => void;
  onUseMedia: (media: MediaItem[]) => void;
  platform: string;
}

export default function AIAssistantPanel({
  onClose,
  onUseResult,
  onUseMedia,
  platform,
}: AIAssistantPanelProps) {
  const [mode, setMode] = useState<GenerationMode>("text");
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [imageError, setImageError] = useState("");

  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoError, setVideoError] = useState("");

  async function handleTextGenerate() {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);
    setResult("");
    setError("");

    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          tool: "Write Content",
          platform: platform || "General",
          contentType: "Post",
          tone: "Engaging",
          length: "Medium",
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Generation failed.");
      if (!data.result?.trim()) throw new Error("AI returned an empty result.");

      setResult(data.result.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleImageGenerate() {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);
    setGeneratedImage(null);
    setImageError("");

    try {
      const response = await fetch("/api/ai/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          negativePrompt: "",
          width: 1024,
          height: 1024,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Image generation failed.");
      if (!data.success || !data.url) throw new Error("No image returned.");

      setGeneratedImage(data.url);
    } catch (err) {
      setImageError(err instanceof Error ? err.message : "Image generation failed. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleVideoGenerate() {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);
    setGeneratedVideo(null);
    setVideoError("");
    setVideoProgress(0);

    try {
      const response = await fetch("/api/ai/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          negativePrompt: "",
          width: 832,
          height: 480,
          frames: 49,
          fps: 16,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Video generation failed.");
      if (!data.success || !data.url) throw new Error("No video returned.");

      setGeneratedVideo(data.url);
    } catch (err) {
      setVideoError(err instanceof Error ? err.message : "Video generation failed. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  function handleUseImage() {
    if (!generatedImage) return;
    onUseMedia([
      {
        url: generatedImage,
        filename: `ai-image-${Date.now()}.png`,
        mimeType: "image/png",
        type: "IMAGE",
        preview: generatedImage,
      },
    ]);
    onClose();
  }

  function handleUseVideo() {
    if (!generatedVideo) return;
    onUseMedia([
      {
        url: generatedVideo,
        filename: `ai-video-${Date.now()}.mp4`,
        mimeType: "video/mp4",
        type: "VIDEO",
        preview: generatedVideo,
      },
    ]);
    onClose();
  }

  return (
    <div
      className="absolute inset-0 z-10 flex justify-end rounded-2xl bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.stopPropagation();
          onClose();
        }
      }}
    >
      <div
        className="h-full w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 shadow-xl slide-in-right"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <div>
            <h3 className="text-sm font-semibold text-white">AI Assistant</h3>
            <p className="mt-0.5 text-xs text-zinc-500">Generate content for {platform || "General"}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                onClose();
              }
            }}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-800 hover:text-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode("text")}
              className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                mode === "text"
                  ? "border-fuchsia-500 bg-fuchsia-500/15 text-fuchsia-300"
                  : "border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700"
              }`}
            >
              Text
            </button>
            <button
              type="button"
              onClick={() => setMode("image")}
              className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                mode === "image"
                  ? "border-fuchsia-500 bg-fuchsia-500/15 text-fuchsia-300"
                  : "border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700"
              }`}
            >
              Image
            </button>
            <button
              type="button"
              onClick={() => setMode("video")}
              className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                mode === "video"
                  ? "border-fuchsia-500 bg-fuchsia-500/15 text-fuchsia-300"
                  : "border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700"
              }`}
            >
              Video
            </button>
          </div>

          <div className="mt-4">
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder={
                mode === "text"
                  ? platform
                    ? `Generate a ${platform} post about...`
                    : "Type something..."
                  : mode === "image"
                  ? "Describe the image you want to create..."
                  : "Describe the video you want to create..."
              }
              className="min-h-24 w-full resize-y rounded-xl border border-zinc-800 bg-zinc-800/60 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700"
            />

            {(error || imageError || videoError) && (
              <p className="mt-2 text-xs text-red-400">
                {error || imageError || videoError}
              </p>
            )}

            {mode === "text" && (
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={handleTextGenerate}
                  disabled={!prompt.trim() || isGenerating}
                  className="rounded-xl bg-fuchsia-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-fuchsia-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isGenerating ? "Generating..." : "Generate Text"}
                </button>
              </div>
            )}

            {mode === "image" && (
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={handleImageGenerate}
                  disabled={!prompt.trim() || isGenerating}
                  className="rounded-xl bg-fuchsia-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-fuchsia-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isGenerating ? "Generating..." : "Generate Image"}
                </button>
              </div>
            )}

            {mode === "video" && (
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={handleVideoGenerate}
                  disabled={!prompt.trim() || isGenerating}
                  className="rounded-xl bg-fuchsia-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-fuchsia-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isGenerating ? "Generating..." : "Generate Video"}
                </button>
              </div>
            )}
          </div>

          {isGenerating && (
            <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-fuchsia-600 border-t-transparent" />
                <p className="text-xs text-zinc-400">
                  {mode === "video" ? "Generating video..." : "Generating..."}
                </p>
                {mode === "video" && videoProgress > 0 && (
                  <div className="h-1 w-32 overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-fuchsia-600 transition-all"
                      style={{ width: `${videoProgress}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {generatedImage && !isGenerating && (
            <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
              <p className="text-xs font-medium text-zinc-400">Generated Image</p>
              <div className="mt-2 overflow-hidden rounded-lg border border-zinc-800 bg-[#0a0a0c]">
                <img src={generatedImage} alt="Generated" className="w-full object-cover" />
              </div>
              <div className="mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setGeneratedImage(null)}
                  className="rounded-lg border border-zinc-800 px-3 py-2 text-xs text-zinc-300 transition hover:border-zinc-700 hover:text-white"
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={handleUseImage}
                  className="rounded-lg bg-fuchsia-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-fuchsia-500"
                >
                  Use Image
                </button>
              </div>
            </div>
          )}

          {generatedVideo && !isGenerating && (
            <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
              <p className="text-xs font-medium text-zinc-400">Generated Video</p>
              <div className="mt-2 overflow-hidden rounded-lg border border-zinc-800 bg-[#0a0a0c]">
                <img src={generatedVideo} alt="Video preview" className="w-full object-cover" />
              </div>
              <div className="mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setGeneratedVideo(null)}
                  className="rounded-lg border border-zinc-800 px-3 py-2 text-xs text-zinc-300 transition hover:border-zinc-700 hover:text-white"
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={handleUseVideo}
                  className="rounded-lg bg-fuchsia-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-fuchsia-500"
                >
                  Use Video
                </button>
              </div>
            </div>
          )}

          {mode === "text" && result && !isGenerating && (
            <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
              <div className="min-h-24 rounded-xl border border-zinc-800 bg-zinc-800/40 p-4">
                <p className="whitespace-pre-wrap text-sm leading-7 text-zinc-300">
                  {result}
                </p>
              </div>

              <div className="mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleTextGenerate}
                  disabled={isGenerating}
                  className="rounded-lg border border-zinc-800 px-3 py-2 text-xs font-medium text-zinc-300 transition hover:border-zinc-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Regenerate
                </button>
                <button
                  type="button"
                  onClick={() => onUseResult(result)}
                  className="rounded-lg bg-fuchsia-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-fuchsia-500"
                >
                  Use this
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
