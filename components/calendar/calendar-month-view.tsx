"use client";

import { useMemo, useState } from "react";
import type { ScheduledPost } from "./calendar-view";

const PLATFORM_COLORS: Record<string, string> = {
  twitter: "bg-blue-500",
  instagram: "bg-pink-500",
  linkedin: "bg-blue-700",
  tiktok: "bg-black",
  youtube: "bg-red-600",
  facebook: "bg-blue-600",
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

interface CalendarMonthViewProps {
  posts: ScheduledPost[];
  cursor: Date;
  onCellClick: (date: string, time: string) => void;
  onPostClick: (post: ScheduledPost) => void;
  onReschedule: (postId: string, newScheduledAt: string) => void;
  onMediaDrop?: (date: string, time: string, mediaData: any) => void;
}

export default function CalendarMonthView({
  posts,
  cursor,
  onCellClick,
  onPostClick,
  onReschedule,
  onMediaDrop,
}: CalendarMonthViewProps) {
  const [draggedPost, setDraggedPost] = useState<ScheduledPost | null>(null);
  const [dragOverDay, setDragOverDay] = useState<string | null>(null);

  const days = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const first = new Date(year, month, 1);
    const start = new Date(first);
    start.setDate(1 - first.getDay());

    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [cursor]);

  const postsByDay = useMemo(() => {
    const map = new Map<string, ScheduledPost[]>();
    for (const post of posts) {
      const key = dateKey(new Date(post.scheduledAt));
      const list = map.get(key) ?? [];
      list.push(post);
      map.set(key, list);
    }
    for (const list of map.values()) {
      list.sort(
        (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
      );
    }
    return map;
  }, [posts]);

  const todayKey = dateKey(new Date());

  function handleDrop(e: React.DragEvent, day: Date) {
    e.preventDefault();
    setDragOverDay(null);

    if (draggedPost) {
      // Keep the post's original time, move it to the dropped day
      const orig = new Date(draggedPost.scheduledAt);
      const hh = String(orig.getHours()).padStart(2, "0");
      const mm = String(orig.getMinutes()).padStart(2, "0");
      onReschedule(draggedPost.id, `${dateKey(day)}T${hh}:${mm}:00`);
      setDraggedPost(null);
      return;
    }

    // External media dragged from the media panel
    if (onMediaDrop) {
      try {
        const rawData = e.dataTransfer.getData("application/json");
        if (rawData) {
          onMediaDrop(dateKey(day), "09:00", JSON.parse(rawData));
        }
      } catch {
        // ignore malformed payloads
      }
    }
  }

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      {/* Weekday header */}
      <div className="grid grid-cols-7 border-b border-zinc-800">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-2 text-center text-[10px] font-medium uppercase tracking-wider text-zinc-500">
            {d}
          </div>
        ))}
      </div>

      {/* 6-week grid */}
      <div className="grid flex-1 grid-cols-7 grid-rows-6 min-h-0">
        {days.map((day) => {
          const key = dateKey(day);
          const inMonth = day.getMonth() === cursor.getMonth();
          const isToday = key === todayKey;
          const dayPosts = postsByDay.get(key) ?? [];

          return (
            <div
              key={key}
              onClick={() => onCellClick(key, "09:00")}
              onDragOver={(e) => {
                e.preventDefault();
                if (dragOverDay !== key) setDragOverDay(key);
              }}
              onDragLeave={() => setDragOverDay(null)}
              onDrop={(e) => handleDrop(e, day)}
              className={`flex min-h-0 flex-col gap-1 border-b border-r border-zinc-900/50 p-1.5 transition-colors ${
                dragOverDay === key ? "bg-[#7FFB50]/10" : "hover:bg-zinc-900/30"
              } ${inMonth ? "" : "opacity-40"}`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-medium ${
                  isToday ? "bg-[#7FFB50] text-white" : "text-zinc-500"
                }`}
              >
                {day.getDate()}
              </span>

              {dayPosts.slice(0, 3).map((post) => {
                const platformColor =
                  PLATFORM_COLORS[post.platform?.toLowerCase()] || "bg-zinc-500";
                const scheduled = new Date(post.scheduledAt);
                const time = `${scheduled.getHours() % 12 || 12}:${String(scheduled.getMinutes()).padStart(2, "0")}${scheduled.getHours() >= 12 ? "p" : "a"}`;

                return (
                  <div
                    key={post.id}
                    draggable
                    onDragStart={(e) => {
                      e.stopPropagation();
                      setDraggedPost(post);
                      e.dataTransfer.setData("text/plain", post.id);
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    onDragEnd={() => setDraggedPost(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      onPostClick(post);
                    }}
                    className="flex cursor-grab items-center gap-1 truncate rounded border border-zinc-800 bg-[#0a0a0c] px-1.5 py-1 transition hover:border-[#7FFB50] active:cursor-grabbing"
                  >
                    <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${platformColor}`} />
                    <span className="truncate text-[9px] font-medium text-white">
                      {post.title || "Untitled Post"}
                    </span>
                    <span className="ml-auto flex-shrink-0 text-[8px] text-zinc-500">{time}</span>
                  </div>
                );
              })}

              {dayPosts.length > 3 && (
                <span className="px-1 text-[9px] font-medium text-zinc-500">
                  +{dayPosts.length - 3} more
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
