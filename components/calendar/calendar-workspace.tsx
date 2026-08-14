"use client";

import { useState, useCallback, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { WorkspaceSidebar } from "../layout/workspace-sidebar";
import { WorkspaceTopBar } from "../layout/workspace-top-bar";
import { CalendarToolbar } from "./calendar-toolbar";
import CalendarView from "./calendar-view";
import type { ScheduledPost } from "./calendar-view";
import CalendarMonthView from "./calendar-month-view";
import CalendarListView from "./calendar-list-view";
import MediaDrawer from "./media-drawer";
import type { MediaItem } from "./media-drawer";
import CreatePostModal from "./create-post-modal";
import PostDetailPanel from "./post-detail-panel";
import { Toast } from "./toast";
import { MediaPanelClosed } from "./media-panel-closed";
import { reschedulePublication } from "@/app/publishing/actions/reschedule-publication";

interface ConnectedChannel {
  platform: string;
  accountName: string | null;
  externalId: string | null;
}

interface SelectedMedia {
  id?: string;
  url: string;
  filename: string;
  mimeType?: string;
  size?: number;
  type?: string;
  preview?: string;
}

interface DragMedia {
  id: string;
  url: string;
  filename: string;
  mimeType?: string;
  type?: string;
}

interface CalendarWorkspaceProps {
  posts: ScheduledPost[];
  connectedPlatforms: string[];
  connectedChannels: ConnectedChannel[];
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function CalendarWorkspace({
  posts,
  connectedPlatforms,
  connectedChannels,
}: CalendarWorkspaceProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // The real current week is applied after mount; until then both server
  // and client render the same placeholder state (avoids hydration
  // mismatches from Date-based initial state).
  const [weekStart, setWeekStart] = useState<Date | null>(null);
  const [activeView, setActiveView] = useState<"week" | "month" | "list">("week");

  const [mediaDrawerOpen, setMediaDrawerOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<"calendar">("calendar");

  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [createPostDate, setCreatePostDate] = useState("");
  const [createPostTime, setCreatePostTime] = useState("");
  const [pendingMedia, setPendingMedia] = useState<SelectedMedia[] | undefined>(undefined);

  const [selectedPost, setSelectedPost] = useState<ScheduledPost | null>(null);
  const [detailPanelOpen, setDetailPanelOpen] = useState(false);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error" | "info">("success");

  // Media library (uploads not attached to any post yet)
  const [libraryMedia, setLibraryMedia] = useState<MediaItem[]>([]);

  const loadMedia = useCallback(() => {
    fetch("/api/media")
      .then((res) => res.json())
      .then((data) => {
        const all: MediaItem[] = data.media ?? [];
        setLibraryMedia(all.filter((m) => !m.contentId));
      })
      .catch((err) => console.error("Failed to fetch media:", err));
  }, []);

  useEffect(() => {
    loadMedia();
    setWeekStart(getWeekStart(new Date()));
  }, [loadMedia]);

  function previousWeek() {
    if (!weekStart) return;
    setWeekStart((d) => {
      if (!d) return d;
      const next = new Date(d);
      if (activeView === "month") {
        next.setDate(1);
        next.setMonth(next.getMonth() - 1);
      } else {
        next.setDate(d.getDate() - 7);
      }
      return next;
    });
  }

  function nextWeek() {
    if (!weekStart) return;
    setWeekStart((d) => {
      if (!d) return d;
      const next = new Date(d);
      if (activeView === "month") {
        next.setDate(1);
        next.setMonth(next.getMonth() + 1);
      } else {
        next.setDate(d.getDate() + 7);
      }
      return next;
    });
  }

  function goToday() {
    setWeekStart(getWeekStart(new Date()));
  }

  function handleMediaClick() {
    if (mediaDrawerOpen) {
      setMediaDrawerOpen(false);
      setActiveItem("calendar");
    } else {
      setMediaDrawerOpen(true);
    }
  }

  function handleMediaDrawerClose() {
    setMediaDrawerOpen(false);
    setActiveItem("calendar");
  }

  function handleCellClick(date: string, time: string) {
    setCreatePostDate(date);
    setCreatePostTime(time);
    setPendingMedia(undefined);
    setCreatePostOpen(true);
  }

  function handlePostClick(post: ScheduledPost) {
    setSelectedPost(post);
    setDetailPanelOpen(true);
  }

  function handleReschedule(postId: string, newScheduledAt: string) {
    // A post that already passed its scheduled time was published (or is being
    // published) by the cron — it can never be rescheduled.
    const post = posts.find((p) => p.id === postId);
    if (post && new Date(post.scheduledAt) <= new Date()) {
      showToast("This post was already published and can't be rescheduled", "error");
      return;
    }

    startTransition(async () => {
      try {
        await reschedulePublication(postId, newScheduledAt);
        const dt = new Date(newScheduledAt);
        const formatted = new Intl.DateTimeFormat("en-US", {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        }).format(dt);
        showToast(`Post rescheduled to ${formatted}`, "success");
        router.refresh();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to reschedule post";
        showToast(message, "error");
      }
    });
  }

  function handleMediaDrop(date: string, time: string, mediaData: DragMedia) {
    setCreatePostDate(date);
    setCreatePostTime(time);

    const mediaItem: SelectedMedia = {
      id: mediaData.id,
      url: mediaData.url,
      filename: mediaData.filename,
      mimeType: mediaData.mimeType,
      type: mediaData.type,
      preview: mediaData.url,
    };
    setPendingMedia([mediaItem]);
    setCreatePostOpen(true);
  }

  function handleMediaSelect(media: MediaItem) {
    // Selection visual state is handled in the drawer itself
  }

  function handleClearAllMedia() {
    startTransition(async () => {
      try {
        await Promise.all(
          libraryMedia.map((item) => fetch(`/api/media/${item.id}`, { method: "DELETE" })),
        );
        showToast("Unused media cleared", "success");
        loadMedia();
      } catch {
        showToast("Failed to clear media", "error");
      }
    });
  }

  function handleMediaDragStart(event: React.DragEvent, media: MediaItem) {
    event.dataTransfer.setData(
      "application/json",
      JSON.stringify(media)
    );
    event.dataTransfer.effectAllowed = "move";
  }

  function handleUploadMedia() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime";
    input.multiple = true;
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files || files.length === 0) return;

      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);

        try {
          await fetch("/api/media/upload", {
            method: "POST",
            body: formData,
          });
        } catch (err) {
          console.error("Upload failed:", err);
        }
      }
      showToast(`${files.length} file${files.length > 1 ? "s" : ""} uploaded`, "success");
      loadMedia();
      router.refresh();
    };
    input.click();
  }

  function handleMediaPanelUpload(files: FileList) {
    startTransition(async () => {
      try {
        for (const file of Array.from(files)) {
          const formData = new FormData();
          formData.append("file", file);
          await fetch("/api/media/upload", {
            method: "POST",
            body: formData,
          });
        }
        showToast(`${files.length} file${files.length > 1 ? "s" : ""} uploaded`, "success");
        loadMedia();
        router.refresh();
      } catch {
        showToast("Upload failed", "error");
      }
    });
  }

  function showToast(message: string, type: "success" | "error" | "info" = "success") {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  }

  const handleToastDismiss = useCallback(() => {
    setToastVisible(false);
  }, []);

  function handlePostScheduled(message: string) {
    showToast(message, "success");
  }

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
      <div className="flex h-[100dvh] bg-[#0a0a0c] text-white overflow-hidden">
        <WorkspaceSidebar
          activeItem={activeItem}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((prev) => !prev)}
        />

        <div className="flex flex-1 flex-col min-w-0" style={{ marginLeft: sidebarCollapsed ? 88 : 116 }}>
          <WorkspaceTopBar
            connectedChannels={connectedChannels}
            onUploadMedia={handleUploadMedia}
            onToggleSidebar={() => setSidebarCollapsed((prev) => !prev)}
          />

        {/* Calendar Toolbar (deterministic fallback date until mounted) */}
        <CalendarToolbar
          weekStart={weekStart ?? new Date(0)}
          onPreviousWeek={previousWeek}
          onNextWeek={nextWeek}
          onToday={goToday}
          activeView={activeView}
          onViewChange={setActiveView}
        />

        {/* Content Area: Media Panel (closed) + Calendar Grid */}
        <div className="flex flex-1 min-h-0">
          {/* Compact Media Panel (visible when drawer is closed) */}
          {!mediaDrawerOpen && (
            <MediaPanelClosed
              onGetContentIdeas={() => router.push("/ai-studio")}
              onUploadMedia={handleMediaPanelUpload}
              onClearAll={handleClearAllMedia}
              onLibraryChange={loadMedia}
              onNotify={showToast}
              media={libraryMedia}
            />
          )}

          {/* Calendar grid renders after mount so Date-based state never
              differs between server HTML and client hydration. */}
          {!weekStart ? (
            <div className="flex flex-1 items-center justify-center text-sm text-zinc-500">
              Loading calendar…
            </div>
          ) : (
            <>
              {activeView === "week" && (
                <CalendarView
                  posts={posts}
                  weekStart={weekStart}
                  onCellClick={handleCellClick}
                  onPostClick={handlePostClick}
                  onReschedule={handleReschedule}
                  onMediaDrop={handleMediaDrop}
                />
              )}
              {activeView === "month" && (
                <CalendarMonthView
                  posts={posts}
                  cursor={weekStart}
                  onCellClick={handleCellClick}
                  onPostClick={handlePostClick}
                  onReschedule={handleReschedule}
                  onMediaDrop={handleMediaDrop}
                />
              )}
              {activeView === "list" && (
                <CalendarListView posts={posts} onPostClick={handlePostClick} />
              )}
            </>
          )}
        </div>
      </div>

      <MediaDrawer
        open={mediaDrawerOpen}
        onClose={handleMediaDrawerClose}
        onMediaSelect={handleMediaSelect}
        onDragStart={handleMediaDragStart}
        sidebarWidth={sidebarCollapsed ? 88 : 116}
      />

      <CreatePostModal
        open={createPostOpen}
        onClose={() => {
          setCreatePostOpen(false);
          setPendingMedia(undefined);
        }}
        date={createPostDate}
        time={createPostTime}
        connectedPlatforms={connectedPlatforms}
        connectedChannels={connectedChannels}
        onScheduled={handlePostScheduled}
        initialMedia={pendingMedia}
      />

      {detailPanelOpen && selectedPost && (
        <PostDetailPanel
          post={selectedPost}
          onClose={() => {
            setDetailPanelOpen(false);
            setSelectedPost(null);
          }}
          onNotify={showToast}
        />
      )}

      {/* Toast Notifications */}
      <Toast
        message={toastMessage}
        type={toastType}
        visible={toastVisible}
        onDismiss={handleToastDismiss}
      />
    </div>
  );
}
