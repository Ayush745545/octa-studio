"use client";

import { useState, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { WorkspaceSidebar } from "../layout/workspace-sidebar";
import { WorkspaceTopBar } from "../layout/workspace-top-bar";
import { CalendarToolbar } from "./calendar-toolbar";
import CalendarView from "./calendar-view";
import type { ScheduledPost } from "./calendar-view";
import MediaDrawer from "./media-drawer";
import type { MediaItem } from "./media-drawer";
import { MediaPanelClosed } from "./media-panel-closed";
import CreatePostModal from "./create-post-modal";
import { Toast } from "./toast";
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

interface CalendarWorkspaceProps {
  posts: ScheduledPost[];
  connectedPlatforms: string[];
  connectedChannels: ConnectedChannel[];
  mediaCount: number;
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
  mediaCount,
}: CalendarWorkspaceProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Week navigation
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [activeView, setActiveView] = useState<"week" | "month" | "list">("week");

  // Media drawer state
  const [mediaDrawerOpen, setMediaDrawerOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<"calendar" | "media">("calendar");

  // Create post modal state
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [createPostDate, setCreatePostDate] = useState("");
  const [createPostTime, setCreatePostTime] = useState("");
  const [pendingMedia, setPendingMedia] = useState<SelectedMedia[] | undefined>(undefined);

  // Post detail state
  const [selectedPost, setSelectedPost] = useState<ScheduledPost | null>(null);

  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error" | "info">("success");

  // Week navigation handlers
  function previousWeek() {
    setWeekStart((d) => {
      const next = new Date(d);
      next.setDate(d.getDate() - 7);
      return next;
    });
  }

  function nextWeek() {
    setWeekStart((d) => {
      const next = new Date(d);
      next.setDate(d.getDate() + 7);
      return next;
    });
  }

  function goToday() {
    setWeekStart(getWeekStart(new Date()));
  }

  // Media drawer handlers
  function handleMediaClick() {
    if (mediaDrawerOpen) {
      setMediaDrawerOpen(false);
      setActiveItem("calendar");
    } else {
      setMediaDrawerOpen(true);
      setActiveItem("media");
    }
  }

  function handleMediaDrawerClose() {
    setMediaDrawerOpen(false);
    setActiveItem("calendar");
  }

  // Calendar cell click → open create post modal
  function handleCellClick(date: string, time: string) {
    setCreatePostDate(date);
    setCreatePostTime(time);
    setPendingMedia(undefined);
    setCreatePostOpen(true);
  }

  // Post card click → open detail/reschedule
  function handlePostClick(post: ScheduledPost) {
    setSelectedPost(post);
    // Open the post in the create modal for editing/viewing
    const scheduled = new Date(post.scheduledAt);
    const dateStr = `${scheduled.getFullYear()}-${String(scheduled.getMonth() + 1).padStart(2, "0")}-${String(scheduled.getDate()).padStart(2, "0")}`;
    const timeStr = `${String(scheduled.getHours()).padStart(2, "0")}:${String(scheduled.getMinutes()).padStart(2, "0")}`;
    setCreatePostDate(dateStr);
    setCreatePostTime(timeStr);
    setPendingMedia(post.media?.map((m) => ({
      id: m.id,
      url: m.url,
      filename: m.filename,
      mimeType: m.mimeType,
      type: m.type,
    })));
    setCreatePostOpen(true);
  }

  // Drag-and-drop reschedule
  function handleReschedule(postId: string, newScheduledAt: string) {
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
      } catch (error) {
        showToast("Failed to reschedule post", "error");
      }
    });
  }

  // Media drop on calendar cell
  function handleMediaDrop(date: string, time: string, mediaData: any) {
    // Close the media drawer
    setMediaDrawerOpen(false);
    setActiveItem("calendar");

    // Open create post with the dropped media attached
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

  // Media drawer select → can drag later
  function handleMediaSelect(media: MediaItem) {
    // Selection visual state is handled in the drawer itself
  }

  function handleMediaDragStart(event: React.DragEvent, media: MediaItem) {
    event.dataTransfer.setData(
      "application/json",
      JSON.stringify(media)
    );
    event.dataTransfer.effectAllowed = "move";
  }

  // Upload handler
  function handleUploadMedia() {
    // Trigger file input or open media picker
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
      router.refresh();
    };
    input.click();
  }

  // Media panel upload (drag-and-drop files)
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
        router.refresh();
      } catch {
        showToast("Upload failed", "error");
      }
    });
  }

  // Toast helpers
  function showToast(message: string, type: "success" | "error" | "info" = "success") {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  }

  const handleToastDismiss = useCallback(() => {
    setToastVisible(false);
  }, []);

  // Scheduled callback from CreatePostModal
  function handlePostScheduled(message: string) {
    showToast(message, "success");
  }

  return (
    <div className="flex h-[100dvh] bg-[#0a0a0c] text-white overflow-hidden">
      {/* Sidebar */}
      <WorkspaceSidebar
        onMediaClick={handleMediaClick}
        isMediaOpen={mediaDrawerOpen}
        activeItem={activeItem}
      />

      {/* Media Drawer (overlays calendar when open) */}
      <MediaDrawer
        open={mediaDrawerOpen}
        onClose={handleMediaDrawerClose}
        onMediaSelect={handleMediaSelect}
        onDragStart={handleMediaDragStart}
      />

      {/* Main Content Area */}
      <div className="ml-[130px] flex flex-1 flex-col min-w-0">
        {/* Top Bar */}
        <WorkspaceTopBar
          connectedChannels={connectedChannels}
          onUploadMedia={handleUploadMedia}
        />

        {/* Calendar Toolbar */}
        <CalendarToolbar
          weekStart={weekStart}
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
              mediaCount={mediaCount}
            />
          )}

          {/* Calendar Grid */}
          <CalendarView
            posts={posts}
            weekStart={weekStart}
            onCellClick={handleCellClick}
            onPostClick={handlePostClick}
            onReschedule={handleReschedule}
            onMediaDrop={handleMediaDrop}
          />
        </div>
      </div>

      {/* Create Post Modal */}
      <CreatePostModal
        open={createPostOpen}
        onClose={() => {
          setCreatePostOpen(false);
          setPendingMedia(undefined);
          setSelectedPost(null);
        }}
        date={createPostDate}
        time={createPostTime}
        connectedPlatforms={connectedPlatforms}
        connectedChannels={connectedChannels}
        onScheduled={handlePostScheduled}
        initialMedia={pendingMedia}
      />

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
