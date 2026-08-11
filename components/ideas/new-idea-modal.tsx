"use client";

import { useState } from "react";
import NewIdeaForm from "./new-idea-form";

export default function NewIdeaModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
      >
        + New Idea
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-zinc-950">
                  Capture a new idea
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Get it out of your head and into your content pipeline.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-1 text-xl text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <NewIdeaForm onCreated={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
