"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { publishNow } from "@/app/publishing/actions/publish-now";
import { deleteScheduledPost } from "@/app/calendar/actions/delete-scheduled-post";
import { reschedulePublication } from "@/app/publishing/actions/reschedule-publication";

interface PostDetailPanelProps {
  post: {
    id: string;
    contentId: string;
    title: string;
    body?: string | null;
    platform: string;
    accountName?: string | null;
    scheduledAt: string;
    media?: Array<{ id: string; url: string; filename: string; mimeType: string; type: string }>;
  };
  onClose: () => void;
  onNotify: (message: string, type?: "success" | "error" | "info") => void;
}

export default function PostDetailPanel({ post, onClose, onNotify }: PostDetailPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);

  const scheduled = new Date(post.scheduledAt);
  const dateStr = `${scheduled.getFullYear()}-${String(scheduled.getMonth() + 1).padStart(2, "0")}-${String(scheduled.getDate()).padStart(2, "0")}`;
  const timeStr = `${String(scheduled.getHours()).padStart(2, "0")}:${String(scheduled.getMinutes()).padStart(2, "0")}`;
  const [rescheduleDate, setRescheduleDate] = useState(dateStr);
  const [rescheduleTime, setRescheduleTime] = useState(timeStr);

  const formattedSchedule = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(scheduled);

  function handlePublishNow() {
    startTransition(async () => {
      const result = await publishNow(post.id);
      if (result.success) {
        const time = result.executionTimeMs != null
          ? ` in ${(result.executionTimeMs / 1000).toFixed(1)}s`
          : "";
        onNotify(`Published to ${post.platform}${time}`, "success");
        onClose();
        router.refresh();
      } else {
        onNotify(result.error ?? "Publishing failed.", "error");
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteScheduledPost(post.id);
        onNotify("Post deleted", "success");
        onClose();
        router.refresh();
      } catch (err) {
        onNotify(
          err instanceof Error ? err.message : "Failed to delete post.",
          "error",
        );
      }
    });
  }

  function handleReschedule() {
    const localDate = new Date(`${rescheduleDate}T${rescheduleTime}:00`);
    if (Number.isNaN(localDate.getTime())) {
      onNotify("Invalid date.", "error");
      return;
    }
    if (localDate <= new Date()) {
      onNotify("Choose a future date and time.", "error");
      return;
    }

    startTransition(async () => {
      try {
        await reschedulePublication(post.id, localDate.toISOString());
        const formatted = new Intl.DateTimeFormat("en-US", {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        }).format(localDate);
        onNotify(`Rescheduled to ${formatted}`, "success");
        setShowReschedule(false);
        onClose();
        router.refresh();
      } catch (err) {
        onNotify(
          err instanceof Error ? err.message : "Failed to reschedule.",
          "error",
        );
      }
    });
  }

  const platformColor: Record<string, string> = {
    LinkedIn: "#0A66C2",
    Instagram: "#E4405F",
    YouTube: "#FF0000",
    X: "#000000",
    Facebook: "#1877F2",
    TikTok: "#000000",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl border border-zinc-800 bg-[#0a0a0c] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <h2 className="text-base font-semibold text-white">Post details</h2>
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

        {/* Body */}
        <div className="px-5 py-4 space-y-5">
          {/* Platform badge */}
          <div className="flex items-center gap-3">
            <span
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white"
              style={{ backgroundColor: platformColor[post.platform] ?? "#7C3AED" }}
            >
              {post.platform[0]}
            </span>
            <div>
              <p className="text-sm font-medium text-white">{post.platform}</p>
              <p className="text-xs text-zinc-500">{post.accountName ?? "Connected account"}</p>
            </div>
          </div>

          {/* Schedule info */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Scheduled for</p>
            <p className="mt-1 text-sm font-medium text-white">{formattedSchedule}</p>
          </div>

          {/* Content preview */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-2">Content</p>
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3">
              <p className="text-sm font-medium text-white">{post.title}</p>
              {post.body && (
                <p className="mt-2 text-xs leading-5 text-zinc-400 whitespace-pre-wrap line-clamp-4">
                  {post.body}
                </p>
              )}
            </div>
          </div>

          {/* Media thumbnails */}
          {post.media && post.media.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                Media ({post.media.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {post.media.map((m) => (
                  <div
                    key={m.id}
                    className="h-16 w-24 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950"
                  >
                    {m.type === "VIDEO" ? (
                      <video src={m.url} className="h-full w-full object-cover" />
                    ) : (
                      <img src={m.url} alt={m.filename} className="h-full w-full object-cover" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reschedule inline */}
          {showReschedule && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 space-y-3">
              <p className="text-xs font-semibold text-white">New schedule</p>
              <div className="flex gap-3">
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="rounded-lg border border-zinc-800 bg-[#0a0a0c] px-3 py-1.5 text-sm text-white outline-none focus:border-[#7C3AED]"
                />
                <input
                  type="time"
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="rounded-lg border border-zinc-800 bg-[#0a0a0c] px-3 py-1.5 text-sm text-white outline-none focus:border-[#7C3AED]"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowReschedule(false)}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-500 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleReschedule}
                  className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
                >
                  {isPending ? "Saving..." : "Confirm"}
                </button>
              </div>
            </div>
          )}

          {/* Confirm delete */}
          {confirmDelete && (
            <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-4">
              <p className="text-sm font-medium text-red-400">Delete this post?</p>
              <p className="mt-1 text-xs text-zinc-500">
                This removes the content, media, and all scheduled publications. This cannot be undone.
              </p>
              <div className="mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-white"
                >
                  Keep it
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleDelete}
                  className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {isPending ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between border-t border-zinc-800 px-5 py-4">
          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              setConfirmDelete(false);
              setShowReschedule(false);
              setConfirmDelete(true);
            }}
            className="rounded-lg border border-zinc-800 px-3 py-2 text-xs font-medium text-red-400 transition hover:border-red-800 hover:bg-red-950/30 disabled:opacity-50"
          >
            Delete
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                setConfirmDelete(false);
                setShowReschedule((v) => !v);
              }}
              className="rounded-lg border border-zinc-800 px-3 py-2 text-xs font-medium text-zinc-300 transition hover:border-zinc-600 hover:text-white disabled:opacity-50"
            >
              Reschedule
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={handlePublishNow}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
            >
              {isPending ? "Publishing..." : "Publish now"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
