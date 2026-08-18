"use client";

import {
  ChangeEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
  type RefObject,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from "react";
import WorkspaceLayout from "@/components/layout/workspace-layout";
import VideoWithFallback from "@/components/video-with-fallback";
import {
  AlertTriangle,
  Check,
  Clapperboard,
  Clock,
  Eye,
  Film,
  Filter,
  Gauge,
  Lightbulb,
  ListVideo,
  Loader2,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  Upload,
  VideoOff,
  X,
  Zap,
} from "lucide-react";

import type {
  CaptionStyle,
  Clip,
  Job,
  Platform,
  Project,
  ScheduleSlot,
} from "@/lib/creator-studio/types";
import { CAPTION_STYLES, PLATFORMS } from "@/lib/creator-studio/types";

/* ------------------------------------------------------------------ */
/* Utilities                                                          */
/* ------------------------------------------------------------------ */

function formatTimecode(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  if (h > 0) return `${h}:${mm}:${ss}`;
  return `${mm}:${ss}`;
}

function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function isoToLocalInput(iso: string): string {
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function localInputToIso(value: string): string {
  return new Date(value).toISOString();
}

function dayLabel(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

const PLATFORM_COLORS: Record<string, string> = {
  Instagram: "#E1306C",
  YouTube: "#FF0000",
  TikTok: "#25F4EE",
  Facebook: "#1877F2",
};

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

interface Stats {
  videosAnalyzed: number;
  shortsGenerated: number;
  contentReady: number;
  scheduledPosts: number;
  avgScore: number;
}

type View = "dashboard" | "upload" | "analyzing" | "results";

/* ------------------------------------------------------------------ */
/* Page                                                               */
/* ------------------------------------------------------------------ */

export default function CreatorStudioPage() {
  const [view, setView] = useState<View>("dashboard");
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [clips, setClips] = useState<Clip[]>([]);
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshList = useCallback(async () => {
    try {
      const [projRes, statsRes] = await Promise.all([
        fetch("/api/creator-studio/projects", { cache: "no-store" }),
        fetch("/api/creator-studio/stats", { cache: "no-store" }),
      ]);
      const projData = await projRes.json();
      const statsData = await statsRes.json();
      setProjects(Array.isArray(projData.projects) ? projData.projects : []);
      setStats(statsData);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await refreshList();
      setLoading(false);
    })();
  }, [refreshList]);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const loadProject = useCallback(async (id: string) => {
    const res = await fetch(`/api/creator-studio/projects/${id}`, {
      cache: "no-store",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to load project.");
    setActiveProject(data.project);
    setClips(data.clips ?? []);
    setJob(data.job ?? null);
    return data as { project: Project; clips: Clip[]; job: Job | null };
  }, []);

  const startPolling = useCallback(
    (jobId: string) => {
      stopPolling();
      pollRef.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/creator-studio/jobs/${jobId}`, {
            cache: "no-store",
          });
          const data = await res.json();
          if (!res.ok) return;
          setJob(data.job);
          if (data.job.stage === "ready" || data.job.stage === "failed") {
            stopPolling();
            if (data.job.stage === "ready" && activeProject) {
              const loaded = await loadProject(activeProject.id);
              setClips(loaded.clips);
              setView("results");
            }
          }
        } catch {
          /* ignore transient */
        }
      }, 1500);
    },
    [stopPolling, activeProject, loadProject],
  );

  useEffect(() => () => stopPolling(), [stopPolling]);

  async function handleUpload(file: File) {
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const up = await fetch("/api/media/upload", { method: "POST", body: fd });
      const upData = await up.json();
      if (!up.ok || !upData.media) {
        throw new Error(upData.error || "Upload failed.");
      }
      const media = upData.media;
      const res = await fetch("/api/creator-studio/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: media.url,
          filename: media.filename,
          size: media.size,
          mimeType: media.mimeType,
          mediaId: media.id,
        }),
      });
      const resData = await res.json();
      if (!res.ok || !resData.project) {
        throw new Error(resData.error || "Failed to register project.");
      }
      setActiveProject(resData.project);
      setView("upload");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function handleAnalyze() {
    if (!activeProject) return;
    setError(null);
    try {
      const res = await fetch("/api/creator-studio/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: activeProject.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.jobId) {
        throw new Error(data.error || "Failed to start analysis.");
      }
      setView("analyzing");
      startPolling(data.jobId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed.");
    }
  }

  async function handleDeleteProject(project: Project) {
    if (
      !window.confirm(
        `Delete "${project.filename}" and all its files? This cannot be undone.`,
      )
    )
      return;
    setError(null);
    try {
      const res = await fetch(
        `/api/creator-studio/projects/${project.id}`,
        { method: "DELETE" },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete project.");
      await refreshList();
      if (activeProject?.id === project.id) {
        setActiveProject(null);
        setView("dashboard");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete project.");
    }
  }

  async function openProject(project: Project) {
    setError(null);
    try {
      const loaded = await loadProject(project.id);
      if (loaded.project.status === "analyzed") {
        setView("results");
      } else if (loaded.project.status === "analyzing" && loaded.job) {
        setJob(loaded.job);
        setView("analyzing");
        startPolling(loaded.job.id);
      } else {
        setActiveProject(loaded.project);
        setView("upload");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to open.");
    }
  }

  return (
    <WorkspaceLayout activeItem="creator-studio">
      <div className="flex h-full min-h-screen flex-col bg-[#09090b] text-white">
        <Header
          view={view}
          stats={stats}
          onHome={() => {
            stopPolling();
            setView("dashboard");
            setActiveProject(null);
            void refreshList();
          }}
          onUpload={() => {
            setActiveProject(null);
            setView("upload");
          }}
          onCreate={() => {
            setActiveProject(null);
            setView("upload");
          }}
          onDeleteProject={
            activeProject
              ? () => handleDeleteProject(activeProject)
              : () => {}
          }
          activeProject={activeProject}
          readyCount={clips.filter((c) => c.status === "ready").length}
        />

        {error && (
          <div className="mx-6 mt-4 flex items-center justify-between rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs text-red-300">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-white"
            >
              <X className="size-3.5" />
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex flex-1 items-center justify-center text-zinc-600">
            <Loader2 className="size-6 animate-spin" />
          </div>
        ) : uploading ? (
          <div className="flex flex-1 items-center justify-center p-6">
            <div className="flex flex-col items-center gap-4 rounded-3xl border border-white/[0.07] bg-[#0c0c0f] px-10 py-12 text-center">
              <Loader2 className="size-8 animate-spin text-[#7FFB50]" />
              <div>
                <div className="text-sm font-semibold">Uploading your video…</div>
                <div className="mt-1 text-[11px] text-zinc-500">
                  Processing and preparing the file. This can take a moment for
                  larger videos.
                </div>
              </div>
            </div>
          </div>
        ) : view === "dashboard" ? (
          <Dashboard
            projects={projects}
            stats={stats}
            onUpload={() => {
              setActiveProject(null);
              setView("upload");
            }}
            onOpen={openProject}
            onDelete={handleDeleteProject}
          />
        ) : view === "upload" ? (
          <UploadView
            project={activeProject}
            onFile={handleUpload}
            onAnalyze={handleAnalyze}
            fileInputRef={fileInputRef}
            onChooseExisting={() => fileInputRef.current?.click()}
            onDelete={
              activeProject
                ? () => handleDeleteProject(activeProject)
                : () => {}
            }
          />
        ) : view === "analyzing" ? (
          <AnalysisView job={job} project={activeProject} />
        ) : (
          <ResultsView
            project={activeProject}
            clips={clips}
            setClips={setClips}
            onBack={() => {
              setView("dashboard");
              setActiveProject(null);
              void refreshList();
            }}
          />
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/webm"
        className="hidden"
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          const file = e.target.files?.[0];
          if (file) void handleUpload(file);
          e.target.value = "";
        }}
      />
    </WorkspaceLayout>
  );
}

/* ------------------------------------------------------------------ */
/* Header                                                             */
/* ------------------------------------------------------------------ */

function Header({
  view,
  stats,
  onHome,
  onCreate,
  onDeleteProject,
  activeProject,
  readyCount,
}: {
  view: View;
  stats: Stats | null;
  onHome: () => void;
  onUpload: () => void;
  onCreate: () => void;
  onDeleteProject: () => void;
  activeProject: Project | null;
  readyCount: number;
}) {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-white/[0.07] bg-[#09090b]/80 px-5 backdrop-blur">
      <div className="flex items-center gap-3">
        <button
          onClick={onHome}
          className="flex size-8 items-center justify-center rounded-lg bg-[#7FFB50] text-zinc-900"
        >
          <Clapperboard className="size-4" />
        </button>
        <div>
          <div className="text-sm font-semibold">
            {view === "results" && activeProject
              ? "Content Factory"
              : "Creator Studio"}
          </div>
          <div className="text-[10px] text-zinc-500">
            {view === "results" && activeProject
              ? activeProject.filename
              : "Turn one long video into weeks of content."}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {view === "results" && readyCount > 0 && (
          <span className="hidden rounded-full border border-[#7FFB50]/30 bg-[#7FFB50]/10 px-3 py-1.5 text-[11px] font-medium text-[#7FFB50] sm:inline">
            {readyCount} Videos Ready
          </span>
        )}
        {activeProject && (
          <button
            onClick={onDeleteProject}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs text-zinc-300 transition hover:border-red-500/40 hover:text-red-300"
            title="Delete project and all files"
          >
            <Trash2 className="size-3.5" />
            Delete
          </button>
        )}
        <button
          onClick={onCreate}
          className="flex items-center gap-2 rounded-lg bg-[#7FFB50] px-3 py-2 text-xs font-semibold text-zinc-900 transition-all duration-200 hover:bg-[#7FFB50]/90 hover:shadow-[0_0_14px_rgba(127,251,80,0.35)] active:scale-95"
        >
          <Plus className="size-3.5" />
          Create Content
        </button>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Dashboard                                                          */
/* ------------------------------------------------------------------ */

function Dashboard({
  projects,
  stats,
  onUpload,
  onOpen,
  onDelete,
}: {
  projects: Project[];
  stats: Stats | null;
  onUpload: () => void;
  onOpen: (project: Project) => void;
  onDelete: (project: Project) => void;
}) {
  const cards = [
    { label: "Videos Analyzed", value: stats?.videosAnalyzed ?? 0, icon: Film },
    { label: "Shorts Generated", value: stats?.shortsGenerated ?? 0, icon: ListVideo },
    { label: "Content Ready", value: stats?.contentReady ?? 0, icon: Check },
    { label: "Scheduled Posts", value: stats?.scheduledPosts ?? 0, icon: Clock },
    {
      label: "AI Content Score",
      value: stats?.avgScore ? `${stats.avgScore}/100` : "—",
      icon: Gauge,
    },
  ];

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-2xl font-semibold tracking-tight">Creator Studio</h1>
        <p className="mt-1 text-sm text-zinc-500">Turn one long video into weeks of content.</p>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {cards.map((card) => (
            <div
              key={card.label}
              className="rounded-2xl border border-white/[0.07] bg-[#0c0c0f] p-4"
            >
              <card.icon className="size-4 text-[#7FFB50]" />
              <div className="mt-3 text-2xl font-semibold">{card.value}</div>
              <div className="mt-1 text-[11px] text-zinc-500">{card.label}</div>
            </div>
          ))}
        </div>

        {projects.length === 0 ? (
          <EmptyState onUpload={onUpload} />
        ) : (
          <div className="mt-8">
            <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
              Recent Projects
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onOpen(project)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onOpen(project);
                    }
                  }}
                  className="group cursor-pointer overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0c0c0f] text-left transition hover:border-[#7FFB50]/30"
                >
                  <div className="relative aspect-video bg-black">
                    {project.thumbnailUrl ? (
                      <img
                        src={project.thumbnailUrl}
                        alt=""
                        className="h-full w-full object-cover opacity-80 transition group-hover:opacity-100"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-zinc-700">
                        <Film className="size-6" />
                      </div>
                    )}
                    <span
                      className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[9px] font-medium ${
                        project.status === "analyzed"
                          ? "bg-[#7FFB50]/20 text-[#7FFB50]"
                          : project.status === "failed"
                            ? "bg-red-500/20 text-red-400"
                            : "bg-white/10 text-zinc-300"
                      }`}
                    >
                      {project.status}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(project);
                      }}
                      className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-black/60 text-zinc-300 opacity-0 transition hover:bg-red-500/80 hover:text-white group-hover:opacity-100"
                      title="Delete project and files"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                  <div className="p-3">
                    <div className="truncate text-xs font-medium text-zinc-200">
                      {project.filename}
                    </div>
                    <div className="mt-1 text-[10px] text-zinc-600">
                      {formatTimecode(project.durationSec)} · {project.width}×
                      {project.height}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ onUpload }: { onUpload: () => void }) {
  return (
    <div className="mt-10 flex flex-col items-center rounded-3xl border border-dashed border-white/10 bg-[#0c0c0f] px-6 py-16 text-center">
      <div className="mb-5 flex size-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
        <Sparkles className="size-7 text-[#7FFB50]" />
      </div>
      <h2 className="text-lg font-semibold">
        Turn one video into 10+ pieces of content.
      </h2>
      <p className="mt-2 max-w-md text-sm text-zinc-500">
        Upload a long-form video and let Octa AI find the moments worth posting.
      </p>
      <button
        onClick={onUpload}
        className="mt-6 flex items-center gap-2 rounded-xl bg-[#7FFB50] px-5 py-3 text-sm font-semibold text-zinc-900 transition-all duration-200 hover:bg-[#7FFB50]/90 hover:shadow-[0_0_18px_rgba(127,251,80,0.35)] active:scale-95"
      >
        <Upload className="size-4" />
        Upload Video
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Upload                                                             */
/* ------------------------------------------------------------------ */

function UploadView({
  project,
  onFile,
  onAnalyze,
  fileInputRef,
  onChooseExisting,
  onDelete,
}: {
  project: Project | null;
  onFile: (file: File) => void;
  onAnalyze: () => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onChooseExisting: () => void;
  onDelete: () => void;
}) {
  const [drag, setDrag] = useState(false);

  if (!project) {
    return (
      <div className="flex-1 p-6">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            const file = e.dataTransfer.files?.[0];
            if (file) onFile(file);
          }}
          className={`mx-auto flex max-w-3xl flex-col items-center rounded-3xl border-2 border-dashed p-16 text-center transition ${
            drag
              ? "border-[#7FFB50]/60 bg-[#7FFB50]/[0.04]"
              : "border-white/10 bg-[#0c0c0f]"
          }`}
        >
          <div className="mb-5 flex size-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
            <Upload className="size-7 text-[#7FFB50]" />
          </div>
          <h2 className="text-lg font-semibold">Upload a long-form video</h2>
          <p className="mt-2 max-w-md text-sm text-zinc-500">
            MP4, MOV or WEBM · Recommended 10–60 minutes.
          </p>
          <button
            onClick={onChooseExisting}
            className="mt-6 flex items-center gap-2 rounded-xl bg-[#7FFB50] px-5 py-3 text-sm font-semibold text-zinc-900 transition-all duration-200 hover:bg-[#7FFB50]/90 active:scale-95"
          >
            <Upload className="size-4" />
            Choose Video
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-3xl border border-white/[0.07] bg-[#0c0c0f] p-6">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full bg-[#7FFB50]/15 px-3 py-1 text-[11px] font-medium text-[#7FFB50]">
              <Check className="size-3.5" />
              Uploaded successfully
            </span>
          </div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
            Video Information
          </div>
          <div className="mt-4 flex gap-5">
            <div className="relative aspect-video w-48 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black">
              {project.thumbnailUrl ? (
                <img
                  src={project.thumbnailUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-zinc-700">
                  <Film className="size-8" />
                </div>
              )}
            </div>
            <div className="grid flex-1 grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <Info label="Filename" value={project.filename} />
              <Info label="Duration" value={formatTimecode(project.durationSec)} />
              <Info label="Resolution" value={`${project.width}×${project.height}`} />
              <Info label="File size" value={formatBytes(project.sizeBytes)} />
            </div>
          </div>

          <button
            onClick={onAnalyze}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#7FFB50] px-5 py-3.5 text-sm font-semibold text-zinc-900 transition-all duration-200 hover:bg-[#7FFB50]/90 hover:shadow-[0_0_18px_rgba(127,251,80,0.35)] active:scale-[0.99]"
          >
            <Sparkles className="size-4" />
            Analyze with AI
          </button>
          <button
            onClick={onDelete}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 py-2.5 text-[11px] text-zinc-400 transition hover:border-red-500/40 hover:text-red-300"
          >
            <Trash2 className="size-3.5" />
            Delete upload and files
          </button>
          <p className="mt-3 text-center text-[11px] text-zinc-600">
            No generation happens until you start analysis.
          </p>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-zinc-600">
        {label}
      </div>
      <div className="mt-0.5 truncate font-medium text-zinc-200">{value}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Analysis                                                           */
/* ------------------------------------------------------------------ */

function AnalysisView({
  job,
  project,
}: {
  job: Job | null;
  project: Project | null;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const progress = job?.progress ?? 0;
  const current = job?.currentTask ?? "Preparing...";
  const failed = job?.stage === "failed";
  const finished = job?.stage === "ready";

  const startedAt = job?.startedAt ? new Date(job.startedAt).getTime() : null;
  const updatedAt = job?.updatedAt ? new Date(job.updatedAt).getTime() : null;
  const elapsedMs = startedAt ? Math.max(0, now - startedAt) : 0;
  const sinceUpdateMs =
    updatedAt != null && !finished ? Math.max(0, now - updatedAt) : 0;
  // Local AI (Ollama) can take 60–150s per stage; only flag as stuck well
  // beyond a single LLM call timeout so slow-but-working stages don't alarm.
  const stuck = !finished && !failed && sinceUpdateMs > 180000;

  const secondsAgo = Math.round(sinceUpdateMs / 1000);

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-xl rounded-3xl border border-white/[0.07] bg-[#0c0c0f] p-8">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-[#7FFB50] text-zinc-900">
            {failed ? <X className="size-5" /> : <Sparkles className="size-5" />}
          </div>
          <div>
            <div className="text-sm font-semibold">
              {failed ? "Analysis failed" : "Analyzing your video..."}
            </div>
            <div className="text-[11px] text-zinc-500">
              {failed
                ? job?.error ?? "Something went wrong."
                : "Finding the strongest moments."}
            </div>
          </div>
        </div>

        <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              failed ? "bg-red-500" : "bg-[#7FFB50]"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-[11px] text-zinc-500">
          <span>{current}</span>
          <span>
            {progress}% · elapsed {formatTimecode(elapsedMs / 1000)}
            {!finished &&
              !failed &&
              ` · updated ${secondsAgo}s ago`}
          </span>
        </div>

        {stuck && (
          <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
            <div className="flex items-center gap-2 text-xs font-medium text-amber-200">
              <AlertTriangle className="size-4" />
              No progress for {secondsAgo}s — it may be stuck.
            </div>
            <p className="mt-1 text-[11px] text-amber-200/70">
              Check the dev-server terminal for errors, or reload to re-poll the
              job.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 flex items-center justify-center gap-2 rounded-lg border border-amber-400/30 py-2 text-[11px] text-amber-200 hover:bg-amber-500/10"
            >
              <RefreshCw className="size-3.5" />
              Reload
            </button>
          </div>
        )}

        <div className="mt-6 space-y-1.5">
          {job?.steps.map((step) => (
            <div
              key={step.key}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-xs"
            >
              {step.status === "done" ? (
                <Check className="size-4 text-[#7FFB50]" />
              ) : step.status === "running" ? (
                <Loader2 className="size-4 animate-spin text-[#7FFB50]" />
              ) : step.status === "failed" ? (
                <X className="size-4 text-red-400" />
              ) : (
                <span className="size-4 rounded-full border border-white/15" />
              )}
              <span
                className={
                  step.status === "pending" ? "text-zinc-600" : "text-zinc-300"
                }
              >
                {step.label}
              </span>
            </div>
          ))}
        </div>

        {failed && (
          <button
            onClick={() => window.location.reload()}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 py-3 text-sm text-zinc-300 hover:border-[#7FFB50]/40 hover:text-[#7FFB50]"
          >
            <RefreshCw className="size-4" />
            Retry analysis
          </button>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Results                                                            */
/* ------------------------------------------------------------------ */

const TABS = [
  { key: "plan", label: "AI Content Plan", icon: Lightbulb },
  { key: "clips", label: "Content Library", icon: ListVideo },
  { key: "transcript", label: "Transcript", icon: Search },
  { key: "schedule", label: "Schedule", icon: Clock },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function ResultsView({
  project,
  clips,
  setClips,
  onBack,
}: {
  project: Project | null;
  clips: Clip[];
  setClips: Dispatch<SetStateAction<Clip[]>>;
  onBack: () => void;
}) {
  const [tab, setTab] = useState<TabKey>("plan");
  const [editing, setEditing] = useState<Clip | null>(null);
  const [preview, setPreview] = useState<Clip | null>(null);

  const readyClips = useMemo(
    () => clips.filter((c) => c.status === "ready"),
    [clips],
  );

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center gap-1 border-b border-white/[0.07] px-5">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 border-b-2 px-3 py-3 text-xs font-medium transition ${
              tab === t.key
                ? "border-[#7FFB50] text-white"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <t.icon className="size-3.5" />
            {t.label}
            {t.key === "clips" && clips.length > 0 && (
              <span className="rounded-full bg-white/10 px-1.5 text-[10px]">
                {clips.length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto">
        {tab === "plan" && (
          <PlanOverview
            project={project}
            readyClips={readyClips}
            onGoSchedule={() => setTab("schedule")}
          />
        )}
        {tab === "clips" && (
          <ClipLibrary
            clips={clips}
            setClips={setClips}
            onEdit={setEditing}
            onPreview={setPreview}
          />
        )}
        {tab === "transcript" && (
          <TranscriptView clips={clips} onPreview={setPreview} />
        )}
        {tab === "schedule" && (
          <ScheduleView project={project} clips={clips} setClips={setClips} />
        )}
      </div>

      {editing && (
        <ClipEditor
          clip={editing}
          onClose={() => setEditing(null)}
          onSaved={(updated) => {
            setClips((prev) =>
              prev.map((c) => (c.id === updated.id ? updated : c)),
            );
            setEditing(null);
          }}
        />
      )}

      {preview && <PreviewModal clip={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Plan Overview                                                      */
/* ------------------------------------------------------------------ */

function PlanOverview({
  project,
  readyClips,
  onGoSchedule,
}: {
  project: Project | null;
  readyClips: Clip[];
  onGoSchedule: () => void;
}) {
  const plan = project?.schedulePlan;
  const byDay = useMemo(() => {
    const map = new Map<string, ScheduleSlot[]>();
    for (const slot of plan?.slots ?? []) {
      const key = dayLabel(slot.scheduledAt);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(slot);
    }
    return Array.from(map.entries());
  }, [plan]);

  const clipById = useMemo(() => {
    const map = new Map<string, Clip>();
    for (const c of readyClips) map.set(c.id, c);
    return map;
  }, [readyClips]);

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="rounded-3xl border border-[#7FFB50]/20 bg-[#7FFB50]/[0.04] p-6">
        <div className="flex items-center gap-2 text-[#7FFB50]">
          <Sparkles className="size-4" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em]">
            AI Content Plan
          </span>
        </div>
        <h2 className="mt-3 text-xl font-semibold">
          I found {readyClips.length} strong clips in your video.
        </h2>
        <p className="mt-2 text-sm text-zinc-400">
          Recommended strategy: Post 1–2 videos per day for the next{" "}
          {plan?.days ?? "—"} days. Each short is pre-cut, captioned, and ready
          to schedule.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <PlanStat label="Strong clips" value={String(readyClips.length)} />
        <PlanStat label="Schedule window" value={`${plan?.days ?? 0} days`} />
        <PlanStat
          label="Avg AI score"
          value={`${
            readyClips.length
              ? Math.round(
                  readyClips.reduce((s, c) => s + c.scores.overall, 0) /
                    readyClips.length,
                )
              : 0
          }/100`}
        />
      </div>

      <div className="mt-6">
        <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
          Recommended Schedule
        </div>
        <div className="space-y-2">
          {byDay.map(([day, slots]) => (
            <div
              key={day}
              className="rounded-2xl border border-white/[0.07] bg-[#0c0c0f] p-4"
            >
              <div className="mb-2 text-xs font-semibold text-zinc-300">
                {day}
              </div>
              <div className="space-y-1.5">
                {slots.map((slot) => {
                  const clip = clipById.get(slot.clipId);
                  return (
                    <div
                      key={slot.clipId + slot.platform}
                      className="flex items-center gap-3 text-xs"
                    >
                      <Clock className="size-3.5 text-zinc-500" />
                      <span className="w-16 text-zinc-400">
                        {timeLabel(slot.scheduledAt)}
                      </span>
                      <span
                        className="rounded-full px-2 py-0.5 text-[9px] font-medium"
                        style={{
                          backgroundColor: `${
                            PLATFORM_COLORS[slot.platform] ?? "#7FFB50"
                          }22`,
                          color: PLATFORM_COLORS[slot.platform] ?? "#7FFB50",
                        }}
                      >
                        {slot.platform}
                      </span>
                      <span className="truncate text-zinc-300">
                        🎬 {clip?.title ?? "Short"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 flex justify-center">
        <button
          onClick={onGoSchedule}
          className="flex items-center gap-2 rounded-xl bg-[#7FFB50] px-6 py-3.5 text-sm font-semibold text-zinc-900 transition-all duration-200 hover:bg-[#7FFB50]/90 hover:shadow-[0_0_18px_rgba(127,251,80,0.35)] active:scale-95"
        >
          <Zap className="size-4" />
          Review &amp; Schedule {readyClips.length} Posts
        </button>
      </div>
    </div>
  );
}

function PlanStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#0c0c0f] p-4 text-center">
      <div className="text-xl font-semibold">{value}</div>
      <div className="mt-1 text-[10px] text-zinc-500">{label}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Clip Library                                                       */
/* ------------------------------------------------------------------ */

const STATUS_STYLES: Record<string, string> = {
  ready: "bg-[#7FFB50]/20 text-[#7FFB50]",
  scheduled: "bg-blue-500/20 text-blue-300",
  failed: "bg-red-500/20 text-red-300",
  generating: "bg-amber-500/20 text-amber-300",
  draft: "bg-white/10 text-zinc-300",
  rejected: "bg-zinc-700/30 text-zinc-400",
  published: "bg-purple-500/20 text-purple-300",
};

function ClipLibrary({
  clips,
  setClips,
  onEdit,
  onPreview,
}: {
  clips: Clip[];
  setClips: Dispatch<SetStateAction<Clip[]>>;
  onEdit: (clip: Clip) => void;
  onPreview: (clip: Clip) => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<string>("all");

  const visible = clips.filter(
    (c) => filter === "all" || c.status === filter,
  );

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function patchClip(id: string, patch: Partial<Clip>) {
    const res = await fetch(`/api/creator-studio/clips/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = await res.json();
    if (res.ok && data.clip) {
      setClips((prev) => prev.map((c) => (c.id === id ? data.clip : c)));
    }
  }

  async function bulkApprove() {
    for (const id of selected) {
      if (clips.find((c) => c.id === id)?.status === "rejected")
        await patchClip(id, { status: "ready" });
    }
  }

  async function bulkSchedule() {
    const ids = Array.from(selected);
    for (const id of ids) await patchClip(id, { status: "scheduled" });
  }

  async function bulkDelete() {
    for (const id of selected) await deleteClipReal(id);
  }

  async function deleteClipReal(id: string) {
    await fetch(`/api/creator-studio/clips/${id}`, { method: "DELETE" });
    setClips((prev) => prev.filter((c) => c.id !== id));
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Filter className="size-4 text-zinc-500" />
          {["all", "ready", "scheduled", "failed", "rejected"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1 text-[11px] capitalize transition ${
                filter === f
                  ? "bg-[#7FFB50]/15 text-[#7FFB50]"
                  : "bg-white/[0.04] text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {selected.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-zinc-500">
              {selected.size} selected
            </span>
            <button
              onClick={bulkApprove}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-[11px] text-zinc-300 hover:border-[#7FFB50]/40 hover:text-[#7FFB50]"
            >
              Approve
            </button>
            <button
              onClick={bulkSchedule}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-[11px] text-zinc-300 hover:border-[#7FFB50]/40 hover:text-[#7FFB50]"
            >
              Schedule
            </button>
            <button
              onClick={bulkDelete}
              className="rounded-lg border border-red-500/20 px-3 py-1.5 text-[11px] text-red-300 hover:bg-red-500/10"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {visible.map((clip) => (
          <div
            key={clip.id}
            className={`group overflow-hidden rounded-2xl border bg-[#0c0c0f] transition ${
              selected.has(clip.id)
                ? "border-[#7FFB50]/50"
                : "border-white/[0.07]"
            }`}
          >
            <div className="relative aspect-video bg-black">
              {clip.thumbnailUrl ? (
                <img
                  src={clip.thumbnailUrl}
                  alt=""
                  className="h-full w-full object-cover opacity-80"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-zinc-700">
                  <Film className="size-6" />
                </div>
              )}
              <button
                onClick={() => toggle(clip.id)}
                className={`absolute left-2 top-2 size-5 rounded-md border ${
                  selected.has(clip.id)
                    ? "border-[#7FFB50] bg-[#7FFB50] text-zinc-900"
                    : "border-white/30 bg-black/50"
                }`}
              >
                {selected.has(clip.id) && <Check className="size-3.5" />}
              </button>
              <span
                className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-[9px] font-medium ${
                  STATUS_STYLES[clip.status] ?? STATUS_STYLES.draft
                }`}
              >
                {clip.status}
              </span>
              {clip.videoUrl && (
                <button
                  onClick={() => onPreview(clip)}
                  className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100"
                >
                  <Play className="size-8 text-white" />
                  <span className="absolute bottom-2 text-[10px] text-white/80">
                    {formatTimecode(clip.startSec)} → {formatTimecode(clip.endSec)}
                  </span>
                </button>
              )}
            </div>
            <div className="p-3">
              <div className="truncate text-xs font-medium text-zinc-200">
                {clip.title}
              </div>
              <div className="mt-1 flex items-center justify-between text-[10px] text-zinc-600">
                <span>
                  {formatTimecode(clip.durationSec)} · {clip.scores.overall}
                </span>
                <span className="text-[#7FFB50]">{clip.category}</span>
              </div>
              <div className="mt-3 flex gap-1.5">
                <button
                  onClick={() => onPreview(clip)}
                  disabled={!clip.videoUrl}
                  className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-white/10 py-1.5 text-[10px] text-zinc-300 hover:border-[#7FFB50]/40 hover:text-[#7FFB50] disabled:opacity-40"
                >
                  <Eye className="size-3" /> View
                </button>
                <button
                  onClick={() => onEdit(clip)}
                  className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-white/10 py-1.5 text-[10px] text-zinc-300 hover:border-[#7FFB50]/40 hover:text-[#7FFB50]"
                >
                  <Pencil className="size-3" /> Edit
                </button>
                <button
                  onClick={() => patchClip(clip.id, { status: "rejected" })}
                  className="rounded-lg border border-white/10 px-2 py-1.5 text-[10px] text-zinc-400 hover:border-red-500/40 hover:text-red-300"
                  title="Reject"
                >
                  <X className="size-3" />
                </button>
                <button
                  onClick={() => deleteClipReal(clip.id)}
                  className="rounded-lg border border-white/10 px-2 py-1.5 text-[10px] text-zinc-400 hover:border-red-500/40 hover:text-red-300"
                  title="Delete"
                >
                  <Trash2 className="size-3" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Transcript                                                         */
/* ------------------------------------------------------------------ */

function TranscriptView({
  clips,
  onPreview,
}: {
  clips: Clip[];
  onPreview: (clip: Clip) => void;
}) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState(false);

  // Reset the preview error whenever a different clip is selected so a
  // previously failed video doesn't keep showing the "unavailable" state.
  useEffect(() => {
    setPreviewError(false);
  }, [active]);

  const entries = useMemo(() => {
    return clips
      .filter((c) => c.transcript)
      .map((clip) => ({
        clip,
        start: clip.startSec,
        end: clip.endSec,
        text: clip.transcript,
      }));
  }, [clips]);

  const filtered = query
    ? entries.filter(
        (e) =>
          e.text.toLowerCase().includes(query.toLowerCase()) ||
          e.clip.title.toLowerCase().includes(query.toLowerCase()),
      )
    : entries;

  const activeClip = entries.find((e) => e.clip.id === active)?.clip ?? null;

  return (
    <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 p-6 lg:grid-cols-[1fr_360px]">
      <div>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search the transcript..."
            className="w-full rounded-xl border border-white/10 bg-black/30 py-2.5 pl-9 pr-3 text-sm outline-none placeholder:text-zinc-600 focus:border-white/20"
          />
        </div>

        <div className="space-y-2">
          {filtered.map((entry) => (
            <button
              key={entry.clip.id}
              onClick={() => {
                setActive(entry.clip.id);
                onPreview(entry.clip);
              }}
              className={`flex w-full gap-4 rounded-xl border p-3 text-left transition ${
                active === entry.clip.id
                  ? "border-[#7FFB50]/40 bg-[#7FFB50]/[0.05]"
                  : "border-white/[0.07] bg-[#0c0c0f] hover:border-white/15"
              }`}
            >
              <span className="shrink-0 font-mono text-[11px] text-[#7FFB50]">
                {formatTimecode(entry.start)}
              </span>
              <span className="text-xs leading-relaxed text-zinc-300">
                {entry.text || (
                  <span className="text-zinc-600">
                    [AI-generated caption for this segment]
                  </span>
                )}
              </span>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="rounded-xl border border-white/[0.07] bg-[#0c0c0f] p-6 text-center text-xs text-zinc-600">
              No matching transcript segments.
            </div>
          )}
        </div>
      </div>

      <div className="lg:sticky lg:top-0">
        <div className="rounded-2xl border border-white/[0.07] bg-[#0c0c0f] p-3">
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
            Preview
          </div>
          <div className="mt-3 aspect-video overflow-hidden rounded-xl border border-white/10 bg-black">
            {activeClip?.videoUrl && !previewError ? (
              <video
                key={activeClip.id}
                src={activeClip.videoUrl}
                controls
                autoPlay
                onError={() => setPreviewError(true)}
                className="h-full w-full object-contain"
              />
            ) : activeClip?.videoUrl ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-zinc-500">
                <VideoOff className="size-7" />
                <span className="text-xs">Preview unavailable</span>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-zinc-700">
                <Play className="size-8" />
              </div>
            )}
          </div>
          {activeClip && (
            <div className="mt-3">
              <div className="text-xs font-medium text-zinc-200">
                {activeClip.title}
              </div>
              <div className="mt-1 text-[10px] text-zinc-600">
                {formatTimecode(activeClip.startSec)} →{" "}
                {formatTimecode(activeClip.endSec)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Schedule                                                           */
/* ------------------------------------------------------------------ */

function ScheduleView({
  project,
  clips,
  setClips,
}: {
  project: Project | null;
  clips: Clip[];
  setClips: Dispatch<SetStateAction<Clip[]>>;
}) {
  const readyClips = useMemo(
    () => clips.filter((c) => c.status === "ready"),
    [clips],
  );
  const [items, setItems] = useState<
    { clipId: string; title: string; platform: Platform; scheduledAt: string }[]
  >([]);
  const [review, setReview] = useState(false);
  const [done, setDone] = useState<{ count: number; warning?: string } | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [hasChannel, setHasChannel] = useState<boolean | null>(null);

  // Auto-fill the schedule slots from ready clips, but never clobber the
  // user's manual edits (only backfill when nothing is selected yet). The
  // early returns below prevent an infinite render loop: we never call
  // setItems with a fresh empty array, which previously re-triggered this
  // effect every render.
  useEffect(() => {
    if (items.length > 0) return;
    if (readyClips.length === 0) return;
    const plan = project?.schedulePlan;
    setItems(
      readyClips.map((clip, i) => {
        const existing = plan?.slots.find((s) => s.clipId === clip.id);
        let scheduledAt = existing?.scheduledAt;
        if (!scheduledAt) {
          const d = new Date();
          d.setDate(d.getDate() + i);
          d.setHours(19, 30, 0, 0);
          scheduledAt = d.toISOString();
        }
        return {
          clipId: clip.id,
          title: clip.title,
          platform: (existing?.platform ?? clip.platforms[0]) as Platform,
          scheduledAt,
        };
      }),
    );
  }, [items.length, readyClips, project]);

  // Surface whether a social account is connected so the user knows posts
  // won't actually publish until they connect one.
  useEffect(() => {
    let active = true;
    fetch("/api/creator-studio/channels", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (active) setHasChannel(Boolean(d.hasChannel));
      })
      .catch(() => {
        if (active) setHasChannel(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function submit() {
    if (!project) return;
    setSubmitting(true);
    try {
      const slots: ScheduleSlot[] = items.map((it) => ({
        clipId: it.clipId,
        platform: it.platform,
        scheduledAt: it.scheduledAt,
      }));
      const res = await fetch("/api/creator-studio/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id, slots }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Scheduling failed.");
      setDone({ count: data.contentCreated, warning: data.warning });
      const loaded = await fetch(`/api/creator-studio/projects/${project.id}`, {
        cache: "no-store",
      }).then((r) => r.json());
      setClips(loaded.clips ?? clips);
    } catch (err) {
      setDone({
        count: 0,
        warning: err instanceof Error ? err.message : "Scheduling failed.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-xl p-6">
        <div className="rounded-3xl border border-[#7FFB50]/20 bg-[#7FFB50]/[0.04] p-8 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-[#7FFB50] text-zinc-900">
            <Check className="size-7" />
          </div>
          <h2 className="text-xl font-semibold">
            {done.count > 0
              ? `${done.count} posts scheduled`
              : "Scheduling incomplete"}
          </h2>
          {done.warning && (
            <p className="mt-3 text-sm text-zinc-400">{done.warning}</p>
          )}
          <div className="mt-6 flex justify-center">
            <a
              href="/calendar"
              className="flex items-center gap-2 rounded-xl bg-[#7FFB50] px-5 py-3 text-sm font-semibold text-zinc-900 hover:bg-[#7FFB50]/90"
            >
              <Clock className="size-4" /> View in Calendar
            </a>
          </div>
        </div>
      </div>
    );
  }

  const platformCounts = PLATFORMS.reduce(
    (acc, p) => {
      acc[p] = items.filter((it) => it.platform === p).length;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="mx-auto max-w-3xl p-6">
      {hasChannel === false && (
        <div className="mb-6 flex items-start justify-between gap-4 rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-4">
          <div>
            <p className="text-sm font-medium text-amber-200">
              No channel connected
            </p>
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              These posts will be saved as “awaiting channel” and won&apos;t
              actually publish until you connect Instagram, YouTube, TikTok or
              Facebook in the Social Inbox.
            </p>
          </div>
          <a
            href="/publishing"
            className="shrink-0 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs font-medium text-amber-200 transition hover:bg-amber-400/20"
          >
            Connect
          </a>
        </div>
      )}
      <div className="rounded-3xl border border-[#7FFB50]/20 bg-[#7FFB50]/[0.04] p-6">
        <div className="flex items-center gap-2 text-[#7FFB50]">
          <Zap className="size-4" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em]">
            Auto Schedule
          </span>
        </div>
        <p className="mt-3 text-sm text-zinc-300">
          {items.length} videos ready · Recommended: {project?.schedulePlan?.days ?? "—"}{" "}
          days · 1–2 posts/day
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {PLATFORMS.map((p) => {
            const allThis =
              items.length > 0 && items.every((it) => it.platform === p);
            return (
              <button
                key={p}
                type="button"
                onClick={() =>
                  setItems((prev) =>
                    prev.map((x) => ({ ...x, platform: p })),
                  )
                }
                title={`Schedule all posts to ${p}`}
                className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium transition"
                style={{
                  backgroundColor: allThis
                    ? PLATFORM_COLORS[p]
                    : `${PLATFORM_COLORS[p]}22`,
                  color: allThis ? "#0c0c0f" : PLATFORM_COLORS[p],
                }}
              >
                {p} {platformCounts[p] > 0 && `· ${platformCounts[p]}`}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 space-y-2">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-[#0c0c0f] px-5 py-10 text-center">
            <p className="text-sm font-medium text-zinc-200">
              No clips ready to schedule
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              All clips for this video are already scheduled. View them in your{" "}
              <a href="/publishing" className="text-[#7FFB50] underline">
                Social Inbox
              </a>
              .
            </p>
          </div>
        ) : (
          items.map((it) => (
          <div
            key={it.clipId}
            className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-[#0c0c0f] p-3"
          >
            <span className="w-40 truncate text-xs text-zinc-300">
              {it.title}
            </span>
            <select
              value={it.platform}
              onChange={(e) =>
                setItems((prev) =>
                  prev.map((x) =>
                    x.clipId === it.clipId
                      ? { ...x, platform: e.target.value as Platform }
                      : x,
                  ),
                )
              }
              className="rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-zinc-200 outline-none"
            >
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <input
              type="datetime-local"
              value={isoToLocalInput(it.scheduledAt)}
              onChange={(e) =>
                setItems((prev) =>
                  prev.map((x) =>
                    x.clipId === it.clipId
                      ? { ...x, scheduledAt: localInputToIso(e.target.value) }
                      : x,
                  ),
                )
              }
              className="rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-zinc-200 outline-none"
            />
          </div>
        )))}
      </div>

      <div className="mt-8 flex justify-center gap-3">
        {!review ? (
          <button
            onClick={() => setReview(true)}
            className="flex items-center gap-2 rounded-xl bg-[#7FFB50] px-6 py-3.5 text-sm font-semibold text-zinc-900 hover:bg-[#7FFB50]/90"
          >
            <Clock className="size-4" /> Review Schedule
          </button>
        ) : (
          <button
            onClick={submit}
            disabled={submitting}
            className="flex items-center gap-2 rounded-xl bg-[#7FFB50] px-6 py-3.5 text-sm font-semibold text-zinc-900 hover:bg-[#7FFB50]/90 disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Check className="size-4" />
            )}
            Approve &amp; Schedule {items.length} Posts
          </button>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Clip Editor                                                        */
/* ------------------------------------------------------------------ */

function ClipEditor({
  clip,
  onClose,
  onSaved,
}: {
  clip: Clip;
  onClose: () => void;
  onSaved: (clip: Clip) => void;
}) {
  const [draft, setDraft] = useState<Clip>(clip);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof Clip>(key: K, value: Clip[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/creator-studio/clips/${draft.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: draft.title,
          caption: draft.caption,
          hookOriginal: draft.hookOriginal,
          hookAi: draft.hookAi,
          useAiHook: draft.useAiHook,
          hashtags: draft.hashtags,
          platforms: draft.platforms,
          captionStyle: draft.captionStyle,
          category: draft.category,
          recommendedTime: draft.recommendedTime,
        }),
      });
      const data = await res.json();
      if (res.ok && data.clip) onSaved(data.clip);
    } finally {
      setSaving(false);
    }
  }

  async function regenerate() {
    setSaving(true);
    try {
      const res = await fetch(
        `/api/creator-studio/clips/${draft.id}/regenerate`,
        { method: "POST" },
      );
      const data = await res.json();
      if (res.ok && data.clip) {
        setDraft(data.clip);
        onSaved(data.clip);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-[#0c0c0f]">
        <div className="relative hidden w-1/2 bg-black md:block">
          {draft.videoUrl ? (
            <VideoWithFallback
              key={draft.id}
              src={draft.videoUrl}
              className="h-full w-full object-contain"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-zinc-700">
              <Film className="size-10" />
            </div>
          )}
          <div className="absolute left-3 top-3 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-zinc-300">
            {formatTimecode(draft.startSec)} → {formatTimecode(draft.endSec)}
          </div>
        </div>

        <div className="flex w-full flex-col overflow-auto p-5 md:w-1/2">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
              Content Bundle #{String(draft.index).padStart(2, "0")}
            </div>
            <button onClick={onClose} className="text-zinc-500 hover:text-white">
              <X className="size-4" />
            </button>
          </div>

          <Label>AI Score</Label>
          <div className="mb-3 flex gap-2 text-[11px] text-zinc-400">
            <span>Overall {draft.scores.overall}</span>
            <span>· Hook {draft.scores.hook}</span>
            <span>· Engage {draft.scores.engagement}</span>
            <span>· Viral {draft.scores.viral}</span>
          </div>

          <Label>Title</Label>
          <textarea
            value={draft.title}
            onChange={(e) => set("title", e.target.value)}
            rows={2}
            className="mb-3 w-full resize-none rounded-lg border border-white/10 bg-black/30 p-2.5 text-sm outline-none focus:border-white/20"
          />

          <Label>Hook</Label>
          <div className="mb-3 space-y-2">
            <div
              className={`rounded-lg border p-2.5 text-xs ${
                !draft.useAiHook
                  ? "border-[#7FFB50]/40 bg-[#7FFB50]/[0.05]"
                  : "border-white/10"
              }`}
            >
              <div className="mb-1 text-[9px] uppercase tracking-wide text-zinc-600">
                Original
              </div>
              {draft.hookOriginal}
            </div>
            <div
              className={`rounded-lg border p-2.5 text-xs ${
                draft.useAiHook
                  ? "border-[#7FFB50]/40 bg-[#7FFB50]/[0.05]"
                  : "border-white/10"
              }`}
            >
              <div className="mb-1 text-[9px] uppercase tracking-wide text-zinc-600">
                AI Enhanced
              </div>
              {draft.hookAi}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => set("useAiHook", false)}
                className="flex-1 rounded-lg border border-white/10 py-1.5 text-[11px] hover:border-[#7FFB50]/40 hover:text-[#7FFB50]"
              >
                Use Original
              </button>
              <button
                onClick={() => set("useAiHook", true)}
                className="flex-1 rounded-lg border border-white/10 py-1.5 text-[11px] hover:border-[#7FFB50]/40 hover:text-[#7FFB50]"
              >
                Use AI Hook
              </button>
            </div>
          </div>

          <Label>Caption</Label>
          <textarea
            value={draft.caption}
            onChange={(e) => set("caption", e.target.value)}
            rows={3}
            className="mb-3 w-full resize-none rounded-lg border border-white/10 bg-black/30 p-2.5 text-sm outline-none focus:border-white/20"
          />

          <Label>Hashtags (comma separated)</Label>
          <input
            value={draft.hashtags.join(", ")}
            onChange={(e) =>
              set(
                "hashtags",
                e.target.value
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean),
              )
            }
            className="mb-3 w-full rounded-lg border border-white/10 bg-black/30 p-2.5 text-sm outline-none focus:border-white/20"
          />

          <Label>Platforms</Label>
          <div className="mb-3 flex flex-wrap gap-2">
            {PLATFORMS.map((p) => {
              const on = draft.platforms.includes(p);
              return (
                <button
                  key={p}
                  onClick={() =>
                    set(
                      "platforms",
                      on
                        ? draft.platforms.filter((x) => x !== p)
                        : [...draft.platforms, p],
                    )
                  }
                  className={`rounded-full px-3 py-1 text-[11px] font-medium transition ${
                    on ? "text-zinc-900" : "bg-white/[0.04] text-zinc-400 hover:text-zinc-200"
                  }`}
                  style={on ? { backgroundColor: PLATFORM_COLORS[p] } : undefined}
                >
                  {p}
                </button>
              );
            })}
          </div>

          <div className="mb-3 grid grid-cols-2 gap-3">
            <div>
              <Label>Caption Style</Label>
              <select
                value={draft.captionStyle}
                onChange={(e) => set("captionStyle", e.target.value as CaptionStyle)}
                className="w-full rounded-lg border border-white/10 bg-black/30 px-2 py-2 text-sm text-zinc-200 outline-none"
              >
                {CAPTION_STYLES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Recommended Time</Label>
              <input
                value={draft.recommendedTime}
                onChange={(e) => set("recommendedTime", e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-black/30 px-2 py-2 text-sm text-zinc-200 outline-none"
              />
            </div>
          </div>

          <div className="mt-2 flex gap-2">
            <button
              onClick={save}
              disabled={saving}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#7FFB50] py-2.5 text-sm font-semibold text-zinc-900 hover:bg-[#7FFB50]/90 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Check className="size-4" />
              )}
              Save
            </button>
            <button
              onClick={regenerate}
              disabled={saving}
              className="flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-zinc-300 hover:border-[#7FFB50]/40 hover:text-[#7FFB50] disabled:opacity-50"
            >
              <RefreshCw className="size-4" /> Regenerate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Label({ children }: { children: ReactNode }) {
  return (
    <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Preview Modal                                                      */
/* ------------------------------------------------------------------ */

function PreviewModal({ clip, onClose }: { clip: Clip; onClose: () => void }) {
  const [previewError, setPreviewError] = useState(false);
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-[#0c0c0f]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative aspect-[9/16] bg-black">
          {clip.videoUrl && !previewError ? (
            <video
              key={clip.id}
              src={clip.videoUrl}
              controls
              autoPlay
              onError={() => setPreviewError(true)}
              className="h-full w-full object-contain"
            />
          ) : clip.videoUrl ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-zinc-500">
              <VideoOff className="size-10" />
              <span className="text-xs">Preview unavailable</span>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-zinc-700">
              <Film className="size-10" />
            </div>
          )}
        </div>
        <div className="p-4">
          <div className="text-sm font-medium text-zinc-200">{clip.title}</div>
          <div className="mt-1 text-[11px] text-zinc-500">
            {clip.captionStyle} captions · {clip.scores.overall}/100
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {clip.hashtags.map((h) => (
              <span
                key={h}
                className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] text-zinc-400"
              >
                #{h}
              </span>
            ))}
          </div>
          <button
            onClick={onClose}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 py-2.5 text-sm text-zinc-300 hover:border-[#7FFB50]/40 hover:text-[#7FFB50]"
          >
            <X className="size-4" /> Close
          </button>
        </div>
      </div>
    </div>
  );
}
