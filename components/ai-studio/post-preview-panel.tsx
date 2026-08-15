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

type DeviceView = 'phone' | 'tablet' | 'macbook';

// Keeps device frames scrolled to the top whenever new content arrives.
function useScrollTopOnContentChange(content: string) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = 0;
  }, [content]);
  return ref;
}

export function PostPreviewPanel({
  content,
  platform,
  contentType,
  isGenerating,
  prompt,
  imageUrl = null,
}: PostPreviewPanelProps) {
  const [deviceView, setDeviceView] = useState<DeviceView>('phone');
  const [isFullScreen, setIsFullScreen] = useState(false);

  const displayContent = content || (isGenerating ? '' : '');
  const hasContent = !!content;

  return (
    <div className={`flex flex-col h-full min-h-[520px] ${isFullScreen ? 'fixed inset-0 z-50 bg-[#0a0a0c]' : ''}`}>
      {/* Panel Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/60">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-zinc-300 tracking-wide uppercase">
            Live Preview
          </span>
        </div>
        {isFullScreen ? (
          <button
            type="button"
            onClick={() => setIsFullScreen(false)}
            className="text-zinc-400 hover:text-white transition-colors"
            aria-label="Exit full screen"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        ) : (
          <>
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2-2v14a2 2 0 002 2z" />
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
              {/* Full-screen toggle */}
              <button
                type="button"
                onClick={() => setIsFullScreen(true)}
                className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all text-zinc-500 hover:text-zinc-300"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 012 2v3m-18 0h-3a2 2 0 01-2-2v-3" />
                </svg>
                Full Screen
              </button>
            </div>
          </>
        )}
      </div>

      {/* Device Frame Area */}
      <div className={`flex-1 flex items-center justify-center p-6 overflow-auto ${isFullScreen ? 'h-screen' : ''}`}>
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
          <MacbookFrame
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

      {/* Panel Footer - Platform info (hidden in fullscreen) */}
      {!isFullScreen && (
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
      )}

      {/* Full-screen backdrop when active */}
      {isFullScreen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={() => setIsFullScreen(false)} />
      )}
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-xs text-zinc-500 max-w-[200px]">
          Your generated content will appear here
        </p>
      </div>
    );
  }

  if (contentType === 'image' && imageUrl) {
    return (
      <div className="relative w-full aspect-square">
        <img
          src={imageUrl}
          alt="Generated image preview"
          className="w-full h-full object-cover rounded-xl"
        />
      </div>
    );
  }

  if (contentType === 'video') {
    return (
      <div className="relative w-full aspect-video bg-zinc-900 rounded-xl flex items-center justify-center">
        <div className="text-center text-zinc-500 px-4">
          <svg className="w-12 h-12 mx-auto mb-2 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs">Video preview</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[280px]">
      <p className="text-sm text-white leading-relaxed whitespace-pre-wrap break-words">{content}</p>
      {imageUrl && (
        <div className="mt-3 relative w-full aspect-square">
          <img
            src={imageUrl}
            alt="Attached image"
            className="w-full h-full object-cover rounded-xl"
          />
        </div>
      )}
    </div>
  );
}

/* ─── Phone Frame ───────────────────────────────── */
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
  return (
    <div className="relative w-[320px] max-w-full aspect-[9/19.5] bg-zinc-950 rounded-[40px] border-4 border-zinc-800/60 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col">
      {/* Notch */}
      <div className="mx-auto mt-4 w-[120px] h-[24px] bg-zinc-950 rounded-b-[12px] border-y border-zinc-800/60" />

      {/* Screen */}
      <div className="flex-1 p-4 overflow-y-auto">
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

      {/* Home indicator */}
      <div className="mx-auto mb-4 w-[100px] h-[5px] bg-zinc-800/60 rounded-full" />
    </div>
  );
}

/* ─── Tablet Frame ──────────────────────────────── */
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
  return (
    <div className="relative w-[500px] max-w-full aspect-[3/4] bg-zinc-950 rounded-[30px] border-4 border-zinc-800/60 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col">
      <div className="flex-1 p-6 overflow-y-auto">
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
  );
}

/* ─── MacBook Frame ─────────────────────────────── */
function MacbookFrame({
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
  return (
    <div className="relative w-[640px] max-w-full aspect-[16/10] bg-zinc-950 rounded-[16px] border border-zinc-800/60 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col">
      {/* Title bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800/60 bg-zinc-900/80">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/80" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <div className="w-3 h-3 rounded-full bg-green-500/80" />
        </div>
        <span className="text-xs text-zinc-500 font-medium">{platform} Post Preview</span>
        <div className="w-20" />
      </div>
      <div className="flex-1 p-8 overflow-y-auto">
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
  );
}