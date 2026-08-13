"use client";

import { useState, useTransition } from "react";
import { schedulePublication } from "@/app/publishing/actions/schedule-publication";
import { cancelPublication } from "@/app/publishing/actions/cancel-publication";

interface PublicationScheduleControlsProps {
  publicationId: string;
  status: string;
  scheduledAt: Date | string | null;
}

export default function PublicationScheduleControls({
  publicationId,
  status,
  scheduledAt,
}: PublicationScheduleControlsProps) {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  const initialValue = scheduledAt
    ? new Date(scheduledAt).toLocaleString("sv-SE", {
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }).replace(" ", "T").slice(0, 16)
    : "";

  const [value, setValue] = useState(initialValue);

  function schedule() {
    setError("");

    if (!value) {
      setError("Choose a date and time.");
      return;
    }

    const [datePart, timePart] = value.split("T");

    if (!datePart || !timePart) {
      setError("Invalid date.");
      return;
    }

    // datetime-local represents the user's local time.
    // Convert that local time to an absolute UTC timestamp.
    const localDate = new Date(`${datePart}T${timePart}:00`);

    if (Number.isNaN(localDate.getTime())) {
      setError("Invalid date.");
      return;
    }

    if (localDate <= new Date()) {
      setError("Choose a future date and time.");
      return;
    }

    const utcISOString = localDate.toISOString();

    startTransition(async () => {
      try {
        await schedulePublication(publicationId, utcISOString);
        setOpen(false);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to schedule publication.",
        );
      }
    });
  }

  function cancel() {
    setError("");

    startTransition(async () => {
      try {
        await cancelPublication(publicationId);
        setOpen(false);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to cancel publication.",
        );
      }
    });
  }

  if (status === "PUBLISHED") {
    return (
      <span className="text-xs text-zinc-400">
        Published
      </span>
    );
  }

  return (
    <div className="relative flex items-center gap-2">
      {status === "SCHEDULED" ? (
        <>
          <button
            type="button"
            disabled={isPending}
            onClick={() => setOpen((current) => !current)}
            className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-950 disabled:opacity-50"
          >
            {isPending ? "Saving..." : "Reschedule"}
          </button>

          <button
            type="button"
            disabled={isPending}
            onClick={cancel}
            className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-500 transition hover:border-red-200 hover:text-red-600 disabled:opacity-50"
          >
            Cancel
          </button>
        </>
      ) : (
        <button
          type="button"
          disabled={isPending}
          onClick={() => setOpen((current) => !current)}
          className="rounded-lg bg-zinc-950 px-3 py-2 text-xs font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50"
        >
          Schedule
        </button>
      )}

      {open && (
        <div className="absolute right-0 top-full z-20 mt-2 w-72 rounded-xl border border-zinc-200 bg-white p-4 shadow-lg">
          <p className="text-sm font-medium text-zinc-900">
            {status === "SCHEDULED"
              ? "Reschedule publication"
              : "Schedule publication"}
          </p>

          <p className="mt-1 text-xs text-zinc-400">
            Choose when this publication should go out.
          </p>

          <input
            type="datetime-local"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            className="mt-4 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
          />

          {error && (
            <p className="mt-2 text-xs font-medium text-red-600">
              {error}
            </p>
          )}

          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2 text-xs font-medium text-zinc-500 hover:text-zinc-900"
            >
              Close
            </button>

            <button
              type="button"
              disabled={isPending}
              onClick={schedule}
              className="rounded-lg bg-zinc-950 px-3 py-2 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              {isPending ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
