"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import WorkspaceLayout from "@/components/layout/workspace-layout";
import {
  Clapperboard,
  Download,
  FileText,
  Image as ImageIcon,
  Loader2,
  Mic2,
  Music2,
  Play,
  Plus,
  Sparkles,
  Upload,
  WandSparkles,
  X,
} from "lucide-react";

type MediaItem = {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  type: string;
};

type TimelineClip = {
  id: string;
  media: MediaItem;
  start: number;
  duration: number;
};

type Scene = {
  id: string;
  title: string;
  description: string;
};

export default function CreatorStudioPage() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [clips, setClips] = useState<TimelineClip[]>([]);
  const [scenes, setScenes] = useState<Scene[]>([
    {
      id: "scene-1",
      title: "Scene 01",
      description: "Opening scene",
    },
  ]);

  const [selectedClip, setSelectedClip] = useState<string | null>(null);
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [activeSceneId, setActiveSceneId] = useState("scene-1");
  const [prompt, setPrompt] = useState("");
  const [script, setScript] = useState("");
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [projectName, setProjectName] = useState("Untitled Video");
  const [duration, setDuration] = useState(60);

  const fileInputRef = useRef<HTMLInputElement>(null);

  async function loadMedia() {
    try {
      const response = await fetch("/api/media", { cache: "no-store" });
      const data = await response.json();

      if (response.ok) {
        setMedia(Array.isArray(data.media) ? data.media : []);
      }
    } catch (error) {
      console.error("Failed to load media:", error);
    }
  }

  useEffect(() => {
    loadMedia();
  }, []);

  async function uploadFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed.");
      }

      if (data.media) {
        setMedia((current) => [data.media, ...current]);
        addToTimeline(data.media);
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function addToTimeline(item: MediaItem) {
    const nextStart = clips.reduce(
      (max, clip) => Math.max(max, clip.start + clip.duration),
      0,
    );

    const clip: TimelineClip = {
      id: `${item.id}-${Date.now()}`,
      media: item,
      start: nextStart,
      duration: item.type === "VIDEO" ? 8 : 5,
    };

    setClips((current) => [...current, clip]);
    setSelectedClip(clip.id);
    setSelectedUrl(item.url);
  }

  function removeClip(id: string) {
    setClips((current) => current.filter((clip) => clip.id !== id));

    if (selectedClip === id) {
      setSelectedClip(null);
      setSelectedUrl(null);
    }
  }

  function addScene() {
    const number = scenes.length + 1;

    setScenes((current) => [
      ...current,
      {
        id: `scene-${number}`,
        title: `Scene ${String(number).padStart(2, "0")}`,
        description: "New scene",
      },
    ]);
  }

  function newVideoProject() {
    setProjectName("Untitled Video");
    setScenes([
      {
        id: "scene-1",
        title: "Scene 01",
        description: "Opening scene",
      },
    ]);
    setActiveSceneId("scene-1");
    setClips([]);
    setSelectedClip(null);
    setSelectedUrl(null);
    setPrompt("");
    setScript("");
    setDuration(60);
  }

  async function generateVideo() {
    const value = prompt.trim();

    if (!value || generating) return;

    setGenerating(true);

    const activeScene =
      scenes.find((scene) => scene.id === activeSceneId) ?? scenes[0];

    const scenePrompt = activeScene
      ? `${activeScene.title}. ${activeScene.description}. ${value}`
      : value;

    try {
      const response = await fetch("/api/ai/video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: scenePrompt,
          width: 832,
          height: 480,
          frames: 49,
          fps: 16,
          steps: 20,
          cfg: 6,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success || !data.url) {
        throw new Error(data.error || "Video generation failed.");
      }

      const generated: MediaItem = {
        id: `generated-${Date.now()}`,
        url: data.url,
        filename: data.filename || "octa-generated-video.mp4",
        mimeType: "video/mp4",
        size: 0,
        type: "VIDEO",
      };

      setMedia((current) => [generated, ...current]);
      addToTimeline(generated);
      setPrompt("");
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Video generation failed.",
      );
    } finally {
      setGenerating(false);
    }
  }

  function generateScenesFromScript() {
    const source = script.trim();

    if (!source) {
      generateScript();
      return;
    }

    const blocks = source
      .split(/(?=SCENE\\s+\\d+)/i)
      .map((block) => block.trim())
      .filter((block) => /^SCENE\\s+\\d+/i.test(block));

    if (blocks.length === 0) {
      setScenes([
        {
          id: "scene-1",
          title: "Scene 01",
          description: source.slice(0, 120),
        },
      ]);
      setActiveSceneId("scene-1");
      return;
    }

    const nextScenes = blocks.map((block, index) => {
      const lines = block
        .split("\\n")
        .map((line) => line.trim())
        .filter(Boolean);

      const titleMatch = lines[0]?.match(/^SCENE\\s+(\\d+)/i);
      const number = titleMatch?.[1] ?? String(index + 1).padStart(2, "0");

      const description = lines
        .slice(1)
        .join(" ")
        .replace(/^[-:]+\\s*/, "")
        .trim();

      return {
        id: `scene-${index + 1}`,
        title: `Scene ${String(number).padStart(2, "0")}`,
        description: description || "AI-generated scene",
      };
    });

    setScenes(nextScenes);
    setActiveSceneId(nextScenes[0].id);
  }

  function generateScript() {
    const topic = prompt.trim() || "Create a cinematic YouTube video";

    setScript(
      `HOOK\n${topic}\n\nSCENE 01\nIntroduce the topic with a strong visual opening.\n\nSCENE 02\nExplain the main idea with supporting visuals.\n\nSCENE 03\nBuild the story with examples, B-roll and narration.\n\nSCENE 04\nDeliver the key takeaway.\n\nOUTRO\nEnd with a clear call to action.`,
    );
  }

  const timelineWidth = useMemo(() => {
    const total = clips.reduce(
      (max, clip) => Math.max(max, clip.start + clip.duration),
      0,
    );

    return Math.max(duration, total || 0);
  }, [clips, duration]);

  const visibleMedia = media.slice(0, 12);

  return (
    <WorkspaceLayout activeItem="creator-studio">
      <div className="min-h-full bg-[#09090b] text-white">
        {/* Header */}
        <header className="flex h-14 items-center justify-between border-b border-white/[0.07] px-5">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-white text-black">
              <Clapperboard className="size-4" />
            </div>

            <div>
              <div className="text-sm font-semibold">Creator Studio</div>
              <div className="text-[10px] text-zinc-500">
                Long-form video production
              </div>
            </div>

            <div className="ml-4 h-5 w-px bg-white/10" />

            <input
              value={projectName}
              onChange={(event) => setProjectName(event.target.value)}
              className="w-44 bg-transparent text-xs text-zinc-400 outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-zinc-300 transition hover:bg-white/[0.05]"
            >
              <Upload className="size-3.5" />
              {uploading ? "Uploading..." : "Import"}
            </button>

            <button
              type="button"
              className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-medium text-black transition hover:bg-zinc-200"
            >
              <Download className="size-3.5" />
              Export
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={uploadFile}
            />
          </div>
        </header>

        {/* Workspace */}
        <div className="grid min-h-[calc(100vh-56px)] grid-cols-[230px_minmax(0,1fr)_280px]">
          {/* Left: scenes/media */}
          <aside className="border-r border-white/[0.07] bg-[#0c0c0f]">
            <div className="border-b border-white/[0.07] p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                  Scenes
                </span>

                <button
                  type="button"
                  onClick={addScene}
                  className="rounded-md p-1 text-zinc-500 hover:bg-white/[0.06] hover:text-white"
                >
                  <Plus className="size-4" />
                </button>
              </div>

              <div className="space-y-1.5">
                {scenes.map((scene, index) => (
                  <button
                    key={scene.id}
                    type="button"
                    onClick={() => setActiveSceneId(scene.id)}
                    className={`w-full rounded-lg border p-3 text-left transition ${
                      activeSceneId === scene.id
                        ? "border-violet-400/30 bg-violet-500/[0.08]"
                        : "border-transparent hover:bg-white/[0.035]"
                    }`}
                  >
                    <div className="text-xs font-medium text-zinc-200">
                      {scene.title}
                    </div>
                    <div className="mt-1 text-[10px] text-zinc-600">
                      {scene.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                  Media
                </span>

                <span className="text-[10px] text-zinc-700">
                  {media.length}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {visibleMedia.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => addToTimeline(item)}
                    className="group relative aspect-video overflow-hidden rounded-lg border border-white/[0.07] bg-zinc-900 text-left"
                  >
                    {item.type === "VIDEO" ? (
                      <video
                        src={item.url}
                        muted
                        className="h-full w-full object-cover opacity-80 transition group-hover:opacity-100"
                      />
                    ) : (
                      <img
                        src={item.url}
                        alt={item.filename}
                        className="h-full w-full object-cover opacity-80 transition group-hover:opacity-100"
                      />
                    )}

                    <div className="absolute inset-x-0 bottom-0 truncate bg-black/70 px-1.5 py-1 text-[8px] text-zinc-300">
                      {item.filename}
                    </div>
                  </button>
                ))}

                {media.length === 0 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="col-span-2 flex aspect-video flex-col items-center justify-center rounded-lg border border-dashed border-white/10 text-zinc-600 hover:border-white/20 hover:text-zinc-400"
                  >
                    <Upload className="mb-2 size-5" />
                    <span className="text-[10px]">Upload media</span>
                  </button>
                )}
              </div>
            </div>
          </aside>

          {/* Center */}
          <section className="flex min-w-0 flex-col">
            {/* Preview */}
            <div className="flex min-h-[430px] flex-1 items-center justify-center border-b border-white/[0.07] bg-[#08080a] p-8">
              {selectedUrl ? (
                <div className="relative aspect-video w-full max-w-4xl overflow-hidden rounded-xl border border-white/10 bg-black shadow-2xl">
                  {selectedUrl.match(/\.(mp4|webm|mov)(\?.*)?$/i) ? (
                    <video
                      src={selectedUrl}
                      controls
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <img
                      src={selectedUrl}
                      alt="Selected media"
                      className="h-full w-full object-contain"
                    />
                  )}
                </div>
              ) : (
                <div className="text-center">
                  <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.035]">
                    <Play className="ml-0.5 size-6 text-zinc-400" />
                  </div>

                  <h1 className="text-lg font-semibold">
                    Start your long-form video
                  </h1>

                  <p className="mt-2 text-xs text-zinc-600">
                    Build a complete YouTube video from idea to export.
                  </p>

                  <button
                    type="button"
                    onClick={newVideoProject}
                    className="mt-5 rounded-lg bg-white px-4 py-2.5 text-xs font-semibold text-black"
                  >
                    + New Video Project
                  </button>
                </div>
              )}
            </div>

            {/* Timeline */}
            <div className="h-[330px] bg-[#0b0b0d]">
              <div className="flex h-10 items-center justify-between border-b border-white/[0.07] px-4">
                <span className="flex items-center gap-2 text-xs font-medium text-zinc-300">
                  <Clapperboard className="size-3.5" />
                  Timeline
                </span>

                <span className="text-[9px] text-zinc-600">
                  00:00:00 · 24 FPS · 16:9
                </span>
              </div>

              <div className="relative h-[290px] overflow-x-auto">
                <div
                  className="min-w-[900px]"
                  style={{
                    width: `${Math.max(900, timelineWidth * 45)}px`,
                  }}
                >
                  <div className="grid h-8 grid-cols-[80px_1fr] border-b border-white/[0.05]">
                    <div className="border-r border-white/[0.05] px-3 py-2 text-[9px] text-zinc-600">
                      Time
                    </div>

                    <div className="flex">
                      {Array.from({
                        length: Math.ceil(timelineWidth / 5),
                      }).map((_, index) => (
                        <div
                          key={index}
                          className="w-[225px] border-r border-white/[0.04] px-2 py-2 text-[8px] text-zinc-700"
                        >
                          {String(index * 5).padStart(2, "0")}s
                        </div>
                      ))}
                    </div>
                  </div>

                  {[
                    ["Video", "VIDEO"],
                    ["B-roll", "IMAGE"],
                    ["Voice", "VOICE"],
                    ["Music", "MUSIC"],
                    ["Captions", "CAPTIONS"],
                  ].map(([label, type]) => (
                    <div
                      key={label}
                      className="grid h-48px grid-cols-[80px_1fr] border-b border-white/[0.05]"
                    >
                      <div className="border-r border-white/[0.05] px-3 py-4 text-[9px] text-zinc-600">
                        {label}
                      </div>

                      <div className="relative h-12">
                        {type !== "VOICE" &&
                          type !== "MUSIC" &&
                          type !== "CAPTIONS" &&
                          clips
                            .filter((clip) =>
                              type === "VIDEO"
                                ? clip.media.type === "VIDEO"
                                : clip.media.type !== "VIDEO",
                            )
                            .map((clip) => (
                              <button
                                key={`${type}-${clip.id}`}
                                type="button"
                                onClick={() => {
                                  setSelectedClip(clip.id);
                                  setSelectedUrl(clip.media.url);
                                }}
                                className={`absolute top-1.5 h-9 overflow-hidden rounded-md border px-2 text-left text-[9px] ${
                                  selectedClip === clip.id
                                    ? "border-violet-400/60 bg-violet-500/20"
                                    : "border-white/10 bg-white/[0.06]"
                                }`}
                                style={{
                                  left: `${clip.start * 45}px`,
                                  width: `${Math.max(90, clip.duration * 45)}px`,
                                }}
                              >
                                <span className="truncate text-zinc-300">
                                  {clip.media.filename}
                                </span>

                                <span
                                  role="button"
                                  tabIndex={0}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    removeClip(clip.id);
                                  }}
                                  className="absolute right-1 top-1 text-zinc-600 hover:text-white"
                                >
                                  <X className="size-3" />
                                </span>
                              </button>
                            ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Right: OCTA AI */}
          <aside className="border-l border-white/[0.07] bg-[#0c0c0f]">
            <div className="border-b border-white/[0.07] p-4">
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-lg bg-white text-black">
                  <Sparkles className="size-3.5" />
                </div>

                <div>
                  <div className="text-xs font-semibold">OCTA AI</div>
                  <div className="text-[9px] text-zinc-600">
                    Creator engine
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2 p-3">
              {[
                [FileText, "Script", "Build the long-form script"],
                [WandSparkles, "AI Scenes", "Turn script into scenes"],
                [ImageIcon, "B-roll", "Generate supporting visuals"],
                [Mic2, "Voiceover", "Create narration"],
                [Music2, "Music", "Add background music"],
              ].map(([Icon, title, description]) => (
                <button
                  key={String(title)}
                  type="button"
                  onClick={() => {
                    if (String(title) === "AI Scenes") {
                      generateScenesFromScript();
                    } else if (String(title) === "Script") {
                      generateScript();
                    }
                  }}
                  className="flex w-full items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-left transition hover:border-white/15 hover:bg-white/[0.045]"
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/10">
                    <Icon className="size-3.5 text-zinc-400" />
                  </div>

                  <div className="min-w-0">
                    <div className="text-[11px] font-medium text-zinc-200">
                      {String(title)}
                    </div>
                    <div className="mt-0.5 text-[9px] text-zinc-600">
                      {String(description)}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="border-t border-white/[0.07] p-3">
              {(() => {
                const activeScene =
                  scenes.find((scene) => scene.id === activeSceneId) ?? scenes[0];

                return (
                  <div className="mb-3 rounded-lg border border-violet-400/15 bg-violet-500/[0.05] px-3 py-2">
                    <div className="text-[8px] font-semibold uppercase tracking-[0.14em] text-violet-400">
                      Active Scene
                    </div>
                    <div className="mt-1 text-[10px] font-medium text-zinc-200">
                      {activeScene?.title ?? "Scene 01"}
                    </div>
                    <div className="mt-0.5 line-clamp-2 text-[9px] text-zinc-600">
                      {activeScene?.description ?? "Opening scene"}
                    </div>
                  </div>
                );
              })()}

              <label className="mb-2 block text-[9px] font-semibold uppercase tracking-[0.15em] text-zinc-600">
                Describe your video
              </label>

              <textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="Create a cinematic 10 minute YouTube video about..."
                rows={5}
                className="w-full resize-none rounded-xl border border-white/10 bg-black/30 p-3 text-xs text-white outline-none placeholder:text-zinc-700 focus:border-white/20"
              />

              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={generateScript}
                  className="rounded-lg border border-white/10 py-2 text-[10px] text-zinc-300 hover:bg-white/[0.05]"
                >
                  Generate Script
                </button>

                <button
                  type="button"
                  onClick={generateVideo}
                  disabled={!prompt.trim() || generating}
                  className="flex items-center justify-center gap-1.5 rounded-lg bg-white py-2 text-[10px] font-semibold text-black disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {generating ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <Sparkles className="size-3" />
                  )}
                  Generate Video
                </button>
              </div>
            </div>

            {script && (
              <div className="border-t border-white/[0.07] p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-zinc-600">
                    Generated Script
                  </span>

                  <button
                    type="button"
                    onClick={() => setScript("")}
                    className="text-zinc-600 hover:text-white"
                  >
                    <X className="size-3" />
                  </button>
                </div>

                <pre className="max-h-52 overflow-auto whitespace-pre-wrap rounded-lg bg-black/30 p-3 text-[9px] leading-5 text-zinc-400">
                  {script}
                </pre>
              </div>
            )}
          </aside>
        </div>
      </div>
    </WorkspaceLayout>
  );
}
