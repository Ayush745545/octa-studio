"use client";

import { useTransition } from "react";
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
    startTransition(async () => {
      await publishContent(id);
    });
  }

  return (
    <button
      type="button"
      onClick={handlePublish}
      disabled={isPending}
      className="rounded-xl bg-zinc-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-wait disabled:opacity-50"
    >
      {isPending ? "Publishing..." : "Publish"}
    </button>
  );
}
