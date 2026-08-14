"use client";

import { useRef, useState, useTransition } from "react";
import { updateContent } from "@/app/content/actions/update-content";
import { PostPreviewPanel } from "@/components/ai-studio/post-preview-panel";

interface MediaItem {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  type: string;
}

interface ContentEditorProps {
  id: string;
  initialTitle: string;
  initialBody: string;
  initialPlatform: string;
  initialMedia?: MediaItem[];
  disabled?: boolean;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024;

const ALLOWED_MEDIA_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

const studioTools = [
  {
    title: "Generate Ideas",
    instruction: "Give 3 short, specific content ideas for the topic below.",
  },
  {
    title: "Write Content",
    instruction: "Write a full post for the topic below.",
  },
  {
    title: "Generate Hook",
    instruction: "Create 3 strong opening hooks for the topic below.",
  },
  {
    title: "Generate Title",
    instruction: "Turn the topic below into 3 clickable titles.",
  },
  {
    title: "Repurpose",
    instruction: "Transform the content below for another platform.",
  },
];

const aiActions = [
  {
    label: "Improve",
    instruction:
      "Improve this content while keeping the original meaning. Make it clearer, more engaging, natural, and professional.",
  },
  {
    label: "Rewrite",
    instruction:
      "Rewrite this content from scratch while preserving the core message. Make it fresh, natural, and engaging.",
  },
  {
    label: "Shorten",
    instruction:
      "Shorten this content significantly while keeping the most important information and message.",
  },
  {
    label: "Expand",
    instruction:
      "Expand this content with useful detail, examples, and stronger explanations. Do not add meaningless filler.",
  },
  {
    label: "Fix Grammar",
    instruction:
      "Fix grammar, spelling, punctuation, awkward wording, and sentence structure. Keep the original meaning and tone.",
  },
  {
    label: "Make Engaging",
    instruction:
      "Make this content more engaging and attention-grabbing. Improve the opening, flow, clarity, and readability.",
  },
];

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ContentEditor({
  id,
  initialTitle,
  initialBody,
  initialPlatform,
  initialMedia = [],
  disabled = false,
}: ContentEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);
  const [platform, setPlatform] = useState(initialPlatform);
  const [media, setMedia] = useState<MediaItem[]>(initialMedia);

  const [isPending, startTransition] = useTransition();
  const [aiAction, setAiAction] = useState<string | null>(null);
  const [aiError, setAiError] = useState("");

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [studioTool, setStudioTool] = useState("Write Content");
  const [studioPrompt, setStudioPrompt] = useState("");
  const [studioGenerating, setStudioGenerating] = useState(false);
  const [studioError, setStudioError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleAI(instruction: string, label: string) {
    if (!body.trim()) {
      setAiError("Write some content first.");
      return;
    }

    setAiAction(label);
    setAiError("");

    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: `${instruction}

Platform: ${platform || "General"}

Content:
${body}

Return only the improved content. Do not explain what you changed.`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "AI generation failed.");
      }

      if (!data.result?.trim()) {
        throw new Error("AI returned an empty result.");
      }

      setBody(data.result.trim());
    } catch (error) {
      setAiError(
        error instanceof Error
          ? error.message
          : "Something went wrong with the AI.",
      );
    } finally {
      setAiAction(null);
    }
  }

  async function handleStudioGenerate() {
    if (studioGenerating) {
      return;
    }

    const tool =
      studioTools.find((entry) => entry.title === studioTool) ??
      studioTools[1];

    const promptText = studioPrompt.trim();

    if (!promptText && tool.title !== "Repurpose") {
      setStudioError("Tell AI what you want to create.");
      return;
    }

    if (tool.title === "Repurpose" && !promptText && !body.trim()) {
      setStudioError("Write some content first, or describe what to repurpose.");
      return;
    }

    setStudioGenerating(true);
    setStudioError("");

    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: `${tool.instruction}

Platform: ${platform || "General"}

${promptText || body}`,
          tool: tool.title,
          platform: platform || "Instagram",
          contentType: media.some((item) => item.type === "VIDEO")
            ? "Reel"
            : "Post",
          tone: "Engaging",
          length: "Medium",
          context: tool.title === "Repurpose" ? body : "",
        }),
      });

      const text = await response.text();
      let data: Record<string, any> = {};
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(
          `The server returned an unexpected response (${response.status}). Please try again.`,
        );
      }

      if (!response.ok) {
        throw new Error(data.error || "Generation failed.");
      }

      const result = (data.result || "").trim();

      if (!result) {
        throw new Error("AI returned an empty result.");
      }

      if (tool.title === "Generate Title") {
        const firstLine = result
          .split("\n")
          .map((line: string) => line.replace(/^\d+[.)\s-]+/, "").trim())
          .find(Boolean);
        setTitle(firstLine || result.slice(0, 80));
      } else {
        setBody(result);
      }
    } catch (error) {
      setStudioError(
        error instanceof Error
          ? error.message
          : "Something went wrong with the AI.",
      );
    } finally {
      setStudioGenerating(false);
    }
  }

  function handleSave() {
    startTransition(async () => {
      await updateContent({
        id,
        title,
        body,
        platform,
      });
    });
  }

  function openFilePicker() {
    if (!disabled && !uploading) {
      fileInputRef.current?.click();
    }
  }

  async function uploadFiles(files: File[]) {
    if (!files.length) {
      return;
    }

    const validFiles: File[] = [];

    for (const file of files) {
      if (!ALLOWED_MEDIA_TYPES.has(file.type)) {
        setUploadError(
          `"${file.name}" is not a supported image or video.`,
        );
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        setUploadError(
          `"${file.name}" is larger than 50 MB.`,
        );
        continue;
      }

      validFiles.push(file);
    }

    if (!validFiles.length) {
      return;
    }

    setUploading(true);
    setUploadError("");

    try {
      for (const file of validFiles) {
        const formData = new FormData();

        formData.append("file", file);
        formData.append("contentId", id);

        const response = await fetch("/api/media/upload", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || `Failed to upload ${file.name}.`,
          );
        }

        if (data.media) {
          setMedia((current) => [data.media, ...current]);
        }
      }
    } catch (error) {
      setUploadError(
        error instanceof Error
          ? error.message
          : "Media upload failed.",
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleUpload(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const files = Array.from(event.target.files ?? []);

    await uploadFiles(files);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();

    if (!disabled && !uploading) {
      setIsDragging(true);
    }
  }

  function handleDragLeave(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();

    if (!event.currentTarget.contains(event.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }

  async function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);

    if (disabled || uploading) {
      return;
    }

    const files = Array.from(event.dataTransfer.files);

    await uploadFiles(files);
  }

  async function handleDeleteMedia(mediaId: string) {
    const item = media.find((entry) => entry.id === mediaId);

    if (!item) {
      return;
    }

    const confirmed = window.confirm(
      `Delete "${item.filename}"? This cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(mediaId);
    setUploadError("");

    try {
      const response = await fetch(`/api/media/${mediaId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete media.");
      }

      setMedia((current) =>
        current.filter((entry) => entry.id !== mediaId),
      );
    } catch (error) {
      setUploadError(
        error instanceof Error
          ? error.message
          : "Media deletion failed.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <label
          htmlFor="content-title"
          className="text-sm font-medium text-zinc-700"
        >
          Title
        </label>

        <input
          id="content-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          disabled={disabled}
          className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-2xl font-semibold tracking-tight text-zinc-950 outline-none transition focus:border-zinc-400"
          placeholder="Give your content a title..."
        />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label
            htmlFor="content-body"
            className="text-sm font-medium text-zinc-700"
          >
            Content
          </label>

          <span className="text-xs text-zinc-400">
            {body.length} characters
          </span>
        </div>

        <textarea
          id="content-body"
          value={body}
          onChange={(event) => {
            setBody(event.target.value);
            setAiError("");
          }}
          disabled={disabled}
          className="mt-2 min-h-[420px] w-full resize-y rounded-xl border border-zinc-200 bg-white px-4 py-4 text-base leading-7 text-zinc-800 outline-none transition focus:border-zinc-400"
          placeholder="Start writing your content..."
        />
      </div>

      <div
        className={[
          "rounded-2xl border bg-white p-5 transition",
          isDragging
            ? "border-zinc-950 bg-zinc-50 ring-2 ring-zinc-950/10"
            : "border-zinc-200",
        ].join(" ")}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-950">
              Media
            </p>

            <p className="mt-1 text-xs text-zinc-500">
              Add images or videos to this content.
            </p>
          </div>

          {!disabled && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
                multiple
                className="hidden"
                onChange={handleUpload}
              />

              <button
                type="button"
                onClick={openFilePicker}
                disabled={uploading}
                className="rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uploading ? "Uploading..." : "Add media"}
              </button>
            </>
          )}
        </div>

        {uploadError && (
          <p className="mt-3 text-sm text-red-600">
            {uploadError}
          </p>
        )}

        {isDragging && (
          <p className="mt-4 rounded-lg bg-zinc-950 px-3 py-2 text-center text-xs font-medium text-white">
            Drop your files here
          </p>
        )}

        {media.length > 0 ? (
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {media.map((item) => (
              <div
                key={item.id}
                className="group overflow-hidden rounded-xl border border-zinc-200 bg-white"
              >
                <div className="relative aspect-video overflow-hidden bg-zinc-100">
                  {item.type === "VIDEO" ? (
                    <video
                      src={item.url}
                      controls
                      preload="metadata"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <img
                      src={item.url}
                      alt={item.filename}
                      className="h-full w-full object-cover"
                    />
                  )}

                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => handleDeleteMedia(item.id)}
                      disabled={deletingId === item.id}
                      className="absolute right-3 top-3 rounded-lg bg-black/75 px-3 py-2 text-xs font-medium text-white opacity-0 backdrop-blur transition group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {deletingId === item.id ? "Deleting..." : "Delete"}
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p
                      className="truncate text-sm font-medium text-zinc-900"
                      title={item.filename}
                    >
                      {item.filename}
                    </p>

                    <p className="mt-1 text-xs text-zinc-400">
                      {item.type === "VIDEO" ? "Video" : "Image"} ·{" "}
                      {formatFileSize(item.size)}
                    </p>
                  </div>

                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 text-xs font-medium text-zinc-500 hover:text-zinc-950"
                  >
                    Open
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <button
            type="button"
            onClick={openFilePicker}
            disabled={disabled || uploading}
            className="mt-5 flex w-full flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-10 text-center transition hover:border-zinc-500 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="text-sm font-medium text-zinc-800">
              {uploading ? "Uploading..." : "Drop images or videos here"}
            </span>

            <span className="mt-1 text-xs text-zinc-400">
              or click to browse · max 50 MB per file
            </span>
          </button>
        )}
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-950">
              AI Editor
            </p>

            <p className="mt-1 text-xs text-zinc-500">
              Improve your draft with AI.
            </p>
          </div>

          {aiAction && (
            <span className="text-xs text-zinc-500">
              AI is {aiAction.toLowerCase()}ing...
            </span>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {aiActions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={() => handleAI(action.instruction, action.label)}
              disabled={disabled || !!aiAction || !body.trim()}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 transition hover:border-zinc-400 hover:text-zinc-950 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {aiAction === action.label ? "Working..." : action.label}
            </button>
          ))}
        </div>

        {aiError && (
          <p className="mt-3 text-xs text-red-600">
            {aiError}
          </p>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-950">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_400px]">
          <div className="p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-fuchsia-400">
              AI Studio
            </p>

            <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">
              Draft once. Preview everywhere.
            </h2>

            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Write posts, chain pipelines, and generate images or videos —
              with a live preview on phone, tablet, and MacBook.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {studioTools.map((tool) => (
                <button
                  key={tool.title}
                  type="button"
                  onClick={() => setStudioTool(tool.title)}
                  disabled={disabled}
                  className={`rounded-full border px-3.5 py-2 text-xs font-medium transition ${
                    studioTool === tool.title
                      ? "border-fuchsia-500/60 bg-fuchsia-500/10 text-fuchsia-300"
                      : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
                  } disabled:cursor-not-allowed disabled:opacity-40`}
                >
                  {tool.title}
                </button>
              ))}
            </div>

            <textarea
              value={studioPrompt}
              onChange={(event) => {
                setStudioPrompt(event.target.value);
                setStudioError("");
              }}
              disabled={disabled}
              placeholder="Tell AI what you want to create."
              className="mt-4 min-h-[96px] w-full resize-y rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-sm leading-6 text-zinc-200 outline-none transition placeholder:text-zinc-600 focus:border-fuchsia-500/50"
            />

            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={handleStudioGenerate}
                disabled={disabled || studioGenerating}
                className="rounded-lg bg-fuchsia-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-fuchsia-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {studioGenerating ? "Generating..." : "Generate draft"}
              </button>

              <span className="text-xs text-zinc-500">
                {studioGenerating
                  ? "AI is writing..."
                  : "The result lands straight into the editor and preview."}
              </span>
            </div>

            {studioError && (
              <p className="mt-3 text-xs text-red-400">{studioError}</p>
            )}
          </div>

          <div className="border-t border-zinc-800/80 bg-[#0c0c0e] lg:border-l lg:border-t-0">
            <PostPreviewPanel
              content={body}
              platform={platform || "Instagram"}
              contentType={
                media.some((item) => item.type === "VIDEO") ? "Reel" : "Post"
              }
              isGenerating={studioGenerating}
              prompt={studioPrompt}
              imageUrl={
                media.find((item) => item.type !== "VIDEO")?.url ?? null
              }
            />
          </div>
        </div>
      </div>

      <div>
        <label
          htmlFor="content-platform"
          className="text-sm font-medium text-zinc-700"
        >
          Platform
        </label>

        <select
          id="content-platform"
          value={platform}
          onChange={(event) => setPlatform(event.target.value)}
          disabled={disabled}
          className="mt-2 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-800 outline-none focus:border-zinc-400"
        >
          <option value="">Select platform</option>
          <option value="YouTube">YouTube</option>
          <option value="Instagram">Instagram</option>
          <option value="LinkedIn">LinkedIn</option>
          <option value="X">X</option>
          <option value="Newsletter">Newsletter</option>
          <option value="Blog">Blog</option>
        </select>
      </div>

      {!disabled && (
        <div className="flex items-center justify-between border-t border-zinc-200 pt-6">
          <span className="text-sm text-zinc-400">
            {isPending ? "Saving..." : "Draft"}
          </span>

          <button
            type="button"
            onClick={handleSave}
            disabled={isPending || !!aiAction || uploading}
            className="rounded-lg bg-zinc-950 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "Saving..." : "Save Draft"}
          </button>
        </div>
      )}

      {disabled && (
        <div className="flex items-center justify-between border-t border-zinc-200 pt-6">
          <span className="text-sm text-zinc-400">
            Published content
          </span>

          <span className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm font-medium text-zinc-500">
            Read only
          </span>
        </div>
      )}
    </div>
  );
}
