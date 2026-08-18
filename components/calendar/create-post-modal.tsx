"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createContent } from "@/app/content/actions/create-content";
import { createScheduledPost } from "@/app/calendar/actions/create-scheduled-post";
import MediaPickerModal from "./media-picker-modal";
import AIAssistantPanel from "./ai-assistant-panel";
import VideoWithFallback from "@/components/video-with-fallback";

interface ConnectedChannel {
  platform: string;
  accountName: string | null;
  externalId: string | null;
}

interface CreatePostModalProps {
  open: boolean;
  onClose: () => void;
  date: string;
  time: string;
  connectedPlatforms: string[];
  connectedChannels: ConnectedChannel[];
  onScheduled?: (message: string) => void;
  initialMedia?: SelectedMedia[];
}

interface SelectedMedia {
  id?: string;
  file?: File;
  preview?: string;
  url: string;
  filename: string;
  mimeType?: string;
  size?: number;
  type?: string;
}

interface MediaItem {
  url: string;
  filename: string;
  mimeType?: string;
  type?: string;
  preview?: string;
}

function toSelectedMedia(item: {
  id?: string;
  url: string;
  filename: string;
  mimeType?: string;
  size?: number;
  type?: string;
  file?: File;
  preview?: string;
}): SelectedMedia {
  return {
    id: item.id,
    file: item.file,
    preview: item.preview ?? item.url,
    url: item.url,
    filename: item.filename,
    mimeType: item.mimeType,
    size: item.size,
    type: item.type,
  };
}

const PLATFORM_ICONS: Record<string, { icon: string; color: string }> = {
  LinkedIn: { icon: "in", color: "#0A66C2" },
  Instagram: { icon: "ig", color: "#E4405F" },
  Facebook: { icon: "fb", color: "#1877F2" },
  TikTok: { icon: "tk", color: "#000000" },
  YouTube: { icon: "yt", color: "#FF0000" },
  X: { icon: "x", color: "#000000" },
};

const ALL_PLATFORMS = ["Instagram", "LinkedIn", "YouTube", "X", "Facebook", "TikTok"];

export default function CreatePostModal({
  open,
  onClose,
  date,
  time,
  connectedPlatforms,
  connectedChannels,
  onScheduled,
  initialMedia,
}: CreatePostModalProps) {
  const router = useRouter();
  
  const [selectedChannels, setSelectedChannels] = useState<string[]>(
    connectedPlatforms.length > 0 ? [connectedPlatforms[0]] : []
  );
  
  const [body, setBody] = useState("");
  const [media, setMedia] = useState<SelectedMedia[]>(initialMedia ?? []);
  const [isSaving, setIsSaving] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [error, setError] = useState("");
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);

  // Time and Date state
  const [scheduleDate, setScheduleDate] = useState(date || "");
  const [scheduleTime, setScheduleTime] = useState(time || "10:00");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialMedia) {
      setMedia(initialMedia);
    }
  }, [initialMedia]);

  useEffect(() => {
    if (date) setScheduleDate(date);
    if (time) setScheduleTime(time);
  }, [date, time]);

  if (!open) return null;

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  function toggleChannel(platform: string) {
    if (selectedChannels.includes(platform)) {
      setSelectedChannels(selectedChannels.filter(c => c !== platform));
    } else {
      setSelectedChannels([...selectedChannels, platform]);
    }
  }

  async function uploadPendingMedia(contentId: string) {
    const newFiles = media.filter((item) => item.file);

    for (const pending of newFiles) {
      const formData = new FormData();
      formData.append("file", pending.file!);
      formData.append("contentId", contentId);

      const response = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Failed to upload ${pending.filename}.`);
      }
    }

    const existingMedia = media.filter((item) => item.id && !item.file);

    for (const item of existingMedia) {
      await fetch("/api/media", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contentId,
          url: item.url,
          filename: item.filename,
          mimeType: item.mimeType || "image/jpeg",
          size: item.size || 0,
          type: item.type || "IMAGE",
        }),
      });
    }
  }

  async function handleSaveDraft() {
    if (!body.trim()) {
      setError("Content is required.");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const content = await createContent({
        title: body.trim().substring(0, 50) + (body.length > 50 ? "..." : ""),
        body: body.trim(),
        platform: selectedChannels[0] || null,
      });

      if (media.length > 0) {
        await uploadPendingMedia(content.id);
      }

      setMedia([]);
      setBody("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save draft.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSchedule() {
    if (!body.trim() || selectedChannels.length === 0) {
      setError("Content and at least one channel are required.");
      return;
    }

    if (!scheduleDate || !scheduleTime) {
      setError("Date and time are required.");
      return;
    }

    setIsScheduling(true);
    setError("");

    try {
      // Build a local-time Date and convert to ISO so the server stores
      // the correct absolute instant regardless of timezone.
      const localDate = new Date(`${scheduleDate}T${scheduleTime}:00`);
      if (Number.isNaN(localDate.getTime())) {
        setError("Invalid date.");
        setIsScheduling(false);
        return;
      }
      if (localDate <= new Date()) {
        setError("Choose a future date and time.");
        setIsScheduling(false);
        return;
      }
      const scheduledAt = localDate.toISOString();

      const content = await createScheduledPost({
        title: body.trim().substring(0, 50) + (body.length > 50 ? "..." : ""),
        body: body.trim(),
        platform: selectedChannels[0],
        channelPlatforms: selectedChannels,
        scheduledAt,
      });

      if (media.length > 0) {
        await uploadPendingMedia(content.id);
      }

      const formattedDate = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(scheduledAt));
      const formattedTime = new Date(scheduledAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
      
      setMedia([]);
      setBody("");
      onScheduled?.(`Post scheduled for ${formattedDate} at ${formattedTime}`);
      onClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to schedule post.");
    } finally {
      setIsScheduling(false);
    }
  }

  function handleUseAiResult(result: string) {
    setBody(result);
    setShowAiPanel(false);
  }

  function handleUseAiMedia(items: MediaItem[]) {
    setMedia((current) => [
      ...current,
      ...items.map((item) =>
        toSelectedMedia({
          id: item.filename,
          url: item.url,
          filename: item.filename,
          mimeType: item.mimeType,
          size: 0,
          type: item.type,
          preview: item.preview,
        }),
      ),
    ]);
    setShowAiPanel(false);
  }

  function handleRemoveMedia(index: number) {
    setMedia((current) => current.filter((_, i) => i !== index));
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          if (showAiPanel) setShowAiPanel(false);
          else if (showMediaPicker) setShowMediaPicker(false);
          else onClose();
        }
      }}
    >
      <div
        className="relative flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl border border-zinc-800 bg-[#0a0a0c] shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
          <h2 className="text-lg font-semibold text-white">Create Post</h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-900/40 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* AI Chat Bubble Area */}
        <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/40 flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#C7E34F] text-zinc-900 flex items-center justify-center font-bold text-sm">AI</div>
            <div className="bg-[#0a0a0c] border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white shadow-sm">
              Tell me what you want to post about.
            </div>
          </div>
          <div className="flex gap-2 ml-11 overflow-x-auto pb-1 no-scrollbar">
            {["Generate", "Regenerate", "Make shorter", "Make longer", "Professional", "Casual", "Engaging"].map(pill => (
              <button key={pill} onClick={() => setShowAiPanel(true)} className="whitespace-nowrap rounded-full border border-zinc-800 bg-[#0a0a0c] px-3 py-1.5 text-xs font-medium text-zinc-400 hover:border-[#C7E34F] hover:text-[#C7E34F] transition-colors">
                {pill}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* Profile Selection */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-zinc-300">Select Profiles</label>
            </div>
            <div className="flex flex-wrap gap-2">
              {ALL_PLATFORMS.map((platform) => {
                const isConnected = connectedPlatforms.includes(platform);
                const isSelected = selectedChannels.includes(platform);
                const icon = PLATFORM_ICONS[platform] || { icon: platform.charAt(0), color: "#666666" };
                const account = connectedChannels.find(ch => ch.platform === platform);

                if (isConnected) {
                  return (
                    <button
                      key={platform}
                      type="button"
                      onClick={() => toggleChannel(platform)}
                      className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                        isSelected
                          ? "border-[#C7E34F] bg-[#C7E34F]/15 text-[#C7E34F]"
                          : "border-zinc-800 bg-[#0a0a0c] text-zinc-400 hover:border-zinc-600"
                      }`}
                    >
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-bold text-white" style={{ backgroundColor: icon.color }}>
                        {icon.icon}
                      </span>
                      {account?.accountName || platform}
                    </button>
                  );
                } else {
                  return (
                    <div
                      key={platform}
                      title="Connect in Publishing"
                      className="inline-flex items-center gap-2 rounded-xl border border-dashed border-zinc-800 bg-zinc-900/40 px-3 py-2 text-sm font-medium text-zinc-400 cursor-not-allowed"
                    >
                      <span className="relative inline-flex h-5 w-5 items-center justify-center rounded-md bg-zinc-300 text-[10px] font-bold text-white">
                        {icon.icon}
                        <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-[#C7E34F] text-[8px] text-zinc-900">
                          +
                        </span>
                      </span>
                      {platform}
                    </div>
                  );
                }
              })}
            </div>
          </div>

          {/* Editor */}
          <div className="mb-5 rounded-xl border border-zinc-800 overflow-hidden focus-within:border-[#C7E34F] focus-within:ring-1 focus-within:ring-[#C7E34F] transition-all">
            <div className="flex items-center gap-1 border-b border-zinc-800 bg-zinc-900/40 px-3 py-2">
              {['B', 'I', 'U'].map(btn => (
                <button key={btn} type="button" className="w-7 h-7 rounded hover:bg-zinc-700 flex items-center justify-center text-sm font-bold text-zinc-300">{btn}</button>
              ))}
              <div className="w-px h-4 bg-zinc-300 mx-1"></div>
              <button type="button" className="w-7 h-7 rounded hover:bg-zinc-700 flex items-center justify-center text-zinc-300" title="Link">🔗</button>
              <button type="button" className="w-7 h-7 rounded hover:bg-zinc-700 flex items-center justify-center text-zinc-300 font-bold" title="Mention">@</button>
              <button type="button" className="w-7 h-7 rounded hover:bg-zinc-700 flex items-center justify-center text-zinc-300 font-bold" title="Hashtag">#</button>
              <button type="button" className="w-7 h-7 rounded hover:bg-zinc-700 flex items-center justify-center text-zinc-300" title="Emoji">😊</button>
            </div>
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              className="min-h-40 w-full resize-y bg-[#0a0a0c] px-4 py-4 text-sm leading-7 text-white outline-none placeholder:text-zinc-400"
              placeholder="Write your post..."
            />
            <div className="flex justify-end px-3 py-2 bg-[#0a0a0c]">
              <span className="text-xs font-medium text-zinc-400">
                {body.length} / 3000
              </span>
            </div>
          </div>

          {/* Toolbar Buttons */}
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setShowMediaPicker(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-[#0a0a0c] px-4 py-2 text-sm font-medium text-zinc-400 transition-all duration-200 hover:border-[#C7E34F] hover:text-[#C7E34F] hover:shadow-[0_0_0_1px_rgba(199,227,79,0.35)] active:scale-95 active:border-[#C7E34F] active:text-[#C7E34F]"
            >
              Insert Media
            </button>
            <button
              type="button"
              onClick={() => setShowMediaPicker(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-[#0a0a0c] px-4 py-2 text-sm font-medium text-zinc-400 transition-all duration-200 hover:border-[#C7E34F] hover:text-[#C7E34F] hover:shadow-[0_0_0_1px_rgba(199,227,79,0.35)] active:scale-95 active:border-[#C7E34F] active:text-[#C7E34F]"
            >
              Design Media
            </button>
            <button
              type="button"
              onClick={() => setShowAiPanel(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-[#C7E34F]/40 bg-[#C7E34F]/10 px-4 py-2 text-sm font-medium text-[#C7E34F] transition-all duration-200 hover:bg-[#C7E34F]/20 hover:shadow-[0_0_14px_rgba(199,227,79,0.35)] active:scale-95 active:bg-[#C7E34F]/25"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
              </svg>
              AI Assistant
            </button>

            {media.length > 0 && (
              <span className="text-xs text-zinc-500 ml-auto">
                {media.length} file{media.length === 1 ? "" : "s"} selected
              </span>
            )}
          </div>

          {/* Selected Media Thumbnails */}
          {media.length > 0 && (
            <div className="mb-5 flex flex-wrap gap-3">
              {media.map((item, index) => (
                <div
                  key={item.id ?? `${item.filename}-${index}`}
                  className="relative h-24 w-32 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40 group"
                >
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
                  <button
                    type="button"
                    onClick={() => handleRemoveMedia(index)}
                    className="absolute right-1.5 top-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Schedule Controls */}
          <div className="mb-2 p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 flex flex-wrap items-center gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-400">Schedule Date</label>
              <input 
                type="date" 
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                className="rounded-lg border border-zinc-800 px-3 py-1.5 text-sm text-white outline-none focus:border-[#C7E34F]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-400">Schedule Time</label>
              <input 
                type="time" 
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="rounded-lg border border-zinc-800 px-3 py-1.5 text-sm text-white outline-none focus:border-[#C7E34F]"
              />
            </div>
            <div className="ml-auto flex flex-col gap-1 text-right">
              <span className="text-xs font-medium text-zinc-500">Timezone</span>
              <span className="text-sm text-white font-medium">{timezone}</span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-zinc-800 px-6 py-4 bg-zinc-900/40/50 rounded-b-2xl">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isSaving || isScheduling}
            className="rounded-xl border border-zinc-300 bg-[#0a0a0c] px-5 py-2 text-sm font-medium text-zinc-300 transition hover:bg-zinc-900/40 disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save Draft"}
          </button>
          
          <button
            type="button"
            onClick={handleSchedule}
            disabled={isSaving || isScheduling}
            className="rounded-xl bg-[#C7E34F] px-5 py-2 text-sm font-medium text-zinc-900 transition hover:bg-[#C7E34F] disabled:opacity-50 shadow-sm"
          >
            {isScheduling ? "Scheduling..." : "Schedule Post"}
          </button>
        </div>

        {/* Overlays */}
        {showMediaPicker && (
          <MediaPickerModal
            onClose={() => setShowMediaPicker(false)}
            onSelect={(items) => {
              setMedia((current) => [
                ...current,
                ...items.map((item) =>
                  toSelectedMedia({
                    id: item.id,
                    url: item.url,
                    filename: item.filename,
                    mimeType: item.mimeType,
                    size: item.size,
                    type: item.type,
                  }),
                ),
              ]);
              setShowMediaPicker(false);
            }}
          />
        )}

        {showAiPanel && (
          <AIAssistantPanel
            onClose={() => setShowAiPanel(false)}
            onUseResult={handleUseAiResult}
            onUseMedia={handleUseAiMedia}
            platform={selectedChannels[0] || ""}
          />
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
          multiple
          className="hidden"
        />
      </div>
    </div>
  );
}
