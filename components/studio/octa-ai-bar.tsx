"use client";

import {
  ArrowUp,
  Captions,
  FileImage,
  FileVideo,
  Image,
  Paperclip,
  Scissors,
  Sparkles,
  Upload,
  Video,
  WandSparkles,
  X,
} from "lucide-react";
import { useRef, useState } from "react";

const quickActions = [
  { label: "Auto edit", icon: WandSparkles },
  { label: "Generate video", icon: Video },
  { label: "Generate image", icon: Image },
  { label: "Add captions", icon: Captions },
  { label: "Smart cut", icon: Scissors },
];

const ACCEPTED_TYPES =
  "image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime,audio/mpeg,audio/wav,audio/mp4";

type Attachment = {
  id: string;
  file: File;
  preview?: string;
};

export function OctaAIBar() {
  const inputRef = useRef<HTMLInputElement>(null);

  const [prompt, setPrompt] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [dragging, setDragging] = useState(false);

  function addFiles(files: FileList | File[]) {
    const incoming = Array.from(files);

    const next = incoming
      .filter((file) => file.type.startsWith("image/") ||
        file.type.startsWith("video/") ||
        file.type.startsWith("audio/"))
      .map((file) => ({
        id: `${file.name}-${file.lastModified}-${Math.random()}`,
        file,
        preview: file.type.startsWith("image/")
          ? URL.createObjectURL(file)
          : undefined,
      }));

    setAttachments((current) => [...current, ...next]);
  }

  function removeAttachment(id: string) {
    setAttachments((current) => {
      const item = current.find((attachment) => attachment.id === id);

      if (item?.preview) {
        URL.revokeObjectURL(item.preview);
      }

      return current.filter((attachment) => attachment.id !== id);
    });
  }

  function submit() {
    const value = prompt.trim();

    if (!value && attachments.length === 0) return;

    console.log("OCTA AI request", {
      prompt: value,
      files: attachments.map((attachment) => attachment.file),
    });

    // Connect to the OCTA AI/editor action API here.
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);

    if (event.dataTransfer.files.length) {
      addFiles(event.dataTransfer.files);
    }
  }

  const hasInput = prompt.trim().length > 0 || attachments.length > 0;

  const buttonLabel =
    attachments.length > 0
      ? "Edit with OCTA AI"
      : "Generate";

  return (
    <section className="w-full px-4 pb-3">
      <div className="mx-auto w-full max-w-5xl">
        <div
          onDragEnter={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node)) {
              setDragging(false);
            }
          }}
          onDrop={handleDrop}
          className={[
            "overflow-hidden rounded-2xl border bg-[#101114]/95 shadow-2xl backdrop-blur-xl transition-all",
            dragging
              ? "border-white/40 bg-white/[0.06]"
              : "border-white/10",
          ].join(" ")}
        >
          {/* Header */}
          <div className="flex items-center gap-2 border-b border-white/6 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-white text-black">
                <Sparkles className="size-3.5" />
              </div>

              <span className="text-sm font-semibold tracking-tight text-white">
                OCTA AI
              </span>

              <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] font-medium text-white/45">
                AI EDITOR
              </span>
            </div>

            <div className="ml-auto text-[11px] text-white/35">
              Describe + upload
            </div>
          </div>

          {/* Composer */}
          <div className="p-3">
            {/* Attachments */}
            {attachments.length > 0 && (
              <div className="mb-3 flex gap-2 overflow-x-auto">
                {attachments.map((attachment) => {
                  const { file, preview } = attachment;

                  const Icon = file.type.startsWith("video/")
                    ? FileVideo
                    : file.type.startsWith("image/")
                      ? FileImage
                      : Paperclip;

                  return (
                    <div
                      key={attachment.id}
                      className="group relative flex h-14 shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-2"
                    >
                      {preview ? (
                        <img
                          src={preview}
                          alt=""
                          className="size-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex size-10 items-center justify-center rounded-lg bg-white/[0.07]">
                          <Icon className="size-4 text-white/60" />
                        </div>
                      )}

                      <div className="max-w-32">
                        <p className="truncate text-[11px] text-white/75">
                          {file.name}
                        </p>
                        <p className="text-[10px] text-white/30">
                          {(file.size / 1024 / 1024).toFixed(1)} MB
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeAttachment(attachment.id)}
                        className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full border border-white/10 bg-[#18191d] text-white/50 opacity-0 transition-opacity hover:text-white group-hover:opacity-100"
                        aria-label={`Remove ${file.name}`}
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Main input */}
            <div
              className={[
                "flex items-end gap-3 rounded-xl border bg-white/[0.035] p-3 transition-colors",
                dragging
                  ? "border-white/30"
                  : "border-white/8 focus-within:border-white/20",
              ].join(" ")}
            >
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="mb-1 flex size-8 shrink-0 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/[0.07] hover:text-white"
                aria-label="Upload media"
              >
                <Paperclip className="size-4" />
              </button>

              <input
                ref={inputRef}
                type="file"
                accept={ACCEPTED_TYPES}
                multiple
                className="hidden"
                onChange={(event) => {
                  if (event.target.files) {
                    addFiles(event.target.files);
                  }

                  event.target.value = "";
                }}
              />

              <textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    !event.shiftKey
                  ) {
                    event.preventDefault();
                    submit();
                  }
                }}
                rows={2}
                placeholder="Describe what you want OCTA AI to create or change..."
                className="min-h-[48px] flex-1 resize-none bg-transparent px-1 py-1 text-sm text-white outline-none placeholder:text-white/30"
              />

              <button
                type="button"
                onClick={submit}
                disabled={!hasInput}
                className="flex h-9 shrink-0 items-center gap-2 rounded-lg bg-white px-3 text-xs font-medium text-black transition-all hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <span>{buttonLabel}</span>
                <ArrowUp className="size-3.5" />
              </button>
            </div>

            {/* Upload hint */}
            {attachments.length === 0 && (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="mt-2 flex w-full items-center justify-center gap-1.5 text-[10px] text-white/30 transition-colors hover:text-white/60"
              >
                <Upload className="size-3" />
                Drop images, videos or audio here
              </button>
            )}

            {/* Quick actions */}
            <div className="mt-2 flex gap-2 overflow-x-auto">
              {quickActions.map((action) => {
                const Icon = action.icon;

                return (
                  <button
                    key={action.label}
                    type="button"
                    onClick={() => setPrompt(action.label)}
                    className="flex shrink-0 items-center gap-1.5 rounded-lg border border-white/7 bg-white/[0.025] px-2.5 py-1.5 text-[11px] text-white/50 transition-colors hover:border-white/15 hover:bg-white/[0.06] hover:text-white/80"
                  >
                    <Icon className="size-3" />
                    {action.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
