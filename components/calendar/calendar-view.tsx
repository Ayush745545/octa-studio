"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { reschedulePublication } from "@/app/publishing/actions/reschedule-publication";
import { cancelPublication } from "@/app/publishing/actions/cancel-publication";

interface CalendarContent {
  id: string;
  contentId: string;
  title: string;
  platform: string;
  scheduledAt: string;
}

interface CalendarViewProps {
  contents: CalendarContent[];
  initialDate: string;
}

const WEEKDAYS = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
];

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const firstWeekday = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const totalCells =
    Math.ceil((firstWeekday + daysInMonth) / 7) * 7;

  return Array.from({ length: totalCells }, (_, index) => {
    const day = index - firstWeekday + 1;

    return day >= 1 && day <= daysInMonth ? day : null;
  });
}

function dateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(
    day,
  ).padStart(2, "0")}`;
}

export default function CalendarView({
  contents,
  initialDate,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(
    new Date(initialDate),
  );

  const [selectedContent, setSelectedContent] =
    useState<CalendarContent | null>(null);

  const [draggedContent, setDraggedContent] =
    useState<CalendarContent | null>(null);

  const [dragOverDate, setDragOverDate] =
    useState<string | null>(null);

  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");

  const [isPending, startTransition] = useTransition();

  function handleDragStart(content: CalendarContent) {
    setDraggedContent(content);
  }

  function handleDragEnd() {
    setDraggedContent(null);
    setDragOverDate(null);
  }

  function handleDragOver(
    event: React.DragEvent<HTMLDivElement>,
    dateKey: string,
  ) {
    event.preventDefault();
    setDragOverDate(dateKey);
  }

  function handleDrop(
    event: React.DragEvent<HTMLDivElement>,
    dateKey: string,
  ) {
    event.preventDefault();

    if (!draggedContent) return;

    const originalDate = new Date(draggedContent.scheduledAt);
    const [year, month, day] = dateKey.split("-").map(Number);

    const newDate = new Date(
      year,
      month - 1,
      day,
      originalDate.getHours(),
      originalDate.getMinutes(),
      originalDate.getSeconds(),
    );

    const scheduledAt =
      `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, "0")}` +
      `-${String(newDate.getDate()).padStart(2, "0")}` +
      `T${String(newDate.getHours()).padStart(2, "0")}:${String(newDate.getMinutes()).padStart(2, "0")}`;

    startTransition(async () => {
      try {
        await reschedulePublication(draggedContent.id, scheduledAt);
      } finally {
        setDraggedContent(null);
        setDragOverDate(null);
      }
    });
  }

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const today = new Date();

  const todayKey = dateKey(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  const calendarDays = useMemo(
    () => getCalendarDays(year, month),
    [year, month],
  );

  const contentByDate = useMemo(() => {
    const map = new Map<string, CalendarContent[]>();

    for (const content of contents) {
      const date = new Date(content.scheduledAt);

      const key = dateKey(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
      );

      const existing = map.get(key) ?? [];
      existing.push(content);
      map.set(key, existing);
    }

    return map;
  }, [contents]);

  const monthName = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(currentDate);

  function previousMonth() {
    setCurrentDate(new Date(year, month - 1, 1));
  }

  function nextMonth() {
    setCurrentDate(new Date(year, month + 1, 1));
  }

  function goToday() {
    setCurrentDate(
      new Date(
        today.getFullYear(),
        today.getMonth(),
        1,
      ),
    );
  }

  function handleCancelSchedule() {
    if (!selectedContent) return;

    startTransition(async () => {
      try {
        await cancelPublication(selectedContent.id);
        setSelectedContent(null);
      } catch (error) {
        console.error("Failed to cancel schedule:", error);
      }
    });
  }

  return (
    <div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm text-zinc-400">
            Publishing schedule
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">
            {monthName}
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            See when your content is scheduled to go live.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={previousMonth}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 transition hover:border-zinc-400 hover:text-zinc-950"
            aria-label="Previous month"
          >
            ←
          </button>

          <button
            type="button"
            onClick={goToday}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 transition hover:border-zinc-400 hover:text-zinc-950"
          >
            Today
          </button>

          <button
            type="button"
            onClick={nextMonth}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 transition hover:border-zinc-400 hover:text-zinc-950"
            aria-label="Next month"
          >
            →
          </button>

          <Link
            href="/content"
            className="ml-2 rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800"
          >
            View Content
          </Link>
        </div>
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        <div className="grid grid-cols-7 border-b border-zinc-200 bg-zinc-50">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="border-r border-zinc-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-400 last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => {
            if (day === null) {
              return (
                <div
                  key={`empty-${index}`}
                  className="min-h-36 border-b border-r border-zinc-100 bg-zinc-50/40"
                />
              );
            }

            const key = dateKey(year, month, day);
            const items = contentByDate.get(key) ?? [];
            const isToday = key === todayKey;

            return (
              <div
                key={key}
                onDragEnter={(event) => {
                  event.preventDefault();
                  setDragOverDate(key);
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                  handleDragOver(event, key);
                }}
                onDragLeave={() => setDragOverDate(null)}
                onDrop={(event) => handleDrop(event, key)}
                className={`min-h-36 border-b border-r border-zinc-100 p-3 transition ${
                  dragOverDate === key
                    ? "bg-zinc-100 ring-2 ring-inset ring-zinc-300"
                    : "hover:bg-zinc-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={
                      isToday
                        ? "flex h-7 w-7 items-center justify-center rounded-full bg-zinc-950 text-xs font-semibold text-white"
                        : "text-xs font-medium text-zinc-500"
                    }
                  >
                    {day}
                  </span>

                  {items.length > 0 && (
                    <span className="text-[10px] font-medium text-zinc-400">
                      {items.length}
                    </span>
                  )}
                </div>

                <div className="mt-3 space-y-2">
                  {items.map((content) => {
                const scheduledDate = new Date(content.scheduledAt);

                return (
                  <div
                    key={content.id}
                    role="button"
                    tabIndex={0}
                    draggable={true}
                    onDragStart={(event) => {
                      event.dataTransfer.effectAllowed = "move";
                      event.dataTransfer.setData("text/plain", content.id);
                      handleDragStart(content);
                    }}
                    onDragEnd={handleDragEnd}
                    onClick={() => {
                      setSelectedContent(content);
                      setNewDate(
                        `${scheduledDate.getFullYear()}-${String(
                          scheduledDate.getMonth() + 1,
                        ).padStart(2, "0")}-${String(
                          scheduledDate.getDate(),
                        ).padStart(2, "0")}`,
                      );
                      setNewTime(
                        `${String(scheduledDate.getHours()).padStart(
                          2,
                          "0",
                        )}:${String(scheduledDate.getMinutes()).padStart(
                          2,
                          "0",
                        )}`,
                      );
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        setSelectedContent(content);
                      }
                    }}
                    className="group block w-full cursor-grab rounded-xl border border-zinc-200 bg-zinc-50 p-2.5 text-left transition hover:border-zinc-400 hover:bg-white active:cursor-grabbing"
                  >
                    <p className="line-clamp-2 text-xs font-medium leading-4 text-zinc-900">
                      {content.title}
                    </p>

                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-zinc-400">
                        {content.platform || "General"}
                      </span>

                      <span className="text-[10px] font-medium text-zinc-500">
                        {(() => {
                          const hours = scheduledDate.getHours();
                          const minutes = String(
                            scheduledDate.getMinutes(),
                          ).padStart(2, "0");
                          const hour12 = hours % 12 || 12;
                          const period = hours >= 12 ? "PM" : "AM";

                          return `${hour12}:${minutes} ${period}`;
                        })()}
                      </span>
                    </div>
                  </div>
                );
              })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-6">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-zinc-400">
                  Reschedule
                </p>

                <h2 className="mt-1 text-lg font-semibold text-zinc-950">
                  {selectedContent.title}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedContent(null)}
                className="text-zinc-400 hover:text-zinc-950"
              >
                ✕
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="calendar-date"
                  className="text-sm font-medium text-zinc-700"
                >
                  Date
                </label>

                <input
                  id="calendar-date"
                  type="date"
                  value={newDate}
                  onChange={(event) => setNewDate(event.target.value)}
                  disabled={isPending}
                  className="mt-2 w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-400"
                />
              </div>

              <div>
                <label
                  htmlFor="calendar-time"
                  className="text-sm font-medium text-zinc-700"
                >
                  Time
                </label>

                <input
                  id="calendar-time"
                  type="time"
                  value={newTime}
                  onChange={(event) => setNewTime(event.target.value)}
                  disabled={isPending}
                  className="mt-2 w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-400"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleCancelSchedule}
                disabled={isPending}
                className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 transition hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPending ? "Saving..." : "Cancel Schedule"}
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedContent(null)}
                  disabled={isPending}
                  className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:border-zinc-300"
                >
                  Close
                </button>

                <button
                  type="button"
                  disabled={!newDate || !newTime || isPending}
                  onClick={() => {
                    if (!selectedContent) return;

                    const scheduledAt = `${newDate}T${newTime}`;

                    startTransition(async () => {
                      try {
                        await reschedulePublication(
                          selectedContent.id,
                          scheduledAt,
                        );

                        setSelectedContent(null);
                      } catch (error) {
                        console.error("Failed to reschedule:", error);
                      }
                    });
                  }}
                  className="rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isPending ? "Saving..." : "Save Schedule"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
