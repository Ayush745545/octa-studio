'use client';

import React, { ReactNode, useState } from 'react';
import { WorkspaceSidebar } from './workspace-sidebar';
import { WorkspaceTopBar } from './workspace-top-bar';

interface WorkspaceLayoutProps {
  children: ReactNode;
  activeItem: 'overview' | 'ideas' | 'content' | 'ai-studio' | 'calendar' | 'publishing' | 'analytics' | 'custom-analytics' | 'settings';
  connectedChannels?: Array<{ platform: string; accountName: string | null; externalId: string | null }>;
}

export default function WorkspaceLayout({
  children,
  activeItem,
  connectedChannels = [],
}: WorkspaceLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const sidebarWidth = collapsed ? 88 : 116;

  return (
    <div className="flex h-[100dvh] bg-[#0a0a0c] text-white overflow-hidden">
      <WorkspaceSidebar
        activeItem={activeItem}
        onToggle={() => setCollapsed((prev) => !prev)}
        collapsed={collapsed}
      />
      <div className="flex flex-1 flex-col min-w-0" style={{ marginLeft: sidebarWidth }}>
        <WorkspaceTopBar
          connectedChannels={connectedChannels}
          onUploadMedia={() => {}}
          onToggleSidebar={() => setCollapsed((prev) => !prev)}
        />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
