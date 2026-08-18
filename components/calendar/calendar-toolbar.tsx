'use client';

import React, { useState, useEffect } from 'react';

interface CalendarToolbarProps {
  weekStart: Date;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
  activeView: 'week' | 'month' | 'list';
  onViewChange: (view: 'week' | 'month' | 'list') => void;
}

export function CalendarToolbar({
  weekStart,
  onPreviousWeek,
  onNextWeek,
  onToday,
  activeView,
  onViewChange
}: CalendarToolbarProps) {
  // Generate date range string like 'Aug 9 – 15, 2026'
  const generateDateRange = () => {
    if (activeView === 'month') {
      return weekStart.toLocaleString('default', { month: 'long', year: 'numeric' });
    }
    if (activeView === 'list') {
      return 'Upcoming posts';
    }

    const endOfWeek = new Date(weekStart);
    endOfWeek.setDate(weekStart.getDate() + 6);

    const startMonth = weekStart.toLocaleString('default', { month: 'short' });
    const endMonth = endOfWeek.toLocaleString('default', { month: 'short' });
    const startDay = weekStart.getDate();
    const endDay = endOfWeek.getDate();
    const startYear = weekStart.getFullYear();
    const endYear = endOfWeek.getFullYear();

    if (startYear !== endYear) {
      return `${startMonth} ${startDay}, ${startYear} – ${endMonth} ${endDay}, ${endYear}`;
    } else if (startMonth !== endMonth) {
      return `${startMonth} ${startDay} – ${endMonth} ${endDay}, ${startYear}`;
    } else {
      return `${startMonth} ${startDay} – ${endDay}, ${startYear}`;
    }
  };

  const [timezone, setTimezone] = useState<string>('');

  useEffect(() => {
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone.replace('_', ' '));
  }, []);

  const VIEWS = ['week', 'month', 'list'] as const;
  const activeIndex = VIEWS.indexOf(activeView);

  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-[#0a0a0c]">
      <div className="flex items-center gap-4">
        <button 
          onClick={onToday}
          className="text-[#7FFB50] font-semibold text-sm hover:text-[#7FFB50] transition-colors"
        >
          Today
        </button>

        <div className="flex items-center gap-1">
          <button 
            onClick={onPreviousWeek}
            className="p-1 rounded-full text-zinc-400 hover:text-zinc-600 hover:bg-zinc-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button 
            onClick={onNextWeek}
            className="p-1 rounded-full text-zinc-400 hover:text-zinc-600 hover:bg-zinc-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <span className="font-semibold text-sm text-white">
          {generateDateRange()}
        </span>
      </div>

      <div className="flex items-center gap-4">
        {timezone && (
          <span className="text-xs text-zinc-500 font-medium">
            {timezone}
          </span>
        )}

        <div className="relative flex items-center rounded-full border border-white/10 bg-white/[0.04] p-1 shadow-[inset_0_1px_1px_rgba(255,255,255,0.12),0_8px_30px_-12px_rgba(0,0,0,0.8)] backdrop-blur-xl">
          <span
            className="absolute inset-y-1 left-1 rounded-full bg-gradient-to-b from-[#C7E34F]/30 to-[#C7E34F]/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)] ring-1 ring-[#C7E34F]/30 backdrop-blur-md transition-transform duration-300 ease-out"
            style={{ width: "calc((100% - 0.5rem)/3)", transform: `translateX(${activeIndex * 100}%)` }}
          />
          {VIEWS.map((view) => (
            <button
              key={view}
              onClick={() => onViewChange(view)}
              className={`relative z-10 flex-1 rounded-full px-3 py-1.5 text-center text-sm font-medium capitalize transition-colors ${
                activeView === view ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {view}
            </button>
          ))}
        </div>

        <button className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-800 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
