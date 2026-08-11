import AppShell from "@/components/layout/app-shell";
import { prisma } from "@/lib/prisma";
import NewIdeaModal from "@/components/ideas/new-idea-modal";

export default async function IdeasPage() {
  const ideas = await prisma.idea.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <AppShell>
      <div className="min-h-screen">
        <header className="flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-8">
          <div>
            <p className="text-sm font-medium text-zinc-500">Workspace</p>
          </div>

          <NewIdeaModal />
        </header>

        <main className="px-8 py-10">
          <div className="max-w-5xl">
            <div>
              <p className="text-sm font-medium text-zinc-500">
                Idea Inbox
              </p>

              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">
                Ideas worth exploring.
              </h1>

              <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-500">
                Capture ideas before they disappear. Later, turn the strongest
                ones into real content.
              </p>
            </div>

            <div className="mt-10 space-y-4">
              {ideas.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center">
                  <p className="text-sm font-medium text-zinc-900">
                    No ideas yet.
                  </p>

                  <p className="mt-2 text-sm text-zinc-500">
                    Capture your first idea to start building your content
                    pipeline.
                  </p>
                </div>
              ) : (
                ideas.map((idea) => (
                  <article
                    key={idea.id}
                    className="rounded-2xl border border-zinc-200 bg-white p-6 transition hover:border-zinc-300"
                  >
                    <div className="flex items-start justify-between gap-6">
                      <div>
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

                        <h2 className="mt-3 text-lg font-semibold text-zinc-950">
                          {idea.title}
                        </h2>

                        {idea.description && (
                          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                            {idea.description}
                          </p>
                        )}
                      </div>

                      <a
                        href={`/ideas/${idea.id}`}
                        className="shrink-0 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-950"
                      >
                        Open
                      </a>
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    </AppShell>
  );
}
