"use client";

import { useMemo } from "react";
import type { ScheduledPost } from "./calendar-view";

const PLATFORM_COLORS: Record<string, string> = {
  twitter: "bg-blue-500",
  instagram: "bg-pink-500",
  linkedin: "bg-blue-700",
  tiktok: "bg-black",
  youtube: "bg-red-600",
  facebook: "bg-blue-600",
};

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

interface CalendarListViewProps {
  posts: ScheduledPost[];
  onPostClick: (post: ScheduledPost) => void;
}

export default function CalendarListView({ posts, onPostClick }: CalendarListViewProps) {
  const groups = useMemo(() => {
    const sorted = [...posts].sort(
      (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
    );

    const map = new Map<string, ScheduledPost[]>();
    for (const post of sorted) {
      const key = dateKey(new Date(post.scheduledAt));
      const list = map.get(key) ?? [];
      list.push(post);
      map.set(key, list);
    }
    return Array.from(map.entries());
  }, [posts]);

  const todayKey = dateKey(new Date());

  if (groups.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-zinc-500">No scheduled posts yet — click a day in Week or Month view to create one.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-4 py-4">
      {groups.map(([key, dayPosts]) => {
        const day = new Date(`${key}T00:00:00`);
        const isToday = key === todayKey;
        const label = new Intl.DateTimeFormat("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        }).format(day);

        return (
          <div key={key} className="mb-6">
            <p className={`mb-2 text-[11px] font-semibold uppercase tracking-wider ${isToday ? "text-[#7FFB50]" : "text-zinc-500"}`}>
              {label}
              {isToday && <span className="ml-2 rounded-full bg-[#7FFB50]/15 px-2 py-0.5 text-[9px] font-bold text-[#7FFB50]">Today</span>}
            </p>

            <div className="flex flex-col gap-1.5">
              {dayPosts.map((post) => {
                const platformColor =
                  PLATFORM_COLORS[post.platform?.toLowerCase()] || "bg-zinc-500";
                const scheduled = new Date(post.scheduledAt);
                const time = new Intl.DateTimeFormat("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                }).format(scheduled);

                return (
                  <button
                    key={post.id}
                    type="button"
                    onClick={() => onPostClick(post)}
                    className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-[#0a0a0c] px-3 py-2.5 text-left transition hover:border-[#7FFB50]"
                  >
                    <span className="w-16 flex-shrink-0 text-[11px] font-medium text-zinc-400">{time}</span>
                    <span className={`h-2 w-2 flex-shrink-0 rounded-full ${platformColor}`} />
                    <span className="w-20 flex-shrink-0 truncate text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                      {post.platform}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-white">
                      {post.title || "Untitled Post"}
                    </span>
                    {post.media && post.media.length > 0 && (
                      <span className="flex-shrink-0 rounded-full bg-zinc-800 px-2 py-0.5 text-[9px] font-medium text-zinc-400">
                        {post.media.length} media
                      </span>
                    )}
                    <span className="flex-shrink-0 text-[10px] text-zinc-600">→</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
