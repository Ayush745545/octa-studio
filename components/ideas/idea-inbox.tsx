"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import NewIdeaForm from "./new-idea-form";

export default function IdeaInbox({ count }: { count: number }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="idea-folder idea-folder--lg"
        aria-label="New idea"
        title="New idea"
      >
        <span className="idea-folder__shape">
          <span className="idea-folder__back" />
          <span className="idea-folder__papers">
            <span className="idea-paper idea-paper--1" />
            <span className="idea-paper idea-paper--2" />
            <span className="idea-paper idea-paper--3" />
          </span>
          <span className="idea-folder__front" />
        </span>
        <span className="idea-folder__meta">
          <span className="idea-folder__title">Idea Inbox</span>
          <span className="idea-folder__count">
            {count} {count === 1 ? "idea" : "ideas"}
          </span>
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-[#0c0c0f] p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#7FFB50]" />
                    <h2 className="text-xl font-semibold text-white">
                      Capture a new idea
                    </h2>
                  </div>

                  <p className="mt-1 text-sm text-zinc-500">
                    Get it out of your head and into your content pipeline.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-2 py-1 text-xl text-zinc-500 transition hover:bg-white/5 hover:text-white"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              <NewIdeaForm onCreated={() => setOpen(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
