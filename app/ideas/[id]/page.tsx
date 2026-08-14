import Link from "next/link";
import { notFound } from "next/navigation";
import WorkspaceLayout from "@/components/layout/workspace-layout";
import { prisma } from "@/lib/prisma";
import TurnIntoContentButton from "@/components/ideas/turn-into-content-button";
import CategoryBadge from "@/components/ideas/category-badge";

export const dynamic = "force-dynamic";

interface IdeaDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function IdeaDetailPage({
  params,
}: IdeaDetailPageProps) {
  const { id } = await params;

  const idea = await prisma.idea.findUnique({
    where: {
      id,
    },
  });

  if (!idea) {
    notFound();
  }

  return (
    <WorkspaceLayout activeItem="ideas">
      <div className="min-h-screen bg-[#0a0a0c]">
        <header className="flex h-16 items-center border-b border-zinc-800 bg-[#0a0a0c] px-4 sm:px-6 lg:px-8">
          <Link
            href="/ideas"
            className="text-sm font-medium text-zinc-500 transition hover:text-white"
          >
            ← Back to Ideas
          </Link>
        </header>

        <main className="px-4 py-10 sm:px-6 lg:px-8">
          <div className="max-w-4xl">
            <div className="flex items-center gap-2">
              {idea.category && <CategoryBadge category={idea.category} />}

              <span className="text-xs text-zinc-500">{idea.status}</span>
            </div>

            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">{idea.title}</h1>

            <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-500">
              {idea.description || "No description added yet."}
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Status</p>

                <p className="mt-2 text-sm font-medium text-white">{idea.status}</p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Created</p>

                <p className="mt-2 text-sm font-medium text-white">
                  {idea.createdAt.toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="mt-10 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
              <p className="text-sm font-semibold text-white">Next step</p>

              <p className="mt-2 text-sm leading-6 text-zinc-500">
                Turn this idea into a piece of content and move it into the
                octa-studio pipeline.
              </p>

              <TurnIntoContentButton ideaId={idea.id} />
            </div>
          </div>
        </main>
      </div>
    </WorkspaceLayout>
  );
}
