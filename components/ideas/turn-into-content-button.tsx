"use client";

import { useTransition } from "react";
import { createContentFromIdea } from "@/app/content/actions/create-content-from-idea";

interface TurnIntoContentButtonProps {
  ideaId: string;
}

export default function TurnIntoContentButton({
  ideaId,
}: TurnIntoContentButtonProps) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      await createContentFromIdea(ideaId);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="mt-5 rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isPending ? "Creating..." : "Turn into Content"}
    </button>
  );
}
