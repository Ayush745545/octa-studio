'use client';

import React from 'react';
import Link from 'next/link';

interface WorkspaceSidebarProps {
  onMediaClick?: () => void;
  isMediaOpen?: boolean;
  activeItem: 'overview' | 'ideas' | 'content' | 'ai-studio' | 'calendar' | 'media' | 'publishing' | 'analytics' | 'custom-analytics' | 'link-in-bio' | 'creator-home' | 'settings' | 'help' | 'whats-new';
}

export function WorkspaceSidebar({ onMediaClick, isMediaOpen, activeItem }: WorkspaceSidebarProps) {
  return (
    <aside className="w-[130px] h-screen bg-[#0a0a0c] border-r border-zinc-800 flex flex-col fixed left-0 top-0">
      <div className="p-4 flex justify-center mb-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#7C3AED] to-[#a78bfa] flex items-center justify-center text-white font-bold text-lg">
          C
        </div>
      </div>

      <nav className="flex-1 px-2 space-y-1 overflow-y-auto no-scrollbar">
        <Link 
          href="/" 
          className={`flex flex-col items-center justify-center py-2 px-3 gap-1 rounded-lg transition-colors ${activeItem === 'overview' ? 'bg-[#F3E8FF] text-[#7C3AED]' : 'text-zinc-600 hover:bg-zinc-950'}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-sm text-center">Overview</span>
        </Link>

        <Link 
          href="/ideas" 
          className={`flex flex-col items-center justify-center py-2 px-3 gap-1 rounded-lg transition-colors ${activeItem === 'ideas' ? 'bg-[#F3E8FF] text-[#7C3AED]' : 'text-zinc-600 hover:bg-zinc-950'}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <span className="text-sm text-center">Ideas</span>
        </Link>

        <Link 
          href="/content" 
          className={`flex flex-col items-center justify-center py-2 px-3 gap-1 rounded-lg transition-colors ${activeItem === 'content' ? 'bg-[#F3E8FF] text-[#7C3AED]' : 'text-zinc-600 hover:bg-zinc-950'}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span className="text-sm text-center">Content</span>
        </Link>

        <Link 
          href="/ai-studio" 
          className={`flex flex-col items-center justify-center py-2 px-3 gap-1 rounded-lg transition-colors ${activeItem === 'ai-studio' ? 'bg-[#F3E8FF] text-[#7C3AED]' : 'text-zinc-600 hover:bg-zinc-950'}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span className="text-sm text-center">AI Studio</span>
        </Link>
        <Link 
          href="/calendar" 
          className={`flex flex-col items-center justify-center py-2 px-3 gap-1 rounded-lg transition-colors ${activeItem === 'calendar' ? 'bg-[#F3E8FF] text-[#7C3AED]' : 'text-zinc-600 hover:bg-zinc-950'}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-sm text-center">Calendar</span>
        </Link>
        
        <button 
          onClick={onMediaClick}
          className={`w-full flex flex-col items-center justify-center py-2 px-3 gap-1 rounded-lg transition-colors ${activeItem === 'media' ? 'bg-[#F3E8FF] text-[#7C3AED]' : 'text-zinc-600 hover:bg-zinc-950'}`}
        >
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {isMediaOpen && <span className="text-xs">→</span>}
          </div>
          <span className="text-sm text-center">Media</span>
        </button>

        <Link href="/publishing" className={`flex flex-col items-center justify-center py-2 px-3 gap-1 rounded-lg transition-colors ${activeItem === 'publishing' ? 'bg-[#F3E8FF] text-[#7C3AED]' : 'text-zinc-600 hover:bg-zinc-950'}`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
          <span className="text-sm text-center">Social Inbox</span>
        </Link>

        <Link href="/analytics" className={`flex flex-col items-center justify-center py-2 px-3 gap-1 rounded-lg transition-colors ${activeItem === 'analytics' ? 'bg-[#F3E8FF] text-[#7C3AED]' : 'text-zinc-600 hover:bg-zinc-950'}`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span className="text-sm text-center">Analytics</span>
        </Link>

        <Link 
          href="/custom-analytics" 
          className={`flex flex-col items-center justify-center py-2 px-3 gap-1 rounded-lg transition-colors ${activeItem === 'custom-analytics' ? 'bg-[#F3E8FF] text-[#7C3AED]' : 'text-zinc-600 hover:bg-zinc-950'}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
          </svg>
          <span className="text-sm text-center">Custom Analytics</span>
        </Link>

        <Link 
          href="/link-in-bio"
          className={`flex flex-col items-center justify-center py-2 px-3 gap-1 rounded-lg transition-colors ${activeItem === 'link-in-bio' ? 'bg-[#F3E8FF] text-[#7C3AED]' : 'text-zinc-600 hover:bg-zinc-950'}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <span className="text-sm text-center">Link in Bio</span>
        </Link>

        <Link 
          href="/creator-home"
          className={`flex flex-col items-center justify-center py-2 px-3 gap-1 rounded-lg transition-colors ${activeItem === 'creator-home' ? 'bg-[#F3E8FF] text-[#7C3AED]' : 'text-zinc-600 hover:bg-zinc-950'}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-sm text-center">Creator Home</span>
        </Link>
      </nav>

      <div className="mt-auto px-2 space-y-1 mb-4">
        <Link 
          href="/settings" 
          className={`flex flex-col items-center justify-center py-2 px-3 gap-1 rounded-lg transition-colors ${activeItem === 'settings' ? 'bg-[#F3E8FF] text-[#7C3AED]' : 'text-zinc-600 hover:bg-zinc-950'}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-sm text-center">Settings</span>
        </Link>
        
        <Link 
          href="/help"
          className={`flex flex-col items-center justify-center py-2 px-3 gap-1 rounded-lg transition-colors ${activeItem === 'help' ? 'bg-[#F3E8FF] text-[#7C3AED]' : 'text-zinc-600 hover:bg-zinc-950'}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm text-center">Help</span>
        </Link>

        <Link 
          href="/whats-new"
          className={`flex flex-col items-center justify-center py-2 px-3 gap-1 rounded-lg transition-colors ${activeItem === 'whats-new' ? 'bg-[#F3E8FF] text-[#7C3AED]' : 'text-zinc-600 hover:bg-zinc-950'}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
          <span className="text-sm text-center text-xs whitespace-nowrap">What's New</span>
        </Link>
      </div>

      <div className="p-3 border-t border-zinc-800 flex items-center justify-between cursor-pointer hover:bg-zinc-950 transition-colors">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center text-xs font-semibold text-zinc-600">
            MG
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-white leading-tight">Main Group</span>
            <span className="text-[10px] text-zinc-500 leading-tight">0 Social Profiles</span>
          </div>
        </div>
        <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </aside>
  );
}
