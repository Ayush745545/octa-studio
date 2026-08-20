"use client";

import { useState, useTransition, useEffect } from "react";
import { publishContent } from "@/app/content/actions/publish-content";

interface PublishButtonProps {
  id: string;
  status: string;
}

interface Toast {
  id: number;
  type: "success" | "error";
  message: string;
}

let toastId = 0;

export default function PublishButton({
  id,
  status,
}: PublishButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => {
      setToasts((prev) => prev.slice(1));
    }, 5000);
    return () => clearTimeout(timer);
  }, [toasts]);

  if (status === "PUBLISHED") {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-500">
        Published
      </div>
    );
  }

  if (status !== "READY") {
    return null;
  }

  function handlePublish() {
    setError("");

    startTransition(async () => {
      try {
        await publishContent(id);
        const tid = ++toastId;
        setToasts((prev) => [
          ...prev,
          { id: tid, type: "success", message: "Content published successfully" },
        ]);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to publish content.";
        setError(message);
        const tid = ++toastId;
        setToasts((prev) => [
          ...prev,
          { id: tid, type: "error", message },
        ]);
      }
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={handlePublish}
        disabled={isPending}
        className="rounded-xl bg-[#7FFB50] px-5 py-3 text-sm font-semibold text-[#0a0a0c] transition hover:bg-[#7FFB50]/90 disabled:cursor-wait disabled:opacity-50"
      >
        {isPending ? "Publishing..." : "Publish"}
      </button>

      {error && (
        <p className="mt-3 text-xs font-medium text-red-400">
          {error}
        </p>
      )}

      {toasts.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg transition ${
                toast.type === "success"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                  : "border-red-500/30 bg-red-500/10 text-red-300"
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">
                  {toast.type === "success" ? "Published" : "Failed"}
                </p>
                <p className="mt-0.5 text-xs opacity-75">
                  {toast.message}
                </p>
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
