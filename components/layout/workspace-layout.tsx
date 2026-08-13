'use client';

import React, { ReactNode } from 'react';
import { WorkspaceSidebar } from './workspace-sidebar';
import { WorkspaceTopBar } from './workspace-top-bar';

interface WorkspaceLayoutProps {
  children: ReactNode;
  activeItem: 'overview' | 'ideas' | 'content' | 'ai-studio' | 'calendar' | 'media' | 'publishing' | 'analytics' | 'custom-analytics' | 'link-in-bio' | 'creator-home' | 'settings' | 'help' | 'whats-new';
  connectedChannels?: Array<{ platform: string; accountName: string | null; externalId: string | null }>;
  onMediaClick?: () => void;
  isMediaOpen?: boolean;
}

export default function WorkspaceLayout({ 
  children, 
  activeItem, 
  connectedChannels = [],
  onMediaClick,
  isMediaOpen = false
}: WorkspaceLayoutProps) {
  return (
    <div className="flex h-[100dvh] bg-[#0a0a0c] text-white overflow-hidden">
      <WorkspaceSidebar 
        onMediaClick={onMediaClick} 
        isMediaOpen={isMediaOpen} 
        activeItem={activeItem} 
      />
      <div className="ml-[130px] flex flex-1 flex-col min-w-0">
        <WorkspaceTopBar 
          connectedChannels={connectedChannels} 
          onUploadMedia={() => {}} 
        />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
