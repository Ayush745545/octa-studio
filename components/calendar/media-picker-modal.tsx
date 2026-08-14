"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface MediaItem {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  type: string;
  createdAt: string;
}

interface StockItem {
  id: string;
  title: string;
  thumb: string;
  full?: string;
  mimeType: string;
  provider: string;
  author?: string;
}

interface MediaPickerModalProps {
  onClose: () => void;
  onSelect: (items: MediaItem[]) => void;
}

type Tab = "photos" | "stock" | "elements" | "background" | "ai-image";

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: "photos", label: "Photos", icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" },
  { key: "stock", label: "Stock", icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" },
  { key: "elements", label: "Elements", icon: "M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" },
  { key: "background", label: "Background", icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" },
  { key: "ai-image", label: "AI Image", icon: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" },
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

  // Stock state
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [stockSearch, setStockSearch] = useState("");
  const [stockInput, setStockInput] = useState("");
  const [stockPage, setStockPage] = useState(1);
  const [stockLoading, setStockLoading] = useState(false);
  const [stockSelected, setStockSelected] = useState<StockItem | null>(null);

  // AI Image state
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load uploaded media
  useEffect(() => {
    if (activeTab !== "photos") return;

    let cancelled = false;

    async function loadMedia() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch("/api/media");
        if (!response.ok) throw new Error("Failed to load media.");
        const data = await response.json();
        if (!cancelled) setMedia(data.media ?? []);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load media.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadMedia();
    return () => { cancelled = true; };
  }, [activeTab]);

  // Load stock items
  const loadStock = useCallback(async (query: string, page: number, category: string) => {
    setStockLoading(true);
    setStockItems([]);

    try {
      const params = new URLSearchParams({ category });
      if (query) params.set("q", query);
      params.set("page", String(page));

      const res = await fetch(`/api/stock?${params}`);
      if (!res.ok) throw new Error("Failed to load stock content.");
      const data = await res.json();
      setStockItems(data.items ?? []);
    } catch {
      setStockItems([]);
    } finally {
      setStockLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "stock" || activeTab === "elements" || activeTab === "background") {
      const categoryMap: Record<string, string> = {
        stock: "photos",
        elements: "elements",
        background: "background",
      };
      loadStock(stockSearch, 1, categoryMap[activeTab] ?? "photos");
    }
  }, [activeTab, loadStock, stockSearch]);

  // Keyboard handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function handleSelectExisting(item: MediaItem) {
    setSelected(item);
    setStockSelected(null);
  }

  function handleSelectStock(item: StockItem) {
    setStockSelected(item);
    setSelected(null);
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
      if (!response.ok) throw new Error(data.error || "Upload failed.");

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
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleStockSearch(e: React.FormEvent) {
    e.preventDefault();
    setStockSearch(stockInput);
    setStockPage(1);
  }

  function handleLoadMore() {
    const nextPage = stockPage + 1;
    setStockPage(nextPage);
    const categoryMap: Record<string, string> = {
      stock: "photos",
      elements: "elements",
      background: "background",
    };
    // Append more items
    (async () => {
      setStockLoading(true);
      try {
        const params = new URLSearchParams({ category: categoryMap[activeTab] ?? "photos" });
        if (stockSearch) params.set("q", stockSearch);
        params.set("page", String(nextPage));

        const res = await fetch(`/api/stock?${params}`);
        const data = await res.json();
        setStockItems((prev) => [...prev, ...(data.items ?? [])]);
      } catch {
        // ignore
      } finally {
        setStockLoading(false);
      }
    })();
  }

  function stockToMediaItem(item: StockItem): MediaItem {
    return {
      id: item.id,
      url: item.full ?? item.thumb,
      filename: item.title,
      mimeType: item.mimeType,
      size: 0,
      type: item.mimeType.startsWith("video/") ? "VIDEO" : "IMAGE",
      createdAt: new Date().toISOString(),
    };
  }

  function handleUseMedia() {
    if (selected) {
      onSelect([selected]);
    } else if (stockSelected) {
      onSelect([stockToMediaItem(stockSelected)]);
    }
  }

  async function handleAiGenerate() {
    if (!aiPrompt.trim()) return;
    setAiGenerating(true);
    try {
      const res = await fetch("/api/ai/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt }),
      });
      if (!res.ok) throw new Error("AI generation failed");
      const data = await res.json();
      if (data.url) {
        const aiItem: MediaItem = {
          id: `ai-${Date.now()}`,
          url: data.url,
          filename: `AI: ${aiPrompt.slice(0, 40)}`,
          mimeType: "image/png",
          size: 0,
          type: "IMAGE",
          createdAt: new Date().toISOString(),
        };
        onSelect([aiItem]);
      }
    } catch {
      // AI generation failed silently
    } finally {
      setAiGenerating(false);
    }
  }

  const selectedFilename = selected
    ? selected.filename
    : stockSelected
    ? stockSelected.title
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overlay-enter"
      onClick={onClose}
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
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
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
                onClick={() => { setActiveTab(tab.key); setStockSelected(null); setSelected(null); }}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${
                  activeTab === tab.key
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
                </svg>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Main Area */}
          <div className="flex flex-1 flex-col min-w-0">

            {/* ─── PHOTOS TAB (uploaded media) ─── */}
            {activeTab === "photos" && (
              <>
                <div className="flex-1 overflow-y-auto p-4">
                  {loading && (
                    <div className="py-10 text-center text-sm text-zinc-500">Loading media...</div>
                  )}
                  {!loading && error && (
                    <div className="py-10 text-center text-sm text-red-400">{error}</div>
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
                              <video src={item.url} controls preload="metadata" className="h-full w-full object-cover" />
                            ) : (
                              <img src={item.url} alt={item.filename} className="h-full w-full object-cover" />
                            )}
                          </div>
                          <div className="px-2 py-1.5">
                            <p className="truncate text-xs text-zinc-400">{item.filename}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="border-t border-zinc-800 p-3">
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime" onChange={(e) => handleUploadNew(e.target.files)} className="hidden" />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-700 bg-zinc-800/60 px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-zinc-600 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    {uploading ? "Uploading..." : "Upload Media"}
                  </button>
                </div>
              </>
            )}

            {/* ─── STOCK PHOTOS TAB ─── */}
            {activeTab === "stock" && (
              <>
                {/* Search Bar */}
                <form onSubmit={handleStockSearch} className="border-b border-zinc-800 p-3">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input
                        type="text"
                        value={stockInput}
                        onChange={(e) => setStockInput(e.target.value)}
                        placeholder="Search stock photos..."
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-800/60 py-2 pl-9 pr-3 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-fuchsia-500"
                      />
                    </div>
                    <button type="submit" className="rounded-lg bg-fuchsia-600 px-4 py-2 text-sm font-medium text-white hover:bg-fuchsia-500 transition-colors">
                      Search
                    </button>
                  </div>
                </form>

                <div className="flex-1 overflow-y-auto p-4">
                  {stockLoading && stockItems.length === 0 && (
                    <div className="py-10 text-center text-sm text-zinc-500">Loading stock photos...</div>
                  )}

                  {!stockLoading && stockItems.length === 0 && (
                    <div className="py-10 text-center text-sm text-zinc-500">
                      No stock photos found. Try a different search.
                    </div>
                  )}

                  {stockItems.length > 0 && (
                    <div className="grid grid-cols-3 gap-3">
                      {stockItems.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelectStock(item)}
                          className={`group relative overflow-hidden rounded-xl border text-left transition ${
                            stockSelected?.id === item.id
                              ? "border-fuchsia-500 ring-2 ring-fuchsia-500/40"
                              : "border-zinc-800 hover:border-zinc-700"
                          }`}
                        >
                          <div className="aspect-video bg-zinc-800">
                            <img src={item.thumb} alt={item.title} className="h-full w-full object-cover" loading="lazy" />
                          </div>
                          <div className="px-2 py-1.5">
                            <p className="truncate text-xs text-zinc-400">{item.title}</p>
                            {item.author && (
                              <p className="truncate text-[10px] text-zinc-600">by {item.author}</p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {stockItems.length > 0 && (
                    <div className="mt-4 flex justify-center">
                      <button
                        type="button"
                        onClick={handleLoadMore}
                        disabled={stockLoading}
                        className="rounded-lg border border-zinc-800 px-4 py-2 text-xs font-medium text-zinc-400 hover:border-zinc-700 hover:text-white transition-colors disabled:opacity-50"
                      >
                        {stockLoading ? "Loading..." : "Load More"}
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ─── ELEMENTS TAB ─── */}
            {activeTab === "elements" && (
              <>
                <form onSubmit={handleStockSearch} className="border-b border-zinc-800 p-3">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input
                        type="text"
                        value={stockInput}
                        onChange={(e) => setStockInput(e.target.value)}
                        placeholder="Search elements (icons, graphics)..."
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-800/60 py-2 pl-9 pr-3 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-fuchsia-500"
                      />
                    </div>
                    <button type="submit" className="rounded-lg bg-fuchsia-600 px-4 py-2 text-sm font-medium text-white hover:bg-fuchsia-500 transition-colors">
                      Search
                    </button>
                  </div>
                </form>

                <div className="flex-1 overflow-y-auto p-4">
                  {stockLoading && stockItems.length === 0 && (
                    <div className="py-10 text-center text-sm text-zinc-500">Loading elements...</div>
                  )}

                  {stockItems.length > 0 && (
                    <div className="grid grid-cols-3 gap-3">
                      {stockItems.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelectStock(item)}
                          className={`group relative overflow-hidden rounded-xl border text-left transition ${
                            stockSelected?.id === item.id
                              ? "border-fuchsia-500 ring-2 ring-fuchsia-500/40"
                              : "border-zinc-800 hover:border-zinc-700"
                          }`}
                        >
                          <div className="aspect-square bg-zinc-800">
                            <img src={item.thumb} alt={item.title} className="h-full w-full object-cover" loading="lazy" />
                          </div>
                          <div className="px-2 py-1.5">
                            <p className="truncate text-xs text-zinc-400">{item.title}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {stockItems.length > 0 && (
                    <div className="mt-4 flex justify-center">
                      <button type="button" onClick={handleLoadMore} disabled={stockLoading} className="rounded-lg border border-zinc-800 px-4 py-2 text-xs font-medium text-zinc-400 hover:border-zinc-700 hover:text-white transition-colors disabled:opacity-50">
                        {stockLoading ? "Loading..." : "Load More"}
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ─── BACKGROUND TAB ─── */}
            {activeTab === "background" && (
              <>
                <form onSubmit={handleStockSearch} className="border-b border-zinc-800 p-3">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input
                        type="text"
                        value={stockInput}
                        onChange={(e) => setStockInput(e.target.value)}
                        placeholder="Search backgrounds..."
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-800/60 py-2 pl-9 pr-3 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-fuchsia-500"
                      />
                    </div>
                    <button type="submit" className="rounded-lg bg-fuchsia-600 px-4 py-2 text-sm font-medium text-white hover:bg-fuchsia-500 transition-colors">
                      Search
                    </button>
                  </div>
                </form>

                <div className="flex-1 overflow-y-auto p-4">
                  {stockLoading && stockItems.length === 0 && (
                    <div className="py-10 text-center text-sm text-zinc-500">Loading backgrounds...</div>
                  )}

                  {stockItems.length > 0 && (
                    <div className="grid grid-cols-2 gap-3">
                      {stockItems.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelectStock(item)}
                          className={`group relative overflow-hidden rounded-xl border text-left transition ${
                            stockSelected?.id === item.id
                              ? "border-fuchsia-500 ring-2 ring-fuchsia-500/40"
                              : "border-zinc-800 hover:border-zinc-700"
                          }`}
                        >
                          <div className="aspect-video bg-zinc-800">
                            <img src={item.thumb} alt={item.title} className="h-full w-full object-cover" loading="lazy" />
                          </div>
                          <div className="px-2 py-1.5">
                            <p className="truncate text-xs text-zinc-400">{item.title}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {stockItems.length > 0 && (
                    <div className="mt-4 flex justify-center">
                      <button type="button" onClick={handleLoadMore} disabled={stockLoading} className="rounded-lg border border-zinc-800 px-4 py-2 text-xs font-medium text-zinc-400 hover:border-zinc-700 hover:text-white transition-colors disabled:opacity-50">
                        {stockLoading ? "Loading..." : "Load More"}
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ─── AI IMAGE TAB ─── */}
            {activeTab === "ai-image" && (
              <div className="flex flex-1 flex-col">
                <div className="flex-1 flex flex-col items-center justify-center p-6">
                  <div className="w-full max-w-md space-y-4">
                    <div className="text-center mb-6">
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-fuchsia-600/20">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-fuchsia-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                        </svg>
                      </div>
                      <h4 className="text-sm font-semibold text-white">Generate AI Image</h4>
                      <p className="mt-1 text-xs text-zinc-500">Describe the image you want to create</p>
                    </div>

                    <textarea
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="A serene mountain landscape at sunset with golden light..."
                      className="w-full min-h-24 resize-none rounded-xl border border-zinc-800 bg-zinc-800/60 px-4 py-3 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-fuchsia-500"
                    />

                    <div className="flex flex-wrap gap-2">
                      {["Professional headshot", "Product flat lay", "Abstract gradient", "Nature landscape"].map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => setAiPrompt(suggestion)}
                          className="rounded-full border border-zinc-800 px-3 py-1 text-xs text-zinc-400 hover:border-fuchsia-500 hover:text-fuchsia-400 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={handleAiGenerate}
                      disabled={!aiPrompt.trim() || aiGenerating}
                      className="w-full rounded-xl bg-fuchsia-600 py-2.5 text-sm font-medium text-white transition hover:bg-fuchsia-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {aiGenerating ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Generating...
                        </span>
                      ) : (
                        "Generate Image"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-zinc-800 px-5 py-3">
          <span className="text-xs text-zinc-500">
            {selectedFilename ? `Selected: ${selectedFilename}` : "No media selected"}
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
              disabled={!selected && !stockSelected}
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
