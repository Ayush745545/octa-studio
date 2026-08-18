"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export interface MediaItem {
  id: string;
  url: string;
  filename: string;
  mimeType?: string;
  type?: string;
  contentId?: string | null;
}

interface MediaDrawerProps {
  open: boolean;
  onClose: () => void;
  onMediaSelect: (media: MediaItem) => void;
  onDragStart: (event: React.DragEvent, media: MediaItem) => void;
  sidebarWidth: number;
}

export default function MediaDrawer({
  open,
  onClose,
  onMediaSelect,
  onDragStart,
  sidebarWidth,
}: MediaDrawerProps) {
  const [media, setMedia] = useState<MediaItem[]>([]);

  useEffect(() => {
    if (open) {
      fetch("/api/media")
        .then((res) => res.json())
        .then((data) => setMedia(data.media ?? []))
        .catch((err) => console.error("Failed to fetch media:", err));
    }
  }, [open]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[35] bg-black/30 fade-in"
        style={{ left: sidebarWidth }}
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed top-0 z-[40] h-[100vh] w-[280px] bg-[#0a0a0c] border-r border-zinc-800 shadow-[4px_0_12px_rgba(0,0,0,0.08)] slide-in-left overflow-y-auto"
        style={{ left: sidebarWidth }}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-zinc-800">
          <h2 className="text-xs font-semibold tracking-wider text-zinc-500 uppercase">
            Media Library
          </h2>
        </div>

        {/* Media Thumbnail Grid */}
        <div className="px-3 py-3">
          {media.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-zinc-500 mb-3">No media yet</p>
              <button className="text-sm font-medium text-[#7FFB50] hover:text-[#7FFB50]">
                Upload Media
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-1.5">
              {media.map((item) => (
                <div
                  key={item.id}
                  draggable="true"
                  onDragStart={(e) => {
                    e.dataTransfer.setData("application/json", JSON.stringify(item));
                    onDragStart(e, item);
                  }}
                  onClick={() => onMediaSelect(item)}
                  className="relative aspect-square rounded-md overflow-hidden border border-zinc-800 cursor-pointer hover:ring-2 hover:ring-[#7FFB50]"
                >
                  <img
                    src={item.url}
                    alt={item.filename}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Manage Your Media Button */}
        <div className="mx-3 my-3">
          <Link
            href="/content"
            className="flex items-center justify-center w-full bg-[#7FFB50] hover:bg-[#7FFB50] text-white rounded-full py-2.5 text-sm font-semibold transition-colors"
          >
            Manage Your Media
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>

        {/* COLLECT UGC section */}
        <div className="px-3 py-3 border-t border-zinc-800">
          <h3 className="text-xs font-semibold tracking-wider text-zinc-500 uppercase mb-2">
            Collect UGC
          </h3>
          <div className="space-y-0.5">
            <button className="flex items-center w-full gap-2.5 px-2 py-2 rounded-lg text-sm text-white hover:bg-zinc-900/40 cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Tags
            </button>
            <button className="flex items-center w-full gap-2.5 px-2 py-2 rounded-lg text-sm text-white hover:bg-zinc-900/40 cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
              </svg>
              Mentions
            </button>
            <button className="flex items-center w-full gap-2.5 px-2 py-2 rounded-lg text-sm text-white hover:bg-zinc-900/40 cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Search by Profile
            </button>
            <button className="flex items-center w-full gap-2.5 px-2 py-2 rounded-lg text-sm text-white hover:bg-zinc-900/40 cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
              </svg>
              Search by Hashtag
            </button>
          </div>
        </div>

        {/* SUBMITTED MEDIA section */}
        <div className="px-3 py-2 border-t border-zinc-800">
          <h3 className="text-xs font-semibold tracking-wider text-zinc-500 uppercase mb-2">
            Submitted Media
          </h3>
          <button className="flex items-center w-full gap-2.5 px-2 py-2 rounded-lg text-sm text-white hover:bg-zinc-900/40 cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Contributors
          </button>
        </div>
      </div>
    </>
  );
}
