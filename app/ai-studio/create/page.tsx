import { Suspense } from "react";
import { CreateWorkspace } from "@/components/ai-studio/create-workspace";

export default function AIStudioCreatePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#0a0a0c] text-sm text-zinc-500">
          Loading AI Creation…
        </div>
      }
    >
      <CreateWorkspace />
    </Suspense>
  );
}
