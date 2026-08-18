"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, useEffect } from "react";

interface ContentScheduleControlsProps {
  contentId: string;
  status: string;
  scheduledAt: Date | string | null;
  onConnectHref?: string;
}

export default function ContentScheduleControls({
  contentId,
  status,
  scheduledAt,
  onConnectHref = "/publishing",
}: ContentScheduleControlsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  const initialValue = scheduledAt
    ? new Date(scheduledAt).toLocaleString("sv-SE", {
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }).replace(" ", "T").slice(0, 16)
    : "";

  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  function reschedule() {
    setError("");
    if (!value) {
      setError("Choose a date and time.");
      return;
    }
    const localDate = new Date(`${value}:00`);
    if (Number.isNaN(localDate.getTime())) {
      setError("Invalid date.");
      return;
    }
    if (localDate <= new Date()) {
      setError("Choose a future date and time.");
      return;
    }
    startTransition(async () => {
      try {
        const res = await fetch(
          `/api/creator-studio/content/${contentId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ scheduledAt: localDate.toISOString() }),
          },
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to reschedule.");
        setOpen(false);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to reschedule.");
      }
    });
  }

  function cancel() {
    setError("");
    if (
      !window.confirm(
        "Cancel this scheduled post? It will be returned to Creator Studio as unscheduled.",
      )
    )
      return;
    startTransition(async () => {
      try {
        const res = await fetch(
          `/api/creator-studio/content/${contentId}/cancel`,
          { method: "POST" },
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to cancel.");
        setOpen(false);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to cancel.");
      }
    });
  }

  if (status === "PUBLISHED") {
    return <span className="text-xs text-zinc-400">Published</span>;
  }

  return (
    <div className="relative flex items-center gap-2">
      {status === "SCHEDULED" ? (
        <>
          <button
            type="button"
            disabled={isPending}
            onClick={() => setOpen((c) => !c)}
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
        <a
          href={onConnectHref}
          className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-950"
        >
          Connect channel
        </a>
      )}

      {open && (
        <div className="absolute right-0 top-full z-20 mt-2 w-72 rounded-xl border border-zinc-200 bg-white p-4 shadow-lg">
          <p className="text-sm font-medium text-zinc-900">Reschedule post</p>
          <p className="mt-1 text-xs text-zinc-400">
            Choose when this post should go out.
          </p>
          <input
            type="datetime-local"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="mt-4 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
          />
          {error && (
            <p className="mt-2 text-xs font-medium text-red-600">{error}</p>
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
              onClick={reschedule}
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
