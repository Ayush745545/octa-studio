'use client';

import React, { ReactNode } from 'react';
import Link from 'next/link';

interface WorkspaceSidebarProps {
  activeItem: 'overview' | 'ideas' | 'content' | 'ai-studio' | 'calendar' | 'publishing' | 'analytics' | 'custom-analytics' | 'settings';
  onToggle?: () => void;
  collapsed?: boolean;
}

const NAV_ITEMS: Array<{
  key: WorkspaceSidebarProps['activeItem'];
  href: string;
  label: string;
  icon: ReactNode;
}> = [
  {
    key: 'overview',
    href: '/',
    label: 'Overview',
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />,
  },
  {
    key: 'ideas',
    href: '/ideas',
    label: 'Ideas',
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />,
  },
  {
    key: 'content',
    href: '/content',
    label: 'Content',
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />,
  },
  {
    key: 'ai-studio',
    href: '/ai-studio',
    label: 'AI Studio',
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />,
  },
  {
    key: 'calendar',
    href: '/calendar',
    label: 'Calendar',
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
  },
  {
    key: 'publishing',
    href: '/publishing',
    label: 'Social Inbox',
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />,
  },
  {
    key: 'analytics',
    href: '/analytics',
    label: 'Analytics',
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
  },
  {
    key: 'custom-analytics',
    href: '/custom-analytics',
    label: 'Custom',
    icon: (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
      </>
    ),
  },
];

const SETTINGS_ICON = (
  <>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </>
);

export function WorkspaceSidebar({ activeItem, collapsed = false }: WorkspaceSidebarProps) {
  const itemClass = (active: boolean) =>
    `flex w-full flex-col items-center justify-center gap-1.5 rounded-2xl py-2.5 transition-colors ${
      active ? 'bg-white/10 text-white' : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-200'
    }`;

  return (
    <aside
      className={`fixed left-3 top-3 bottom-3 z-40 flex flex-col items-center rounded-3xl border border-white/10 bg-white/[0.04] py-4 backdrop-blur-xl transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-[92px]'
      }`}
    >
      <Link
        href="/"
        title="Go to homepage"
        className={`mb-4 flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#7C3AED] to-[#a78bfa] font-bold text-white transition hover:opacity-85 ${
          collapsed ? 'h-8 w-8 text-sm' : 'h-10 w-10 text-lg'
        }`}
      >
        C
      </Link>

      <nav className="no-scrollbar flex w-full flex-1 flex-col items-center gap-1 overflow-y-auto px-2">
        {NAV_ITEMS.map((item) => (
          <Link key={item.key} href={item.href} title={item.label} className={itemClass(activeItem === item.key)}>
            <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              {item.icon}
            </svg>
            {!collapsed && <span className="text-[10px] font-medium leading-none">{item.label}</span>}
          </Link>
        ))}

        <div className="my-2 h-px w-8 shrink-0 bg-white/10" />

        <Link href="/settings" title="Settings" className={itemClass(activeItem === 'settings')}>
          <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            {SETTINGS_ICON}
          </svg>
          {!collapsed && <span className="text-[10px] font-medium leading-none">Settings</span>}
        </Link>
      </nav>

      <div className="mt-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#a855f7] text-black">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </div>
    </aside>
  );
}
