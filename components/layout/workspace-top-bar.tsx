'use client';

import React from 'react';

interface WorkspaceTopBarProps {
  connectedChannels: Array<{
    platform: string;
    accountName: string | null;
    externalId: string | null;
  }>;
  onUploadMedia: () => void;
  onToggleSidebar?: () => void;
}

export function WorkspaceTopBar({ connectedChannels, onUploadMedia, onToggleSidebar }: WorkspaceTopBarProps) {
  return (
    <div className="h-12 border-b border-zinc-800 bg-[#0a0a0c] px-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="border border-zinc-800 rounded-full p-2 text-white hover:bg-zinc-950 flex items-center justify-center transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}

        <button
          onClick={onUploadMedia}
          className="border border-zinc-800 rounded-full px-4 py-1.5 text-sm font-medium text-white hover:bg-zinc-950 flex items-center gap-2 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Upload Media
        </button>

        <button className="border border-zinc-800 rounded-full px-4 py-1.5 text-sm font-medium text-white hover:bg-zinc-950 flex items-center gap-2 transition-colors">
          <svg className="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L5 6.5l7 4.5 7-4.5z"/>
            <path d="M5 15.5L12 20l7-4.5V11l-7 4.5L5 11z"/>
            <path d="M5 6.5v9l7 4.5v-9z"/>
            <path d="M19 6.5v9l-7 4.5v-9z"/>
          </svg>
          Dropbox
        </button>

        <div className="h-6 w-px bg-[#E5E5E5] mx-1"></div>

        <button className="border border-zinc-800 rounded-full px-4 py-1.5 text-sm font-medium text-white flex items-center gap-2 hover:bg-zinc-950 transition-colors">
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
          Select Profiles ({connectedChannels.length})
        </button>

        <div className="flex items-center gap-1">
          {connectedChannels.map((channel, i) => (
            <div
              key={i}
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{
                backgroundColor:
                  channel.platform === 'LinkedIn' ? '#0A66C2' :
                  channel.platform === 'Instagram' ? '#E4405F' :
                  channel.platform === 'Facebook' ? '#1877F2' :
                  channel.platform === 'TikTok' ? '#000' :
                  channel.platform === 'YouTube' ? '#FF0000' :
                  channel.platform === 'X' ? '#000' : '#7FFB50'
              }}
              title={channel.accountName || channel.platform}
            >
              {channel.platform.substring(0, 1).toUpperCase()}
            </div>
          ))}
          <button className="w-7 h-7 rounded-full border border-dashed border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-zinc-600 hover:border-zinc-300 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>

      <div>
        <button className="bg-[#111111] text-white rounded-full px-5 py-2 text-sm font-medium hover:bg-zinc-800 transition-colors">
          Start 14-Day Free Trial
        </button>
      </div>
    </div>
  );
}
