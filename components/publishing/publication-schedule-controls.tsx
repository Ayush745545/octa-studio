"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { schedulePublication } from "@/app/publishing/actions/schedule-publication";
import { cancelPublication } from "@/app/publishing/actions/cancel-publication";
import { publishNow } from "@/app/publishing/actions/publish-now";

interface PublicationScheduleControlsProps {
  publicationId: string;
  status: string;
  scheduledAt: Date | string | null;
}

interface Toast {
  id: number;
  type: "success" | "error";
  message: string;
  executionTimeMs: number | null;
}

let toastId = 0;

export default function PublicationScheduleControls({
  publicationId,
  status,
  scheduledAt,
}: PublicationScheduleControlsProps) {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback(
    (type: "success" | "error", message: string, executionTimeMs: number | null) => {
      const id = ++toastId;
      setToasts((prev) => [...prev, { id, type, message, executionTimeMs }]);
    },
    [],
  );

  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => {
      setToasts((prev) => prev.slice(1));
    }, 5000);
    return () => clearTimeout(timer);
  }, [toasts]);

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

  function handlePublishNow() {
    setError("");

    startTransition(async () => {
      const result = await publishNow(publicationId);

      if (result.success) {
        addToast(
          "success",
          "Published successfully",
          result.executionTimeMs,
        );
      } else {
        addToast(
          "error",
          result.error ?? "Publishing failed.",
          result.executionTimeMs,
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
      ) : status === "QUEUED" ? (
        <>
          <button
            type="button"
            disabled={isPending}
            onClick={handlePublishNow}
            className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            {isPending ? "Publishing..." : "Publish now"}
          </button>

          <button
            type="button"
            disabled={isPending}
            onClick={() => setOpen((current) => !current)}
            className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-950 disabled:opacity-50"
          >
            Schedule
          </button>
        </>
      ) : status === "FAILED" ? (
        <button
          type="button"
          disabled={isPending}
          onClick={handlePublishNow}
          className="rounded-lg bg-amber-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-amber-700 disabled:opacity-50"
        >
          {isPending ? "Retrying..." : "Retry"}
        </button>
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

      {toasts.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg transition ${
                toast.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                  : "border-red-200 bg-red-50 text-red-900"
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">
                  {toast.type === "success" ? "Published" : "Failed"}
                </p>
                <p className="mt-0.5 text-xs opacity-75">
                  {toast.message}
                </p>
                {toast.executionTimeMs != null && (
                  <p className="mt-1 text-[10px] opacity-50">
                    {(toast.executionTimeMs / 1000).toFixed(1)}s
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() =>
                  setToasts((prev) =>
                    prev.filter((t) => t.id !== toast.id),
                  )
                }
                className="mt-0.5 text-xs opacity-50 hover:opacity-100"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
