"use client";

import { useState } from "react";
import { createIdea } from "@/app/ideas/actions/create-idea";

interface NewIdeaFormProps {
  onCreated: () => void;
}

export default function NewIdeaForm({ onCreated }: NewIdeaFormProps) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");

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
          className="mb-2 block text-sm font-medium text-zinc-900"
        >
          Idea title
        </label>

        <input
          id="title"
          name="title"
          required
          placeholder="What do you want to create?"
          className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-400"
        />
      </div>

      <div>
        <label
          htmlFor="description"
          className="mb-2 block text-sm font-medium text-zinc-900"
        >
          Description
        </label>

        <textarea
          id="description"
          name="description"
          rows={4}
          placeholder="Describe the idea..."
          className="w-full resize-none rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-400"
        />
      </div>

      <div>
        <label
          htmlFor="category"
          className="mb-2 block text-sm font-medium text-zinc-900"
        >
          Category
        </label>

        <input
          id="category"
          name="category"
          placeholder="AI, SaaS, YouTube..."
          className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-400"
        />
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-zinc-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Creating..." : "Create Idea"}
      </button>
    </form>
  );
}
