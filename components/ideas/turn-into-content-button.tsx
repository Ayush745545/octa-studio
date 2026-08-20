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
      className="mt-5 rounded-lg bg-[#7FFB50] px-4 py-2.5 text-sm font-semibold text-[#0a0a0c] transition hover:bg-[#7FFB50]/90 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isPending ? "Creating..." : "Turn into Content"}
    </button>
  );
}
