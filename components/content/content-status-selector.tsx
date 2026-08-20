"use client";

import { useState, useTransition } from "react";
import { updateContentStatus } from "@/app/content/actions/update-content-status";
import { scheduleContent } from "@/app/content/actions/schedule-content";

const STATUSES = ["DRAFT", "READY"] as const;

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
  const [scheduleDate, setScheduleDate] = useState(
    scheduledAt ? new Date(scheduledAt).toISOString().slice(0, 10) : "",
  );
  const [scheduleTime, setScheduleTime] = useState(
    scheduledAt
      ? new Date(scheduledAt).toISOString().slice(11, 16)
      : "",
  );
  const [error, setError] = useState("");

  if (status === "PUBLISHED") {
    return (
      <div className="max-w-md rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3">
        <p className="text-xs font-medium text-zinc-600">Status</p>
        <p className="mt-1 text-sm font-medium text-white">
          Published
        </p>
      </div>
    );
  }

  function handleChange(nextStatus: ContentStatus) {
    setError("");

    startTransition(async () => {
      try {
        await updateContentStatus(id, nextStatus);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to update status.",
        );
      }
    });
  }

  function handleSchedule() {
    setError("");

    if (!scheduleDate || !scheduleTime) {
      setError("Choose a date and time.");
      return;
    }

    const scheduled = `${scheduleDate}T${scheduleTime}:00+05:30`;
    const date = new Date(scheduled);

    if (Number.isNaN(date.getTime())) {
      setError("Invalid schedule date.");
      return;
    }

    if (date <= new Date()) {
      setError("Choose a future date and time.");
      return;
    }

    startTransition(async () => {
      try {
        await scheduleContent(id, scheduled);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to schedule content.",
        );
      }
    });
  }

  return (
    <div className="max-w-md">
      <label
        htmlFor="content-status"
        className="text-sm font-medium text-zinc-300"
      >
        Status<span className="ml-0.5 text-red-400/90">*</span>
      </label>

      <select
        id="content-status"
        value={status}
        disabled={isPending}
        onChange={(event) =>
          handleChange(event.target.value as ContentStatus)
        }
        className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm font-medium text-white outline-none transition focus:border-[#7FFB50] focus:ring-1 focus:ring-[#7FFB50]/30 disabled:cursor-wait disabled:opacity-60"
      >
        {STATUSES.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>

      <div className="mt-5 space-y-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
        <div>
          <p className="text-sm font-medium text-white">
            Schedule content
          </p>

          <p className="mt-1 text-xs text-zinc-400">
            Choose when this content should be published.
          </p>
        </div>

        <div>
          <label
            htmlFor="schedule-date"
            className="text-sm font-medium text-zinc-300"
          >
            Schedule date
          </label>

          <input
            id="schedule-date"
            type="date"
            value={scheduleDate}
            disabled={isPending}
            onChange={(event) => setScheduleDate(event.target.value)}
            className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none focus:border-[#7FFB50] focus:ring-1 focus:ring-[#7FFB50]/30 disabled:opacity-60"
          />
        </div>

        <div>
          <label
            htmlFor="schedule-time"
            className="text-sm font-medium text-zinc-300"
          >
            Schedule time
          </label>

          <input
            id="schedule-time"
            type="time"
            value={scheduleTime}
            disabled={isPending}
            onChange={(event) => setScheduleTime(event.target.value)}
            className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none focus:border-[#7FFB50] focus:ring-1 focus:ring-[#7FFB50]/30 disabled:opacity-60"
          />
        </div>

        {error && (
          <p className="text-xs font-medium text-red-400">
            {error}
          </p>
        )}

        <button
          type="button"
          disabled={isPending || !scheduleDate || !scheduleTime}
          onClick={handleSchedule}
          className="w-full rounded-xl bg-[#7FFB50] px-4 py-3 text-sm font-semibold text-[#0a0a0c] transition hover:bg-[#7FFB50]/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Scheduling..." : "Schedule Content"}
        </button>
      </div>
    </div>
  );
}
