'use client';

import React, { useEffect, useRef, useState } from 'react';

interface PostPreviewPanelProps {
  content: string;
  platform: string;
  contentType: string;
  isGenerating: boolean;
  prompt: string;
  imageUrl?: string | null;
}

// Keeps device frames scrolled to the top whenever new content arrives.
function useScrollTopOnContentChange(content: string) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = 0;
  }, [content]);
  return ref;
}

type DeviceView = 'phone' | 'tablet' | 'macbook';

export function PostPreviewPanel({
  content,
  platform,
  contentType,
  isGenerating,
  prompt,
  imageUrl = null,
}: PostPreviewPanelProps) {
  const [deviceView, setDeviceView] = useState<DeviceView>('phone');

  const displayContent = content || (isGenerating ? '' : '');
  const hasContent = !!content;

  return (
    <div className="flex flex-col h-full min-h-[520px]">
      {/* Panel Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/60">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-zinc-300 tracking-wide uppercase">
            Live Preview
          </span>
        </div>
        {/* Device Toggle */}
        <div className="flex items-center gap-1 rounded-lg bg-zinc-900/80 p-0.5 border border-zinc-800/50">
          <button
            type="button"
            onClick={() => setDeviceView('phone')}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all ${
              deviceView === 'phone'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Phone
          </button>
          <button
            type="button"
            onClick={() => setDeviceView('tablet')}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all ${
              deviceView === 'tablet'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Tablet
          </button>
          <button
            type="button"
            onClick={() => setDeviceView('macbook')}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all ${
              deviceView === 'macbook'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 5h16a1 1 0 011 1v10H3V6a1 1 0 011-1zM2 18h20l-1-2H3l-1 2z" />
            </svg>
            MacBook
          </button>
        </div>
      </div>

      {/* Device Frame Area */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-auto">
        {deviceView === 'phone' && (
          <PhoneFrame
            content={displayContent}
            platform={platform}
            contentType={contentType}
            isGenerating={isGenerating}
            hasContent={hasContent}
            prompt={prompt}
            imageUrl={imageUrl}
          />
        )}
        {deviceView === 'tablet' && (
          <TabletFrame
            content={displayContent}
            platform={platform}
            contentType={contentType}
            isGenerating={isGenerating}
            hasContent={hasContent}
            prompt={prompt}
            imageUrl={imageUrl}
          />
        )}
        {deviceView === 'macbook' && (
          <MacBookFrame
            content={displayContent}
            platform={platform}
            contentType={contentType}
            isGenerating={isGenerating}
            hasContent={hasContent}
            prompt={prompt}
            imageUrl={imageUrl}
          />
        )}
      </div>

      {/* Panel Footer - Platform info */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-800/60 bg-zinc-950/50">
        <div className="flex items-center gap-2">
          <PlatformIcon platform={platform} />
          <span className="text-xs text-zinc-400 font-medium">{platform}</span>
          <span className="text-zinc-700 text-xs">·</span>
          <span className="text-xs text-zinc-500">{contentType}</span>
        </div>
        {hasContent && (
          <span className="text-[10px] text-emerald-500/80 font-medium">
            ● Content ready
          </span>
        )}
      </div>
    </div>
  );
}

/* ─── Platform Icon ────────────────────────────── */
function PlatformIcon({ platform }: { platform: string }) {
  const iconClass = "w-3.5 h-3.5";

  switch (platform) {
    case 'Instagram':
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="2" y="2" width="20" height="20" rx="5" strokeWidth={1.8} />
          <circle cx="12" cy="12" r="5" strokeWidth={1.8} />
          <circle cx="18" cy="6" r="1" fill="currentColor" />
        </svg>
      );
    case 'LinkedIn':
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      );
    default:
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
      );
  }
}

/* ─── Post Content Renderer (platform-specific) ─ */
function PostContent({
  content,
  platform,
  contentType,
  isGenerating,
  hasContent,
  prompt,
  imageUrl = null,
  compact = false,
}: {
  content: string;
  platform: string;
  contentType: string;
  isGenerating: boolean;
  hasContent: boolean;
  prompt: string;
  imageUrl?: string | null;
  compact?: boolean;
}) {
  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-3">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 rounded-full border-2 border-fuchsia-500/20" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-fuchsia-500 animate-spin" />
        </div>
        <p className="text-[11px] text-zinc-500 font-medium animate-pulse">
          AI is generating...
        </p>
      </div>
    );
  }

  if (!hasContent) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-3 text-center px-4">
        <div className="w-12 h-12 rounded-2xl bg-zinc-900/80 border border-zinc-800/50 flex items-center justify-center">
          <svg className="w-5 h-5 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </div>
        <div>
          <p className="text-[11px] text-zinc-500 font-medium">No content yet</p>
          <p className="text-[10px] text-zinc-600 mt-0.5">Generate content to see a live preview</p>
        </div>
      </div>
    );
  }

  // Platform-specific rendering
  return (
    <div className="flex flex-col h-full">
      {/* Platform Header */}
      <PlatformPostHeader platform={platform} />
      
      {/* Post Media */}
      {imageUrl ? (
        <div
          className={`${
            contentType === 'Reel' || contentType === 'Video'
              ? 'aspect-[9/16] max-h-[220px]'
              : 'aspect-square max-h-[220px]'
          } mx-3 rounded-lg overflow-hidden mb-2 border border-zinc-800/30 bg-zinc-900`}
        >
          <img src={imageUrl} alt="Post media" className="h-full w-full object-cover" />
        </div>
      ) : (contentType === 'Reel' || contentType === 'Video') ? (
        <div className="aspect-[9/16] max-h-[200px] bg-gradient-to-br from-zinc-900 to-zinc-950 flex items-center justify-center mx-3 rounded-lg overflow-hidden mb-2">
          <div className="text-center">
            <svg className="w-8 h-8 text-zinc-700 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-[9px] text-zinc-600">{contentType} Preview</p>
          </div>
        </div>
      ) : (
        <div className="aspect-square max-h-[180px] bg-gradient-to-br from-fuchsia-950/30 via-zinc-900 to-zinc-950 flex items-center justify-center mx-3 rounded-lg overflow-hidden mb-2 border border-zinc-800/30">
          <div className="text-center px-4">
            <p className="text-[10px] text-zinc-500 font-medium leading-relaxed line-clamp-3">
              {prompt || 'Post image'}
            </p>
          </div>
        </div>
      )}

      {/* Post Actions */}
      <PlatformPostActions platform={platform} />

      {/* Post Caption / Content */}
      <div className={`px-3 pb-3 ${compact ? 'max-h-[140px]' : 'max-h-[240px]'} overflow-y-auto`}>
        <p className="text-[10px] text-zinc-400 leading-relaxed whitespace-pre-wrap break-words">
          <span className="font-bold text-zinc-200">octa-studio_ai</span>{' '}
          {content}
        </p>
      </div>
    </div>
  );
}

/* ─── Platform Post Header ─────────────────────── */
function PlatformPostHeader({ platform }: { platform: string }) {
  if (platform === 'Instagram') {
    return (
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-fuchsia-600 to-amber-500 p-[1.5px]">
          <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
            <span className="text-[8px] font-bold text-white">C</span>
          </div>
        </div>
        <div className="flex-1">
          <p className="text-[10px] font-semibold text-zinc-200 leading-tight">octa-studio_ai</p>
          <p className="text-[8px] text-zinc-500 leading-tight">Content Creator</p>
        </div>
        <svg className="w-3.5 h-3.5 text-zinc-500" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
        </svg>
      </div>
    );
  }

  if (platform === 'LinkedIn') {
    return (
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center">
          <span className="text-[9px] font-bold text-white">C</span>
        </div>
        <div className="flex-1">
          <p className="text-[10px] font-semibold text-zinc-200 leading-tight">octa-studio AI</p>
          <p className="text-[8px] text-zinc-500 leading-tight">Just now · 🌐</p>
        </div>
        <svg className="w-3.5 h-3.5 text-zinc-500" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
        </svg>
      </div>
    );
  }

  if (platform === 'X') {
    return (
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center">
          <span className="text-[9px] font-bold text-white">C</span>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-1">
            <p className="text-[10px] font-bold text-zinc-200 leading-tight">octa-studio AI</p>
            <svg className="w-3 h-3 text-blue-400" fill="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <p className="text-[8px] text-zinc-500 leading-tight">@octa-studio_ai · now</p>
        </div>
      </div>
    );
  }

  // Default header (YouTube, Blog)
  return (
    <div className="flex items-center gap-2.5 px-3 py-2.5">
      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-red-600 to-red-500 flex items-center justify-center">
        <span className="text-[9px] font-bold text-white">C</span>
      </div>
      <div className="flex-1">
        <p className="text-[10px] font-semibold text-zinc-200 leading-tight">octa-studio AI</p>
        <p className="text-[8px] text-zinc-500 leading-tight">{platform} · Just now</p>
      </div>
    </div>
  );
}

/* ─── Platform Post Actions ────────────────────── */
function PlatformPostActions({ platform }: { platform: string }) {
  if (platform === 'Instagram') {
    return (
      <div className="flex items-center justify-between px-3 py-1.5">
        <div className="flex items-center gap-3">
          <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
        </div>
        <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
      </div>
    );
  }

  if (platform === 'LinkedIn') {
    return (
      <div className="flex items-center gap-4 px-3 py-1.5 border-t border-zinc-800/50 mt-1">
        <div className="flex items-center gap-1 text-zinc-500">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
          </svg>
          <span className="text-[9px]">Like</span>
        </div>
        <div className="flex items-center gap-1 text-zinc-500">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
          <span className="text-[9px]">Comment</span>
        </div>
        <div className="flex items-center gap-1 text-zinc-500">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          <span className="text-[9px]">Share</span>
        </div>
      </div>
    );
  }

  // X / default
  return (
    <div className="flex items-center gap-4 px-3 py-1.5">
      <div className="flex items-center gap-1 text-zinc-500">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <span className="text-[9px]">12</span>
      </div>
      <div className="flex items-center gap-1 text-zinc-500">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <span className="text-[9px]">5</span>
      </div>
      <div className="flex items-center gap-1 text-zinc-500">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
        <span className="text-[9px]">42</span>
      </div>
    </div>
  );
}


/* ─── Phone Frame ──────────────────────────────── */
function PhoneFrame({
  content,
  platform,
  contentType,
  isGenerating,
  hasContent,
  prompt,
  imageUrl = null,
}: {
  content: string;
  platform: string;
  contentType: string;
  isGenerating: boolean;
  hasContent: boolean;
  prompt: string;
  imageUrl?: string | null;
}) {
  const scrollRef = useScrollTopOnContentChange(content);
  return (
    <div className="relative">
      {/* Phone outer shell */}
      <div
        className="relative rounded-[40px] bg-zinc-900 p-[3px] shadow-2xl shadow-black/60"
        style={{ width: 260, minHeight: 520 }}
      >
        {/* Inner bezel */}
        <div className="rounded-[37px] bg-[#0c0c0e] overflow-hidden border border-zinc-800/40 h-full flex flex-col">
          {/* Notch / Dynamic Island */}
          <div className="flex justify-center pt-2 pb-1 bg-[#0c0c0e]">
            <div className="w-20 h-5 rounded-full bg-black border border-zinc-800/30" />
          </div>

          {/* Status Bar */}
          <div className="flex items-center justify-between px-5 py-1.5 text-[9px] font-semibold text-zinc-400">
            <span>9:41</span>
            <div className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z" /></svg>
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.34V5.33C17 4.6 16.4 4 15.67 4z" /></svg>
            </div>
          </div>

          {/* App Header (platform-specific) */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800/30">
            <span className="text-[11px] font-bold text-zinc-200">{platform}</span>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
          </div>

          {/* Post Content */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto">
            <PostContent
              content={content}
              platform={platform}
              contentType={contentType}
              isGenerating={isGenerating}
              hasContent={hasContent}
              prompt={prompt}
              imageUrl={imageUrl}
              compact
            />
          </div>

          {/* Home Indicator */}
          <div className="flex justify-center py-2 bg-[#0c0c0e]">
            <div className="w-28 h-1 rounded-full bg-zinc-700" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── MacBook Frame ────────────────────────────── */
function MacBookFrame({
  content,
  platform,
  contentType,
  isGenerating,
  hasContent,
  prompt,
  imageUrl = null,
}: {
  content: string;
  platform: string;
  contentType: string;
  isGenerating: boolean;
  hasContent: boolean;
  prompt: string;
  imageUrl?: string | null;
}) {
  const scrollRef = useScrollTopOnContentChange(content);
  return (
    <div className="relative w-full max-w-[400px]">
      {/* Screen lid */}
      <div className="rounded-t-2xl bg-zinc-800 p-[6px] shadow-2xl shadow-black/60">
        <div className="rounded-t-[14px] bg-[#0c0c0e] overflow-hidden border border-zinc-800/40">
          {/* Camera notch bar */}
          <div className="flex items-center justify-center bg-black py-1">
            <div className="w-3 h-3 rounded-full bg-zinc-900 border border-zinc-800/50" />
          </div>

          {/* Browser chrome */}
          <div className="flex items-center gap-2 px-3 py-1.5 border-b border-zinc-800/40 bg-zinc-950">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-500/70" />
              <div className="w-2 h-2 rounded-full bg-amber-500/70" />
              <div className="w-2 h-2 rounded-full bg-emerald-500/70" />
            </div>
            <div className="flex-1 mx-2">
              <div className="rounded-md bg-zinc-900 border border-zinc-800/50 px-2 py-0.5">
                <p className="text-[8px] text-zinc-500 text-center truncate">
                  {platform.toLowerCase()}.com
                </p>
              </div>
            </div>
          </div>

          {/* Screen content */}
          <div ref={scrollRef} className="h-[300px] overflow-y-auto bg-[#0c0c0e]">
            <PostContent
              content={content}
              platform={platform}
              contentType={contentType}
              isGenerating={isGenerating}
              hasContent={hasContent}
              prompt={prompt}
              imageUrl={imageUrl}
            />
          </div>
        </div>
      </div>

      {/* Keyboard base */}
      <div className="relative">
        <div className="h-[10px] rounded-b-xl bg-gradient-to-b from-zinc-700 to-zinc-800 mx-[-14px] shadow-lg shadow-black/50" />
        <div className="absolute left-1/2 top-0 -translate-x-1/2 w-16 h-[4px] rounded-b-md bg-zinc-900/80" />
      </div>
    </div>
  );
}

/* ─── Tablet Frame ─────────────────────────────── */
function TabletFrame({
  content,
  platform,
  contentType,
  isGenerating,
  hasContent,
  prompt,
  imageUrl = null,
}: {
  content: string;
  platform: string;
  contentType: string;
  isGenerating: boolean;
  hasContent: boolean;
  prompt: string;
  imageUrl?: string | null;
}) {
  const scrollRef = useScrollTopOnContentChange(content);
  return (
    <div className="relative">
      {/* Tablet outer shell */}
      <div
        className="relative rounded-[24px] bg-zinc-900 p-[3px] shadow-2xl shadow-black/60"
        style={{ width: 380, minHeight: 480 }}
      >
        {/* Inner bezel */}
        <div className="rounded-[21px] bg-[#0c0c0e] overflow-hidden border border-zinc-800/40 h-full flex flex-col">
          {/* Status Bar */}
          <div className="flex items-center justify-between px-6 py-2 text-[10px] font-semibold text-zinc-400">
            <span>9:41 AM</span>
            <div className="flex items-center gap-1.5">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z" /></svg>
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.34V5.33C17 4.6 16.4 4 15.67 4z" /></svg>
            </div>
          </div>

          {/* App Header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800/30">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-xs font-bold text-zinc-200">{platform}</span>
            </div>
            <div className="flex items-center gap-3">
              <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
          </div>

          {/* Tablet layout: two-column for wide view */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto flex">
            <div className="flex-1">
              <PostContent
                content={content}
                platform={platform}
                contentType={contentType}
                isGenerating={isGenerating}
                hasContent={hasContent}
                prompt={prompt}
                imageUrl={imageUrl}
              />
            </div>
            {/* Side engagement panel */}
            {hasContent && (
              <div className="w-[120px] border-l border-zinc-800/30 p-3 flex flex-col gap-3">
                <div className="text-center">
                  <p className="text-[18px] font-bold text-white">—</p>
                  <p className="text-[8px] text-zinc-500 uppercase tracking-wider">Likes</p>
                </div>
                <div className="text-center">
                  <p className="text-[18px] font-bold text-white">—</p>
                  <p className="text-[8px] text-zinc-500 uppercase tracking-wider">Comments</p>
                </div>
                <div className="text-center">
                  <p className="text-[18px] font-bold text-white">—</p>
                  <p className="text-[8px] text-zinc-500 uppercase tracking-wider">Shares</p>
                </div>
                <div className="mt-auto">
                  <div className="rounded-lg bg-zinc-900/50 border border-zinc-800/50 p-2 text-center">
                    <p className="text-[8px] text-zinc-500 font-medium">Est. Reach</p>
                    <p className="text-[11px] font-bold text-fuchsia-400 mt-0.5">Preview</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Home Indicator */}
          <div className="flex justify-center py-2 bg-[#0c0c0e]">
            <div className="w-28 h-1 rounded-full bg-zinc-700" />
          </div>
        </div>
      </div>
    </div>
  );
}
