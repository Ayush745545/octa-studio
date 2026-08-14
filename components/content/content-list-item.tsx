"use client";

import Link from "next/link";
import { useTransition } from "react";

import { deleteContent } from "@/app/content/actions/delete-content";

interface ContentListItemProps {
  id: string;
  title: string;
  body: string | null;
  status: string;
  platform: string | null;
  ideaTitle: string | null;
}

export default function ContentListItem({
  id,
  title,
  body,
  status,
  platform,
  ideaTitle,
}: ContentListItemProps) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!window.confirm("Delete this content? This cannot be undone.")) {
      return;
    }

    startTransition(async () => {
      try {
        await deleteContent(id);
      } catch (error) {
        window.alert(
          error instanceof Error ? error.message : "Failed to delete content.",
        );
      }
    });
  }

  return (
    <div className="group relative rounded-2xl border border-zinc-800 bg-zinc-950 p-5 transition hover:border-zinc-300 hover:bg-zinc-900">
      <Link href={`/content/${id}`} className="absolute inset-0 rounded-2xl" />

      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-500">
              {status}
            </span>

            {platform && (
              <span className="text-xs text-zinc-500">{platform}</span>
            )}
          </div>

          <h3 className="mt-3 truncate text-base font-semibold text-white">{title}</h3>

          <p className="mt-1 line-clamp-2 text-sm leading-6 text-zinc-500">
            {body || "No content written yet."}
          </p>

          {ideaTitle && (
            <p className="mt-3 text-xs text-zinc-500">From idea: {ideaTitle}</p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-3 pt-1">
          {status !== "PUBLISHED" && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              title="Delete content"
              className="relative z-10 inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-red-500/10 hover:text-red-400 disabled:cursor-wait disabled:opacity-50"
            >
              {isPending ? (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14zM10 11v6M14 11v6" />
                </svg>
              )}
            </button>
          )}

          <span className="text-sm font-medium text-zinc-500 transition group-hover:text-white">
            Open →
          </span>
        </div>
      </div>
    </div>
  );
}
