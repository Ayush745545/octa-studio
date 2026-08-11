import Link from "next/link";
import { notFound } from "next/navigation";
import AppShell from "@/components/layout/app-shell";
import { prisma } from "@/lib/prisma";
import TurnIntoContentButton from "@/components/ideas/turn-into-content-button";

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
    <AppShell>
      <div className="min-h-screen">
        <header className="flex h-16 items-center border-b border-zinc-200 bg-white px-8">
          <Link
            href="/ideas"
            className="text-sm font-medium text-zinc-500 transition hover:text-zinc-950"
          >
            ← Back to Ideas
          </Link>
        </header>

        <main className="px-8 py-10">
          <div className="max-w-4xl">
            <div className="flex items-center gap-2">
              {idea.category && (
                <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600">
                  {idea.category}
                </span>
              )}

              <span className="text-xs text-zinc-400">
                {idea.status}
              </span>
            </div>

            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-zinc-950">
              {idea.title}
            </h1>

            <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-500">
              {idea.description || "No description added yet."}
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-zinc-200 bg-white p-5">
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Status
                </p>

                <p className="mt-2 text-sm font-medium text-zinc-950">
                  {idea.status}
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-5">
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Created
                </p>

                <p className="mt-2 text-sm font-medium text-zinc-950">
                  {idea.createdAt.toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="mt-10 rounded-2xl border border-zinc-200 bg-white p-6">
              <p className="text-sm font-semibold text-zinc-950">
                Next step
              </p>

              <p className="mt-2 text-sm leading-6 text-zinc-500">
                Turn this idea into a piece of content and move it into the
                ContentOS pipeline.
              </p>

              <TurnIntoContentButton ideaId={idea.id} />
            </div>
          </div>
        </main>
      </div>
    </AppShell>
  );
}
