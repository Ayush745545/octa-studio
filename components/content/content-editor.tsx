"use client";

import { useState, useTransition } from "react";
import { updateContent } from "@/app/content/actions/update-content";

interface ContentEditorProps {
  id: string;
  initialTitle: string;
  initialBody: string;
  initialPlatform: string;
}

export default function ContentEditor({
  id,
  initialTitle,
  initialBody,
  initialPlatform,
}: ContentEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);
  const [platform, setPlatform] = useState(initialPlatform);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      await updateContent({
        id,
        title,
        body,
        platform,
      });
    });
  }

  return (
    <div className="space-y-8">
      <div>
        <label
          htmlFor="content-title"
          className="text-sm font-medium text-zinc-700"
        >
          Title
        </label>

        <input
          id="content-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-2xl font-semibold tracking-tight text-zinc-950 outline-none transition focus:border-zinc-400"
          placeholder="Give your content a title..."
        />
      </div>

      <div>
        <label
          htmlFor="content-body"
          className="text-sm font-medium text-zinc-700"
        >
          Content
        </label>

        <textarea
          id="content-body"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          className="mt-2 min-h-[420px] w-full resize-y rounded-xl border border-zinc-200 bg-white px-4 py-4 text-base leading-7 text-zinc-800 outline-none transition focus:border-zinc-400"
          placeholder="Start writing your content..."
        />
      </div>

      <div>
        <label
          htmlFor="content-platform"
          className="text-sm font-medium text-zinc-700"
        >
          Platform
        </label>

        <select
          id="content-platform"
          value={platform}
          onChange={(event) => setPlatform(event.target.value)}
          className="mt-2 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-800 outline-none focus:border-zinc-400"
        >
          <option value="">Select platform</option>
          <option value="YouTube">YouTube</option>
          <option value="Instagram">Instagram</option>
          <option value="LinkedIn">LinkedIn</option>
          <option value="X">X</option>
          <option value="Newsletter">Newsletter</option>
          <option value="Blog">Blog</option>
        </select>
      </div>

      <div className="flex items-center justify-between border-t border-zinc-200 pt-6">
        <span className="text-sm text-zinc-400">
          {isPending ? "Saving..." : "Draft"}
        </span>

        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="rounded-lg bg-zinc-950 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Save Draft"}
        </button>
      </div>
    </div>
  );
}
