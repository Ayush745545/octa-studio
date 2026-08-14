'use client';

import React, { useCallback, useEffect, useState } from 'react';
import type { MediaItem } from './media-drawer';

interface StockItem {
  id: string;
  title: string;
  thumb: string;
  full?: string;
  assetUrl?: string;
  mimeType: string;
  provider: string;
}

type DesignCategory = 'photos' | 'text' | 'elements' | 'background' | 'ai' | 'videos';

const CATEGORIES: Array<{ id: DesignCategory; label: string }> = [
  { id: 'photos', label: 'Photos' },
  { id: 'text', label: 'Text' },
  { id: 'elements', label: 'Elements' },
  { id: 'background', label: 'Background' },
  { id: 'ai', label: 'AI Image' },
  { id: 'videos', label: 'Videos' },
];

const SEARCHABLE: DesignCategory[] = ['photos', 'elements', 'background', 'videos'];

const TEXT_STYLES = [
  { id: 'bold', label: 'Bold White' },
  { id: 'gradient', label: 'Gradient' },
  { id: 'outline', label: 'Outline' },
  { id: 'neon', label: 'Neon' },
] as const;

type TextStyleId = (typeof TEXT_STYLES)[number]['id'];

interface MediaPanelClosedProps {
  onGetContentIdeas: () => void;
  onUploadMedia: (files: FileList) => void;
  onClearAll: () => void;
  onLibraryChange: () => void;
  onNotify: (message: string, type?: 'success' | 'error' | 'info') => void;
  media: MediaItem[];
}

export function MediaPanelClosed({
  onGetContentIdeas,
  onUploadMedia,
  onClearAll,
  onLibraryChange,
  onNotify,
  media
}: MediaPanelClosedProps) {
  const [dragOver, setDragOver] = useState(false);
  const [tab, setTab] = useState<'uploads' | 'design'>('uploads');
  const [category, setCategory] = useState<DesignCategory>('photos');
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [textValue, setTextValue] = useState('Your headline here');
  const [textStyle, setTextStyle] = useState<TextStyleId>('bold');

  const loadStock = useCallback(async (cat: DesignCategory, q: string, pageNum: number, append = false) => {
    if (!SEARCHABLE.includes(cat)) return;
    setLoading(true);
    if (!append) setLoadError('');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const res = await fetch(
        `/api/stock?category=${cat}&q=${encodeURIComponent(q)}&page=${pageNum}`,
        { signal: controller.signal },
      );
      const data = await res.json();
      setItems((prev) => {
        // stock APIs can repeat items within/across pages — keep keys unique
        const seen = new Set(append ? prev.map((p) => p.id) : []);
        const fresh: StockItem[] = [];
        for (const item of (data.items ?? []) as StockItem[]) {
          if (seen.has(item.id)) continue;
          seen.add(item.id);
          fresh.push(item);
        }
        return append ? [...prev, ...fresh] : fresh;
      });
    } catch {
      if (append) {
        // keep existing items when paging fails
      } else {
        setItems([]);
        setLoadError('Couldn’t load stock media. Check your connection and retry.');
      }
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'design') {
      setPage(1);
      loadStock(category, query, 1);
    }
  }, [tab, category, loadStock]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleLoadMore() {
    const next = page + 1;
    setPage(next);
    loadStock(category, query, next, true);
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onUploadMedia(e.dataTransfer.files);
    }
  };

  async function importItem(item: StockItem) {
    setBusyId(item.id);
    try {
      let url = item.full;

      // NASA videos: resolve the mp4 from the asset manifest
      if (!url && item.assetUrl) {
        const manifest = await fetch(item.assetUrl).then((r) => r.json());
        const files: Array<{ href?: string }> = manifest?.collection ?? [];
        const mp4 =
          files.find((f) => f.href?.includes('~mobile.mp4')) ??
          files.find((f) => f.href?.endsWith('.mp4'));
        url = mp4?.href;
      }

      if (!url) throw new Error('No downloadable file for this item.');

      const ext = item.mimeType.split('/')[1] || 'jpg';
      const res = await fetch('/api/media/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          filename: `${item.title.slice(0, 40)}.${ext}`,
          mimeType: item.mimeType,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed.');

      onNotify('Added to your media library', 'success');
      onLibraryChange();
    } catch (err) {
      onNotify(
        err instanceof Error ? err.message : 'Import failed',
        'error',
      );
    } finally {
      setBusyId(null);
    }
  }

  async function addTextImage() {
    if (!textValue.trim()) {
      onNotify('Type some text first', 'error');
      return;
    }
    setBusyId('text');
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1080;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas not supported.');

      // Transparent background; fit text to width
      let fontSize = 140;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const font = (size: number, weight = 900) =>
        `${weight} ${size}px -apple-system, 'SF Pro Display', Inter, sans-serif`;
      ctx.font = font(fontSize);
      const maxWidth = 920;
      const measured = ctx.measureText(textValue).width;
      if (measured > maxWidth) {
        fontSize = Math.floor((fontSize * maxWidth) / measured);
        ctx.font = font(fontSize);
      }

      if (textStyle === 'gradient') {
        const grad = ctx.createLinearGradient(0, 540 - fontSize, 0, 540 + fontSize);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(1, '#7C3AED');
        ctx.fillStyle = grad;
      } else if (textStyle === 'neon') {
        ctx.shadowColor = '#7C3AED';
        ctx.shadowBlur = 40;
        ctx.fillStyle = '#f5f3ff';
      } else if (textStyle === 'outline') {
        ctx.lineWidth = Math.max(4, fontSize / 24);
        ctx.strokeStyle = '#ffffff';
        ctx.strokeText(textValue, 540, 540);
        ctx.fillStyle = 'rgba(10,10,12,0.9)';
      } else {
        ctx.fillStyle = '#ffffff';
      }
      ctx.fillText(textValue, 540, 540);

      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Render failed.'))), 'image/png'),
      );

      const formData = new FormData();
      formData.append('file', new File([blob], `text-${textStyle}.png`, { type: 'image/png' }));
      const res = await fetch('/api/media/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed.');

      onNotify('Text image added to your library', 'success');
      onLibraryChange();
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Failed to create text image', 'error');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="w-[260px] h-full flex flex-col bg-[#0a0a0c] border-r border-zinc-800 shrink-0">
      <div className="p-4 flex flex-col gap-3 border-b border-zinc-800">
        <div className="flex items-center justify-between">
          <button className="text-zinc-400 hover:text-yellow-500 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </button>

          <button
            onClick={onGetContentIdeas}
            className="border border-zinc-800 rounded-full px-4 py-1.5 text-sm font-medium text-white hover:bg-zinc-900/40 transition-colors flex items-center gap-1.5"
          >
            <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4z" />
            </svg>
            Get Content Ideas
          </button>

          <button className="text-zinc-500 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </button>
        </div>

        {/* Uploads / Design tabs */}
        <div className="flex items-center border border-zinc-800 rounded-lg p-0.5">
          {(['uploads', 'design'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 rounded-md px-2 py-1 text-xs font-medium capitalize transition-colors ${
                tab === t ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-white'
              }`}
            >
              {t === 'uploads' ? `Uploads (${media.length})` : 'Design Media'}
            </button>
          ))}
        </div>

        {tab === 'uploads' && (
          <div className="flex items-center justify-between">
            <div className="border border-zinc-800 rounded-full px-2.5 py-1 text-xs text-zinc-500 flex items-center gap-1">
              unused
              <span className="font-semibold text-zinc-300">{media.length}</span>
              <button className="text-zinc-500 hover:text-white transition-colors" title="Hide unused filter">
                ×
              </button>
            </div>
            <button
              onClick={onClearAll}
              disabled={media.length === 0}
              suppressHydrationWarning
              className="text-xs text-zinc-500 hover:text-white font-medium transition-colors disabled:opacity-40 disabled:hover:text-zinc-500"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {tab === 'uploads' ? (
        <div
          className="flex-1 p-4 flex flex-col min-h-0"
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          {media.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-4 overflow-y-auto no-scrollbar">
              {media.map((item) => (
                <div
                  key={item.id}
                  draggable="true"
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/json', JSON.stringify(item));
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  title={item.filename}
                  className="relative aspect-square cursor-grab overflow-hidden rounded-md border border-zinc-800 transition hover:ring-2 hover:ring-[#7C3AED] active:cursor-grabbing"
                >
                  {item.mimeType?.startsWith('video/') ? (
                    <video src={item.url} className="h-full w-full object-cover" muted />
                  ) : (
                    <img src={item.url} alt={item.filename} className="h-full w-full object-cover" />
                  )}
                </div>
              ))}
            </div>
          )}

          <div className={`flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-6 text-center transition-colors ${dragOver ? 'border-[#7C3AED] bg-[#7C3AED]/10' : 'border-zinc-800 hover:border-zinc-300 hover:bg-zinc-900/40'}`}>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="w-10 h-10 bg-zinc-800 rounded-md"></div>
              <div className="w-10 h-10 bg-zinc-800 rounded-md"></div>
              <div className="w-10 h-10 bg-zinc-800 rounded-md"></div>
              <div className="w-10 h-10 bg-zinc-800 rounded-md"></div>
            </div>
            <h3 className="font-semibold text-sm text-white mb-1">
              Drop Media Here to Upload
            </h3>
            <p className="text-xs text-zinc-500">
              Then drag media to the Calendar to schedule posts.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 p-3 flex flex-col min-h-0 gap-3">
          {/* Category chips */}
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className={`rounded-full px-2.5 py-1 text-[10px] font-semibold transition-colors ${
                  category === c.id
                    ? 'bg-[#7C3AED] text-white'
                    : 'border border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Search (for searchable categories) */}
          {SEARCHABLE.includes(category) && (
            <form
              className="flex gap-1.5"
              onSubmit={(e) => {
                e.preventDefault();
                setPage(1);
                loadStock(category, query, 1);
              }}
            >
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search ${category}…`}
                className="min-w-0 flex-1 rounded-lg border border-zinc-800 bg-[#111113] px-2.5 py-1.5 text-xs text-white placeholder:text-zinc-600 focus:border-[#7C3AED] focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-lg bg-zinc-800 px-2.5 text-xs font-medium text-white hover:bg-zinc-700 transition-colors"
              >
                Go
              </button>
            </form>
          )}

          {/* Text generator */}
          {category === 'text' && (
            <div className="flex flex-col gap-2">
              <input
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
                placeholder="Type your text…"
                className="rounded-lg border border-zinc-800 bg-[#111113] px-2.5 py-1.5 text-xs text-white placeholder:text-zinc-600 focus:border-[#7C3AED] focus:outline-none"
              />
              <div className="flex flex-wrap gap-1.5">
                {TEXT_STYLES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setTextStyle(s.id)}
                    className={`rounded-full px-2.5 py-1 text-[10px] font-semibold transition-colors ${
                      textStyle === s.id
                        ? 'bg-white text-black'
                        : 'border border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <button
                onClick={addTextImage}
                disabled={busyId === 'text'}
                className="rounded-lg bg-[#7C3AED] py-1.5 text-xs font-semibold text-white hover:bg-[#6D28D9] transition-colors disabled:opacity-50"
              >
                {busyId === 'text' ? 'Creating…' : 'Add Text Image to Library'}
              </button>
            </div>
          )}

          {/* AI Image */}
          {category === 'ai' && (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-zinc-800 bg-[#111113] p-4 text-center">
              <p className="text-xs text-zinc-400">
                Generate custom images with your local AI engine, then use them in posts.
              </p>
              <button
                onClick={onGetContentIdeas}
                className="rounded-lg bg-[#7C3AED] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#6D28D9] transition-colors"
              >
                Open AI Studio
              </button>
            </div>
          )}

          {/* Stock results grid */}
          {SEARCHABLE.includes(category) && (
            <div className="flex-1 overflow-y-auto no-scrollbar">
              {loading && items.length === 0 ? (
                <p className="py-8 text-center text-xs text-zinc-500">Loading free stock…</p>
              ) : !loading && items.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-xs text-zinc-500">{loadError || 'No results — try another search.'}</p>
                  {loadError && (
                    <button
                      onClick={() => loadStock(category, query, 1)}
                      className="mt-2 rounded-lg border border-zinc-800 px-3 py-1 text-xs font-medium text-zinc-300 hover:border-zinc-700 hover:text-white transition-colors"
                    >
                      Retry
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-1.5">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      title={item.title}
                      className="group relative aspect-square overflow-hidden rounded-md border border-zinc-800 bg-zinc-900"
                    >
                      {item.thumb ? (
                        <img
                          src={item.thumb}
                          alt={item.title}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-zinc-800 text-xl text-white">▶</div>
                      )}
                      {item.mimeType.startsWith('video/') && (
                        <span className="absolute left-1 top-1 rounded bg-black/70 px-1 text-[8px] font-bold text-white">▶ VIDEO</span>
                      )}
                      <button
                        onClick={() => importItem(item)}
                        disabled={busyId === item.id}
                        className="absolute inset-0 flex items-center justify-center bg-black/50 text-lg font-bold text-white opacity-0 transition-opacity group-hover:opacity-100 disabled:opacity-100"
                        title="Add to library"
                      >
                        {busyId === item.id ? '…' : '+'}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {items.length > 0 && (
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="mt-2 w-full rounded-lg border border-zinc-800 py-1.5 text-xs font-medium text-zinc-400 hover:border-zinc-700 hover:text-white transition-colors disabled:opacity-50"
                >
                  {loading ? 'Loading…' : 'Load More'}
                </button>
              )}
            </div>
          )}

          <p className="text-[9px] leading-relaxed text-zinc-600">
            Free stock via Lorem Picsum, Wikimedia Commons & NASA. + adds items to your Uploads library.
          </p>
        </div>
      )}
    </div>
  );
}
