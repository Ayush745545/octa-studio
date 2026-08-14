"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { deleteContent } from "@/app/content/actions/delete-content";

interface DeleteContentButtonProps {
  id: string;
  status: string;
}

export default function DeleteContentButton({
  id,
  status,
}: DeleteContentButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (status === "PUBLISHED") {
    return null;
  }

  function handleDelete() {
    if (!window.confirm("Delete this content? This cannot be undone.")) {
      return;
    }

    startTransition(async () => {
      try {
        await deleteContent(id);
        router.push("/content");
        router.refresh();
      } catch (error) {
        window.alert(
          error instanceof Error ? error.message : "Failed to delete content.",
        );
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      className="rounded-xl border border-red-500/30 px-5 py-3 text-sm font-medium text-red-400 transition hover:bg-red-500/10 disabled:cursor-wait disabled:opacity-50"
    >
      {isPending ? "Deleting..." : "Delete Content"}
    </button>
  );
}
