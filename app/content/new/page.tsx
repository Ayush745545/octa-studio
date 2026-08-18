"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import WorkspaceLayout from "@/components/layout/workspace-layout";
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
    <div className="min-h-screen bg-[#0a0a0c]">
      <header className="flex h-16 items-center border-b border-zinc-800 bg-[#0a0a0c] px-4 sm:px-6 lg:px-8">
        <span className="text-sm font-medium text-zinc-500">Content Workspace</span>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-7">
        <div className="max-w-3xl">
          <p className="text-sm text-zinc-600">AI Studio</p>

          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white">Create your content</h1>

          <p className="mt-4 text-base leading-7 text-zinc-500">
            Review the AI result and save it as a octa-studio draft.
          </p>
        </div>

        <section className="mt-10 space-y-7">
          <div>
            <label className="text-sm font-medium text-zinc-700">Title</label>

            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="mt-2 w-full rounded-xl border border-zinc-800 bg-[#0a0a0c] px-4 py-4 text-base font-medium text-white outline-none transition focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-zinc-700">Content</label>

            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              className="mt-2 min-h-96 w-full resize-y rounded-xl border border-zinc-800 bg-[#0a0a0c] px-4 py-4 text-sm leading-7 text-white outline-none transition focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300 placeholder:text-zinc-400"
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-zinc-700">Platform</label>

            <select
              value={platform}
              onChange={(event) => setPlatform(event.target.value)}
              className="rounded-xl border border-zinc-800 bg-[#0a0a0c] px-4 py-3 text-sm text-white outline-none transition focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300"
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

          <div className="flex items-center justify-between border-t border-zinc-800 pt-6">
            <span className="text-sm text-zinc-600">Status: DRAFT</span>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !title.trim()}
              className="rounded-xl bg-[#7FFB50] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#7FFB50] disabled:cursor-not-allowed disabled:opacity-50"
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
    <WorkspaceLayout activeItem="content">
      <Suspense
        fallback={
          <div className="min-h-screen bg-[#0a0a0c] p-12 text-sm text-zinc-600">
            Loading content editor...
          </div>
        }
      >
        <NewContentForm />
      </Suspense>
    </WorkspaceLayout>
  );
}
