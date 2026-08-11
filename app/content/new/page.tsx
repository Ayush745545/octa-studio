"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import AppShell from "@/components/layout/app-shell";
import { createContent } from "@/app/content/actions/create-content";

function NewContentForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [title, setTitle] = useState(
    searchParams.get("title") || "AI Generated Content",
  );
  const [body, setBody] = useState(searchParams.get("body") || "");
  const [platform, setPlatform] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    if (!title.trim()) return;

    setIsSaving(true);

    try {
      const content = await createContent({
        title: title.trim(),
        body: body.trim(),
        platform: platform || null,
      });

      router.push(`/content/${content.id}`);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="flex h-14 items-center border-b border-zinc-200 px-7">
        <span className="text-sm font-medium text-zinc-500">
          Content Workspace
        </span>
      </header>

      <main className="mx-auto max-w-5xl px-7 py-12">
        <div className="max-w-3xl">
          <p className="text-sm text-zinc-400">AI Studio</p>

          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-zinc-950">
            Create your content
          </h1>

          <p className="mt-4 text-base leading-7 text-zinc-500">
            Review the AI result and save it as a ContentOS draft.
          </p>
        </div>

        <section className="mt-10 space-y-7">
          <div>
            <label className="text-sm font-medium text-zinc-700">
              Title
            </label>

            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-4 py-4 text-base font-medium text-zinc-950 outline-none focus:border-zinc-400"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-zinc-700">
              Content
            </label>

            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              className="mt-2 min-h-96 w-full resize-y rounded-xl border border-zinc-200 bg-white px-4 py-4 text-sm leading-7 text-zinc-800 outline-none focus:border-zinc-400"
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-zinc-700">
              Platform
            </label>

            <select
              value={platform}
              onChange={(event) => setPlatform(event.target.value)}
              className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-800 outline-none focus:border-zinc-400"
            >
              <option value="">Select platform</option>
              <option value="YouTube">YouTube</option>
              <option value="Instagram">Instagram</option>
              <option value="LinkedIn">LinkedIn</option>
              <option value="X">X</option>
              <option value="TikTok">TikTok</option>
              <option value="Blog">Blog</option>
            </select>
          </div>

          <div className="flex items-center justify-between border-t border-zinc-200 pt-6">
            <span className="text-sm text-zinc-400">
              Status: DRAFT
            </span>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !title.trim()}
              className="rounded-xl bg-zinc-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save Draft"}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default function NewContentPage() {
  return (
    <AppShell>
      <Suspense
        fallback={
          <div className="min-h-screen bg-white p-12 text-sm text-zinc-500">
            Loading content editor...
          </div>
        }
      >
        <NewContentForm />
      </Suspense>
    </AppShell>
  );
}
