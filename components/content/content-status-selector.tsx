"use client";

import { useTransition } from "react";
import { updateContentStatus } from "@/app/content/actions/update-content-status";

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
}

export default function ContentStatusSelector({
  id,
  status,
}: ContentStatusSelectorProps) {
  const [isPending, startTransition] = useTransition();

  function handleChange(nextStatus: ContentStatus) {
    startTransition(async () => {
      await updateContentStatus(id, nextStatus);
    });
  }

  return (
    <div>
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
        className="mt-2 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-800 outline-none transition focus:border-zinc-400 disabled:cursor-wait disabled:opacity-60"
      >
        {STATUSES.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
    </div>
  );
}
