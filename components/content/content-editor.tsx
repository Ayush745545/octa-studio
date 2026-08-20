"use client";

import { useRef, useState, useTransition } from "react";
import { motion } from "motion/react";
import { updateContent } from "@/app/content/actions/update-content";
import { PostPreviewPanel } from "@/components/ai-studio/post-preview-panel";
import VideoWithFallback from "@/components/video-with-fallback";
import ContentStatusSelector from "@/components/content/content-status-selector";
import PublicationSelector from "@/components/content/publication-selector";
import PublishButton from "@/components/content/publish-button";
import DeleteContentButton from "@/components/content/delete-content-button";

interface MediaItem {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  type: string;
}

interface IdeaContext {
  id: string;
  title: string;
  category?: string | null;
}

interface Channel {
  id: string;
  platform: string;
}

interface Publication {
  channelId: string;
  status: string;
}

interface ContentEditorProps {
  id: string;
  initialTitle: string;
  initialBody: string;
  initialPlatform: string;
  initialMedia?: MediaItem[];
  idea?: IdeaContext | null;
  status?: string;
  scheduledAt?: string | Date | null;
  channels?: Channel[];
  publications?: Publication[];
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
    icon: (
      <svg
        className="h-3.5 w-3.5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3z" />
        <path d="M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14z" />
      </svg>
    ),
  },
  {
    label: "Rewrite",
    instruction:
      "Rewrite this content from scratch while preserving the core message. Make it fresh, natural, and engaging.",
    icon: (
      <svg
        className="h-3.5 w-3.5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 12a8 8 0 0114-5.3L20 8" />
        <path d="M20 4v4h-4" />
        <path d="M20 12a8 8 0 01-14 5.3L4 16" />
        <path d="M4 20v-4h4" />
      </svg>
    ),
  },
  {
    label: "Shorten",
    instruction:
      "Shorten this content significantly while keeping the most important information and message.",
    icon: (
      <svg
        className="h-3.5 w-3.5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="6" cy="6" r="3" />
        <circle cx="6" cy="18" r="3" />
        <path d="M20 4L8.5 15.5" />
        <path d="M14.5 14.5L20 20" />
        <path d="M8.5 8.5L12 12" />
      </svg>
    ),
  },
  {
    label: "Expand",
    instruction:
      "Expand this content with useful detail, examples, and stronger explanations. Do not add meaningless filler.",
    icon: (
      <svg
        className="h-3.5 w-3.5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M15 3h6v6" />
        <path d="M9 21H3v-6" />
        <path d="M21 3l-7 7" />
        <path d="M3 21l7-7" />
      </svg>
    ),
  },
  {
    label: "Fix Grammar",
    instruction:
      "Fix grammar, spelling, punctuation, awkward wording, and sentence structure. Keep the original meaning and tone.",
    icon: (
      <svg
        className="h-3.5 w-3.5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9 12l2 2 4-4" />
        <circle cx="12" cy="12" r="9" />
      </svg>
    ),
  },
  {
    label: "Make Engaging",
    instruction:
      "Make this content more engaging and attention-grabbing. Improve the opening, flow, clarity, and readability.",
    icon: (
      <svg
        className="h-3.5 w-3.5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
      </svg>
    ),
  },
];

const TABS = [
  { key: "compose", label: "Compose" },
  { key: "ai", label: "AI Tools" },
  { key: "publish", label: "Schedule & Publish" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const requiredMark = <span className="ml-0.5 text-red-400/90">*</span>;

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
  idea = null,
  status = "DRAFT",
  scheduledAt = null,
  channels = [],
  publications = [],
  disabled = false,
}: ContentEditorProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("compose");

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
      let data: { error?: string; result?: string } = {};
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

  const fieldLabel = "mb-2 block text-sm font-medium text-zinc-300";
  const fieldBase =
    "w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 text-white outline-none transition placeholder:text-zinc-600 focus:border-[#7FFB50] focus:ring-1 focus:ring-[#7FFB50]/30 disabled:opacity-60";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="mb-6 inline-flex rounded-xl border border-zinc-800 bg-zinc-950 p-1">
        {TABS.map((tab) => {
          const active = tab.key === activeTab;

          return (
            <motion.button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`relative flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                active
                  ? "text-[#7FFB50]"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="content-tab-pill"
                  className="absolute inset-0 rounded-lg bg-[#7FFB50]/10"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}

              <span className="relative">{tab.label}</span>
            </motion.button>
          );
        })}
      </div>

      {activeTab === "compose" && (
        <motion.div
          key="compose"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="space-y-6"
        >
          <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            {idea && (
              <a
                href={`/ideas/${idea.id}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#7FFB50]/20 bg-[#7FFB50]/[0.06] px-3 py-1 text-xs font-medium text-[#7FFB50] transition hover:bg-[#7FFB50]/10"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[#7FFB50]" />
                From idea: {idea.title}
              </a>
            )}

            <div className={idea ? "mt-6 space-y-6" : "space-y-6"}>
              <div>
                <label htmlFor="content-title" className={fieldLabel}>
                  Title
                </label>

                <input
                  id="content-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  disabled={disabled}
                  className={`${fieldBase} py-3 text-2xl font-semibold tracking-tight`}
                  placeholder="Give your content a title..."
                />
              </div>

              <div>
                <label htmlFor="content-body" className={fieldLabel}>
                  Content
                </label>

                <div className="relative">
                  <textarea
                    id="content-body"
                    value={body}
                    onChange={(event) => {
                      setBody(event.target.value);
                      setAiError("");
                    }}
                    disabled={disabled}
                    className={`${fieldBase} min-h-[420px] resize-y py-4 pr-4 pb-9 text-base leading-7`}
                    placeholder="Start writing your content..."
                  />

                  <span className="pointer-events-none absolute bottom-3 right-3 text-xs text-zinc-500">
                    {body.length} characters
                  </span>
                </div>
              </div>

              <div>
                <label htmlFor="content-platform" className={fieldLabel}>
                  Platform{requiredMark}
                </label>

                <select
                  id="content-platform"
                  value={platform}
                  onChange={(event) => setPlatform(event.target.value)}
                  disabled={disabled}
                  className={`${fieldBase} py-3 text-sm`}
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
            </div>
          </section>

          <div
            className={[
              "rounded-2xl border bg-[#0c0c0f] p-6 transition",
              isDragging
                ? "border-[#7FFB50] ring-2 ring-[#7FFB50]/20"
                : "border-zinc-800",
            ].join(" ")}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Media</p>

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
                    className="rounded-lg border border-zinc-800 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-white transition hover:border-[#7FFB50]/50 hover:text-[#7FFB50] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {uploading ? "Uploading..." : "Add media"}
                  </button>
                </>
              )}
            </div>

            {uploadError && (
              <p className="mt-3 text-sm text-red-400">{uploadError}</p>
            )}

            {isDragging && (
              <p className="mt-4 rounded-lg bg-[#7FFB50] px-3 py-2 text-center text-xs font-medium text-[#0a0a0c]">
                Drop your files here
              </p>
            )}

            {media.length > 0 ? (
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {media.map((item) => (
                  <motion.div
                    key={item.id}
                    whileHover={{ y: -3 }}
                    transition={{ type: "spring", stiffness: 300, damping: 22 }}
                    className="group overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950"
                  >
                    <div className="relative aspect-video overflow-hidden bg-zinc-900">
                      {item.type === "VIDEO" ? (
                        <VideoWithFallback
                          src={item.url}
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
                          className="truncate text-sm font-medium text-white"
                          title={item.filename}
                        >
                          {item.filename}
                        </p>

                        <p className="mt-1 text-xs text-zinc-500">
                          {item.type === "VIDEO" ? "Video" : "Image"} ·{" "}
                          {formatFileSize(item.size)}
                        </p>
                      </div>

                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="shrink-0 text-xs font-medium text-zinc-500 hover:text-[#7FFB50]"
                      >
                        Open
                      </a>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <button
                type="button"
                onClick={openFilePicker}
                disabled={disabled || uploading}
                className="mt-5 flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-zinc-700 bg-zinc-900/40 px-6 py-12 text-center transition hover:border-[#7FFB50]/50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <svg
                  className="h-9 w-9 text-zinc-500"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M7 18a4 4 0 010-8 5 5 0 019.6-1.5A3.5 3.5 0 0117 18H7z" />
                  <path d="M12 13v5" />
                  <path d="M9.5 15.5L12 13l2.5 2.5" />
                </svg>

                <span className="text-sm font-medium text-zinc-300">
                  {uploading ? "Uploading..." : "Drop images or videos here"}
                </span>

                <span className="text-xs text-zinc-500">
                  or click to browse · max 50 MB per file
                </span>
              </button>
            )}
          </div>
        </motion.div>
      )}

      {activeTab === "ai" && (
        <motion.div
          key="ai"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="space-y-6"
        >
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">AI Editor</p>

                <p className="mt-1 text-xs text-zinc-500">
                  Improve your draft with AI.
                </p>
              </div>

              {aiAction && (
                <span className="text-xs text-[#7FFB50]">
                  AI is {aiAction.toLowerCase()}ing...
                </span>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-2">
              {aiActions.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  onClick={() => handleAI(action.instruction, action.label)}
                  disabled={disabled || !!aiAction || !body.trim()}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
                    aiAction === action.label
                      ? "border-[#7FFB50]/60 bg-[#7FFB50]/10 text-[#7FFB50]"
                      : "border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-[#7FFB50]/50 hover:text-white"
                  }`}
                >
                  {action.icon}
                  {aiAction === action.label ? "Working..." : action.label}
                </button>
              ))}
            </div>

            {aiError && (
              <p className="mt-3 text-xs text-red-400">{aiError}</p>
            )}
          </div>

          <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950">
            <div className="grid lg:grid-cols-[minmax(0,1fr)_400px]">
              <div className="space-y-5 p-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#7FFB50]">
                    AI Studio
                  </p>

                  <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">
                    Draft once. Preview everywhere.
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-zinc-400">
                    Write posts, chain pipelines, and generate images or videos
                    — with a live preview on phone, tablet, and MacBook.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {studioTools.map((tool) => (
                    <button
                      key={tool.title}
                      type="button"
                      onClick={() => setStudioTool(tool.title)}
                      disabled={disabled}
                      className={`rounded-full border px-3.5 py-2 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
                        studioTool === tool.title
                          ? "border-[#7FFB50]/60 bg-[#7FFB50]/10 text-[#7FFB50]"
                          : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
                      }`}
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
                  className="mt-3 min-h-[96px] w-full resize-y rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-sm leading-6 text-zinc-200 outline-none transition placeholder:text-zinc-600 focus:border-[#7FFB50]/50"
                />

                <div className="mt-3 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleStudioGenerate}
                    disabled={disabled || studioGenerating}
                    className="rounded-lg bg-[#7FFB50] px-4 py-2.5 text-sm font-semibold text-[#0a0a0c] transition hover:bg-[#7FFB50]/90 disabled:cursor-not-allowed disabled:opacity-50"
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
                  <p className="text-xs text-red-400">{studioError}</p>
                )}
              </div>

              <div className="border-t border-zinc-800 bg-[#0c0c0e] lg:border-l lg:border-t-0">
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
        </motion.div>
      )}

      {activeTab === "publish" && (
        <motion.div
          key="publish"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="space-y-6"
        >
          <ContentStatusSelector
            id={id}
            status={status}
            scheduledAt={scheduledAt}
          />

          <PublicationSelector
            contentId={id}
            channels={channels}
            publications={publications}
            disabled={disabled}
          />

          <div className="flex flex-wrap items-center gap-3 border-t border-zinc-800 pt-6">
            {!disabled && (
              <button
                type="button"
                onClick={handleSave}
                disabled={isPending || !!aiAction || uploading}
                className="rounded-lg border border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-[#7FFB50]/50 hover:text-[#7FFB50] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPending ? "Saving..." : "Save Draft"}
              </button>
            )}

            <PublishButton id={id} status={status} />

            <DeleteContentButton id={id} status={status} />
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
