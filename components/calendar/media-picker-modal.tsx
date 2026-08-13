"use client";

import { useEffect, useRef, useState } from "react";

interface MediaItem {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  type: string;
  createdAt: string;
}

interface MediaItem {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  type: string;
  createdAt: string;
}

interface MediaPickerModalProps {
  onClose: () => void;
  onSelect: (items: MediaItem[]) => void;
}

type Tab = "photos" | "text" | "elements" | "background" | "ai-image";

const TABS: { key: Tab; label: string }[] = [
  { key: "photos", label: "Photos" },
  { key: "text", label: "Text" },
  { key: "elements", label: "Elements" },
  { key: "background", label: "Background" },
  { key: "ai-image", label: "AI Image" },
];

export default function MediaPickerModal({
  onClose,
  onSelect,
}: MediaPickerModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>("photos");
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [selected, setSelected] = useState<MediaItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeTab !== "photos") return;

    let cancelled = false;

    async function loadMedia() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch("/api/media");

        if (!response.ok) {
          throw new Error("Failed to load media.");
        }

        const data = await response.json();

        if (!cancelled) {
          setMedia(data.media ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load media.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadMedia();

    return () => {
      cancelled = true;
    };
  }, [activeTab]);

  function handleSelectExisting(item: MediaItem) {
    setSelected(item);
  }

  async function handleUploadNew(files: FileList | null) {
    if (!files || files.length === 0) return;

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", files[0]);

      const response = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed.");
      }

      const newItem: MediaItem = {
        id: data.media.id,
        url: data.media.url,
        filename: data.media.filename,
        mimeType: data.media.mimeType,
        size: data.media.size,
        type: data.media.type,
        createdAt: new Date().toISOString(),
      };

      setMedia((current) => [newItem, ...current]);
      setSelected(newItem);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function handleUseMedia() {
    if (!selected) return;
    onSelect([selected]);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overlay-enter"
      onClick={onClose}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.stopPropagation();
          onClose();
        }
      }}
    >
      <div
        className="flex h-[75vh] w-full max-w-4xl flex-col rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl modal-enter"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <h3 className="text-base font-semibold text-white">Design Media</h3>
          <button
            type="button"
            onClick={onClose}
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

        <div className="flex flex-1 min-h-0">
          {/* Left Navigation */}
          <div className="flex w-40 shrink-0 flex-col border-r border-zinc-800 p-2">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-lg px-3 py-2 text-left text-sm transition ${
                  activeTab === tab.key
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Main Area */}
          <div className="flex flex-1 flex-col min-w-0">
            {activeTab === "photos" && (
              <>
                <div className="flex-1 overflow-y-auto p-4">
                  {loading && (
                    <div className="py-10 text-center text-sm text-zinc-500">
                      Loading media...
                    </div>
                  )}

                  {!loading && error && (
                    <div className="py-10 text-center text-sm text-red-400">
                      {error}
                    </div>
                  )}

                  {!loading && !error && media.length === 0 && (
                    <div className="py-10 text-center text-sm text-zinc-500">
                      No media yet. Upload your first file below.
                    </div>
                  )}

                  {!loading && !error && media.length > 0 && (
                    <div className="grid grid-cols-3 gap-3">
                      {media.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelectExisting(item)}
                          className={`relative overflow-hidden rounded-xl border text-left transition ${
                            selected?.id === item.id
                              ? "border-fuchsia-500 ring-2 ring-fuchsia-500/40"
                              : "border-zinc-800 hover:border-zinc-700"
                          }`}
                        >
                          <div className="aspect-video bg-zinc-800">
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
                          </div>
                          <div className="px-2 py-1.5">
                            <p className="truncate text-xs text-zinc-400">
                              {item.filename}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-zinc-800 p-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
                    onChange={(e) => handleUploadNew(e.target.files)}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-700 bg-zinc-800/60 px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-zinc-600 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                    >
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    {uploading ? "Uploading..." : "Upload Media"}
                  </button>
                </div>
              </>
            )}

            {activeTab !== "photos" && (
              <div className="flex flex-1 items-center justify-center">
                <div className="text-center">
                  <p className="text-sm font-medium text-zinc-400">
                    {TABS.find((t) => t.key === activeTab)?.label}
                  </p>
                  <p className="mt-1 text-xs text-zinc-600">
                    Coming soon
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-zinc-800 px-5 py-3">
          <span className="text-xs text-zinc-500">
            {selected ? `Selected: ${selected.filename}` : "No media selected"}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-zinc-700 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUseMedia}
              disabled={!selected}
              className="rounded-lg bg-fuchsia-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-fuchsia-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Use this media
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
