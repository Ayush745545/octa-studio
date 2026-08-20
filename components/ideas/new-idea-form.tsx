"use client";

import { useState } from "react";
import { createIdea } from "@/app/ideas/actions/create-idea";

const CATEGORY_OPTIONS = [
  "Creative",
  "Design",
  "Photography",
  "Video",
  "Music",
  "Writing",
  "AI",
  "Tech",
  "Lifestyle",
  "Business",
];

interface NewIdeaFormProps {
  onCreated: () => void;
}

export default function NewIdeaForm({ onCreated }: NewIdeaFormProps) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");
  const [category, setCategory] = useState("");

  async function handleSubmit(formData: FormData) {
    setIsPending(true);
    setError("");

    try {
      const result = await createIdea(formData);

      if (!result.success) {
        setError(result.error ?? "Something went wrong.");
        return;
      }

      onCreated();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      <div>
        <label
          htmlFor="title"
          className="mb-2 block text-sm font-medium text-zinc-300"
        >
          Idea title
        </label>

        <input
          id="title"
          name="title"
          required
          placeholder="What do you want to create?"
          className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-[#7FFB50] focus:ring-1 focus:ring-[#7FFB50]/30"
        />
      </div>

      <div>
        <label
          htmlFor="description"
          className="mb-2 block text-sm font-medium text-zinc-300"
        >
          Description
        </label>

        <textarea
          id="description"
          name="description"
          rows={4}
          placeholder="Describe the idea..."
          className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-[#7FFB50] focus:ring-1 focus:ring-[#7FFB50]/30"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-300">
          Category
        </label>

        <input type="hidden" name="category" value={category} />

        <div className="flex flex-wrap gap-2">
          {CATEGORY_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setCategory((current) => (current === option ? "" : option))}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                category === option
                  ? "border-[#7FFB50] bg-[#7FFB50]/10 text-[#7FFB50]"
                  : "border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-white"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-[#7FFB50] px-4 py-3 text-sm font-semibold text-[#0a0a0c] transition hover:bg-[#7FFB50]/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Creating..." : "Create Idea"}
      </button>
    </form>
  );
}
