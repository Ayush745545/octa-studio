'use client';

import React, { ReactNode } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Lightbulb,
  FileText,
  Zap,
  CalendarDays,
  Inbox,
  BarChart3,
  PieChart,
  Settings,
} from 'lucide-react';
import { AnimateIcon } from '@/components/animate-ui/icons/animate-icon';


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
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    key: 'ideas',
    href: '/ideas',
    label: 'Ideas',
    icon: <Lightbulb className="h-5 w-5" />,
  },
  {
    key: 'content',
    href: '/content',
    label: 'Content',
    icon: <FileText className="h-5 w-5" />,
  },
  {
    key: 'ai-studio',
    href: '/ai-studio',
    label: 'AI Studio',
    icon: <Zap className="h-5 w-5" />,
  },
  {
    key: 'calendar',
    href: '/calendar',
    label: 'Calendar',
    icon: <CalendarDays className="h-5 w-5" />,
  },
  {
    key: 'publishing',
    href: '/publishing',
    label: 'Social Inbox',
    icon: <Inbox className="h-5 w-5" />,
  },
  {
    key: 'analytics',
    href: '/analytics',
    label: 'Analytics',
    icon: <BarChart3 className="h-5 w-5" />,
  },
  {
    key: 'custom-analytics',
    href: '/custom-analytics',
    label: 'Custom',
    icon: <PieChart className="h-5 w-5" />,
  },
];


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
                    <Link key={item.key} href={item.href} title={item.label} className={`group ${itemClass(activeItem === item.key)}`}>
            <AnimateIcon animateOnHover>
              {item.icon}
            </AnimateIcon>
            {!collapsed && <span className="text-[10px] font-medium leading-none">{item.label}</span>}
          </Link>
        ))}

        <div className="my-2 h-px w-8 shrink-0 bg-white/10" />

                <Link href="/settings" title="Settings" className={`group ${itemClass(activeItem === 'settings')}`}>
          <AnimateIcon animateOnHover>
            <Settings className="h-5 w-5 shrink-0" />
          </AnimateIcon>
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
