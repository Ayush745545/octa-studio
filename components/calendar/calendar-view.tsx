"use client";

import { useMemo, useEffect, useState, useRef } from "react";

export interface ScheduledPost {
  id: string;
  contentId: string;
  title: string;
  body?: string | null;
  platform: string;
  accountName?: string | null;
  scheduledAt: string;
  media?: Array<{ id: string; url: string; filename: string; mimeType: string; type: string }>;
}

export interface CalendarViewProps {
  posts: ScheduledPost[];
  weekStart: Date;
  onCellClick: (date: string, time: string) => void;
  onPostClick: (post: ScheduledPost) => void;
  onReschedule: (postId: string, newScheduledAt: string) => void;
  onMediaDrop: (date: string, time: string, mediaData: any) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

function formatHour(hour: number): string {
  if (hour === 0) return "12AM";
  if (hour < 12) return `${hour}AM`;
  if (hour === 12) return "12PM";
  return `${hour - 12}PM`;
}

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function isSameDay(d1: Date, d2: Date): boolean {
  return dateKey(d1) === dateKey(d2);
}

const PLATFORM_COLORS: Record<string, string> = {
  twitter: "bg-blue-500",
  instagram: "bg-pink-500",
  linkedin: "bg-blue-700",
  tiktok: "bg-black",
  youtube: "bg-red-600",
  facebook: "bg-blue-600",
};

export default function CalendarView({
  posts,
  weekStart,
  onCellClick,
  onPostClick,
  onReschedule,
  onMediaDrop,
}: CalendarViewProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [draggedPost, setDraggedPost] = useState<ScheduledPost | null>(null);
  const [dragOverCell, setDragOverCell] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      const currentHour = new Date().getHours();
      const scrollPosition = Math.max(0, currentHour * 52 - 100);
      scrollRef.current.scrollTop = scrollPosition;
    }
  }, [weekStart]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      d.setHours(0, 0, 0, 0);
      return d;
    });
  }, [weekStart]);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, [currentTime.getDate()]); // Update if day changes

  const postsByCell = useMemo(() => {
    const map = new Map<string, ScheduledPost[]>();
    const start = new Date(weekStart);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);

    for (const post of posts) {
      const scheduled = new Date(post.scheduledAt);
      if (scheduled >= start && scheduled < end) {
        const key = `${dateKey(scheduled)}-${scheduled.getHours()}`;
        const existing = map.get(key) ?? [];
        existing.push(post);
        map.set(key, existing);
      }
    }

    return map;
  }, [posts, weekStart]);

  const timeIndicator = useMemo(() => {
    const currentDay = currentTime.getDay();
    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();
    
    const startDay = weekStart.getDay();
    const dayOffset = (currentDay - startDay + 7) % 7;
    
    const todayDate = new Date();
    todayDate.setHours(0,0,0,0);
    const isCurrentWeek = weekDays.some(d => isSameDay(d, todayDate));
    
    if (!isCurrentWeek) return null;

    return {
      top: (currentHour * 52) + (currentMinute / 60) * 52,
    };
  }, [currentTime, weekStart, weekDays]);

  function handleDragStart(e: React.DragEvent, post: ScheduledPost) {
    e.stopPropagation();
    setDraggedPost(post);
    // Needed for Firefox
    e.dataTransfer.setData("text/plain", post.id);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e: React.DragEvent, cellKey: string) {
    e.preventDefault();
    if (!dragOverCell || dragOverCell !== cellKey) {
      setDragOverCell(cellKey);
    }
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setDragOverCell(null);
  }

  function handleDrop(e: React.DragEvent, day: Date, hour: number) {
    e.preventDefault();
    setDragOverCell(null);

    const cellDateKey = dateKey(day);
    const timeString = `${String(hour).padStart(2, "0")}:00`;

    // Handle internal post dragging
    if (draggedPost) {
      const newScheduledAt = `${cellDateKey}T${timeString}:00`;
      onReschedule(draggedPost.id, newScheduledAt);
      setDraggedPost(null);
      return;
    }

    // Handle external media dropping
    try {
      const rawData = e.dataTransfer.getData("application/json");
      if (rawData) {
        const parsed = JSON.parse(rawData);
        onMediaDrop(cellDateKey, timeString, parsed);
      }
    } catch (err) {
      // Ignore if not valid JSON
    }
  }

  function handleCellClick(day: Date, hour: number) {
    const dateStr = dateKey(day);
    const timeStr = `${String(hour).padStart(2, "0")}:00`;
    onCellClick(dateStr, timeStr);
  }

  return (
    <div className="flex h-full flex-col min-w-0 bg-[#0a0a0c]">
      <div 
        ref={scrollRef}
        className="relative flex-1 overflow-y-auto"
      >
        <div 
          className="grid min-w-[800px]"
          style={{ gridTemplateColumns: "50px repeat(7, minmax(0, 1fr))" }}
        >
          {/* Header row */}
          <div className="sticky top-0 left-0 z-30 h-14 bg-[#0a0a0c] border-b border-r border-zinc-800" />
          {weekDays.map((day) => {
            const isToday = isSameDay(day, today);
            return (
              <div
                key={day.toISOString()}
                className={`sticky top-0 z-20 h-14 border-b border-r border-zinc-800 px-2 py-2 flex flex-col items-center justify-center ${
                  isToday ? "bg-zinc-900/40/60" : "bg-[#0a0a0c]"
                }`}
              >
                <div className={`text-xl font-medium ${isToday ? "text-[#7C3AED]" : "text-white"}`}>
                  {day.getDate()}
                </div>
                <div className="text-[10px] font-semibold text-zinc-500 tracking-wider">
                  {WEEKDAYS[day.getDay()]}
                </div>
              </div>
            );
          })}

          {/* Grid Area */}
          <div className="col-span-full relative" style={{ display: "contents" }}>
            {HOURS.map((hour) => (
              <div key={`row-${hour}`} style={{ display: "contents" }}>
                {/* Time Column */}
                <div className="sticky left-0 z-10 h-[52px] border-b border-r border-zinc-800 bg-[#0a0a0c] px-1.5 py-1">
                  <span className="text-[10px] font-medium text-zinc-500 block -mt-2">
                    {hour === 0 ? "" : formatHour(hour)}
                  </span>
                </div>
                
                {/* Day Cells */}
                {weekDays.map((day) => {
                  const cellKey = `${dateKey(day)}-${hour}`;
                  const cellPosts = postsByCell.get(cellKey) ?? [];
                  const isDragOver = dragOverCell === cellKey;
                  const isToday = isSameDay(day, today);

                  return (
                    <div
                      key={cellKey}
                      onClick={() => handleCellClick(day, hour)}
                      onDragOver={(e) => handleDragOver(e, cellKey)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, day, hour)}
                      className={`h-[52px] border-b border-r border-zinc-800 p-1 relative transition-colors ${
                        isDragOver
                          ? "bg-[#F3E8FF]/60 ring-1 ring-inset ring-[#7C3AED]/40"
                          : isToday 
                            ? "bg-zinc-900/40/60 hover:bg-zinc-800/60" 
                            : "hover:bg-zinc-900/40"
                      }`}
                    >
                      <div className="flex flex-col gap-1 h-full overflow-y-auto no-scrollbar">
                        {cellPosts.map((post) => {
                          const platformColor = PLATFORM_COLORS[post.platform?.toLowerCase()] || "bg-zinc-900/400";
                          const scheduled = new Date(post.scheduledAt);
                          const postTime = `${scheduled.getHours() % 12 || 12}:${String(scheduled.getMinutes()).padStart(2, "0")}${scheduled.getHours() >= 12 ? "p" : "a"}`;

                          return (
                            <div
                              key={post.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, post)}
                              onDragEnd={() => setDraggedPost(null)}
                              onClick={(e) => {
                                e.stopPropagation();
                                onPostClick(post);
                              }}
                              className="group flex flex-col rounded-md border border-zinc-800 bg-[#0a0a0c] p-1.5 shadow-sm transition hover:border-[#7C3AED] hover:shadow-md cursor-grab active:cursor-grabbing"
                            >
                              <div className="flex items-center gap-1.5 mb-1">
                                <div className={`w-1.5 h-1.5 rounded-full ${platformColor}`} />
                                <span className="text-[9px] font-medium text-zinc-500 uppercase tracking-wider truncate">
                                  {post.platform}
                                </span>
                              </div>
                              <div className="text-xs font-medium text-white truncate">
                                {post.title || "Untitled Post"}
                              </div>
                              <div className="text-[9px] text-zinc-400 text-right mt-0.5">
                                {postTime}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Current Time Indicator */}
            {timeIndicator && (
              <div
                className="pointer-events-none absolute left-0 right-0 z-30 flex items-center"
                style={{ top: `${timeIndicator.top + 56}px` }} // +56 for header offset
              >
                <div className="w-[50px] relative">
                  <div className="absolute right-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#7C3AED]" />
                </div>
                <div className="flex-1 h-[1px] bg-[#7C3AED]" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
