"use client";

import { useState, useTransition } from "react";
import { publishContent } from "@/app/content/actions/publish-content";

interface PublishButtonProps {
  id: string;
  status: string;
}

export default function PublishButton({
  id,
  status,
}: PublishButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  if (status === "PUBLISHED") {
    return (
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
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
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to publish content.",
        );
      }
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={handlePublish}
        disabled={isPending}
        className="rounded-xl bg-zinc-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-wait disabled:opacity-50"
      >
        {isPending ? "Publishing..." : "Publish"}
      </button>

      {error && (
        <p className="mt-3 text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
