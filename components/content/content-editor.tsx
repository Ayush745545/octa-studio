"use client";

import { useState, useTransition } from "react";
import { updateContent } from "@/app/content/actions/update-content";

interface ContentEditorProps {
  id: string;
  initialTitle: string;
  initialBody: string;
  initialPlatform: string;
}

const aiActions = [
  {
    label: "Improve",
    instruction: "Improve this content while keeping the original meaning. Make it clearer, more engaging, natural, and professional.",
  },
  {
    label: "Rewrite",
    instruction: "Rewrite this content from scratch while preserving the core message. Make it fresh, natural, and engaging.",
  },
  {
    label: "Shorten",
    instruction: "Shorten this content significantly while keeping the most important information and message.",
  },
  {
    label: "Expand",
    instruction: "Expand this content with useful detail, examples, and stronger explanations. Do not add meaningless filler.",
  },
  {
    label: "Fix Grammar",
    instruction: "Fix grammar, spelling, punctuation, awkward wording, and sentence structure. Keep the original meaning and tone.",
  },
  {
    label: "Make Engaging",
    instruction: "Make this content more engaging and attention-grabbing. Improve the opening, flow, clarity, and readability.",
  },
];

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
  const [aiAction, setAiAction] = useState<string | null>(null);
  const [aiError, setAiError] = useState("");

  async function handleAI(instruction: string, label: string) {
    if (!body.trim()) {
      setAiError("Write some content first.");
      return;
    }

    setAiAction(label);
    setAiError("");

    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: `${instruction}

Platform: ${platform || "General"}

Content:
${body}

Return only the improved content. Do not explain what you changed.`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "AI generation failed.");
      }

      if (!data.result?.trim()) {
        throw new Error("AI returned an empty result.");
      }

      setBody(data.result.trim());
    } catch (error) {
      setAiError(
        error instanceof Error
          ? error.message
          : "Something went wrong with the AI.",
      );
    } finally {
      setAiAction(null);
    }
  }

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
        <div className="flex items-center justify-between">
          <label
            htmlFor="content-body"
            className="text-sm font-medium text-zinc-700"
          >
            Content
          </label>

          <span className="text-xs text-zinc-400">
            {body.length} characters
          </span>
        </div>

        <textarea
          id="content-body"
          value={body}
          onChange={(event) => {
            setBody(event.target.value);
            setAiError("");
          }}
          className="mt-2 min-h-[420px] w-full resize-y rounded-xl border border-zinc-200 bg-white px-4 py-4 text-base leading-7 text-zinc-800 outline-none transition focus:border-zinc-400"
          placeholder="Start writing your content..."
        />
      </div>

      {/* AI Editor */}
      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-950">
              AI Editor
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Improve your draft with AI.
            </p>
          </div>

          {aiAction && (
            <span className="text-xs text-zinc-500">
              AI is {aiAction.toLowerCase()}ing...
            </span>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {aiActions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={() => handleAI(action.instruction, action.label)}
              disabled={!!aiAction || !body.trim()}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 transition hover:border-zinc-400 hover:text-zinc-950 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {aiAction === action.label ? "Working..." : action.label}
            </button>
          ))}
        </div>

        {aiError && (
          <p className="mt-3 text-xs text-red-600">
            {aiError}
          </p>
        )}
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
          disabled={isPending || !!aiAction}
          className="rounded-lg bg-zinc-950 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Save Draft"}
        </button>
      </div>
    </div>
  );
}
