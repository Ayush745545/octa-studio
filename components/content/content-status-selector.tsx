"use client";

import { useState, useTransition } from "react";
import { updateContentStatus } from "@/app/content/actions/update-content-status";
import { scheduleContent } from "@/app/content/actions/schedule-content";

const STATUSES = [
  "DRAFT",
  "READY",
  "SCHEDULED",
  "PUBLISHED",
] as const;

type ContentStatus = (typeof STATUSES)[number];

interface ContentStatusSelectorProps {
  id: string;
  status: string;
  scheduledAt?: string | Date | null;
}

export default function ContentStatusSelector({
  id,
  status,
  scheduledAt,
}: ContentStatusSelectorProps) {
  const [isPending, startTransition] = useTransition();

  const existingDate = scheduledAt
    ? new Date(scheduledAt)
    : null;

  const [scheduleDate, setScheduleDate] = useState(
    existingDate ? existingDate.toISOString().slice(0, 10) : "",
  );

  const [scheduleTime, setScheduleTime] = useState(
    existingDate
      ? existingDate.toTimeString().slice(0, 5)
      : "",
  );

  function handleChange(nextStatus: ContentStatus) {
    startTransition(async () => {
      await updateContentStatus(id, nextStatus);
    });
  }

  function handleSchedule() {
    if (!scheduleDate || !scheduleTime) {
      return;
    }

    const scheduled = `${scheduleDate}T${scheduleTime}`;

    startTransition(async () => {
      await scheduleContent(id, scheduled);
    });
  }

  return (
    <div className="max-w-md">
      <label
        htmlFor="content-status"
        className="text-sm font-medium text-zinc-700"
      >
        Status
      </label>

      <select
        id="content-status"
        value={status}
        disabled={isPending}
        onChange={(event) =>
          handleChange(event.target.value as ContentStatus)
        }
        className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-800 outline-none transition focus:border-zinc-400 disabled:cursor-wait disabled:opacity-60"
      >
        {STATUSES.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>

      {status === "SCHEDULED" && (
        <div className="mt-5 space-y-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
          <div>
            <label
              htmlFor="schedule-date"
              className="text-sm font-medium text-zinc-700"
            >
              Schedule date
            </label>

            <input
              id="schedule-date"
              type="date"
              value={scheduleDate}
              disabled={isPending}
              onChange={(event) =>
                setScheduleDate(event.target.value)
              }
              className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-800 outline-none focus:border-zinc-400 disabled:opacity-60"
            />
          </div>

          <div>
            <label
              htmlFor="schedule-time"
              className="text-sm font-medium text-zinc-700"
            >
              Schedule time
            </label>

            <input
              id="schedule-time"
              type="time"
              value={scheduleTime}
              disabled={isPending}
              onChange={(event) =>
                setScheduleTime(event.target.value)
              }
              className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-800 outline-none focus:border-zinc-400 disabled:opacity-60"
            />
          </div>

          <button
            type="button"
            disabled={
              isPending ||
              !scheduleDate ||
              !scheduleTime
            }
            onClick={handleSchedule}
            className="w-full rounded-xl bg-zinc-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "Saving..." : "Schedule Content"}
          </button>
        </div>
      )}
    </div>
  );
}
