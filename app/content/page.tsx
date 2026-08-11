import Link from "next/link";

import AppShell from "@/components/layout/app-shell";
import { prisma } from "@/lib/prisma";

export default async function ContentPage() {
  const contents = await prisma.content.findMany({
    orderBy: {
      updatedAt: "desc",
    },
    include: {
      idea: true,
    },
  });

  return (
    <AppShell>
      <div className="min-h-screen">
        <header className="flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-8">
          <div>
            <h1 className="text-sm font-semibold text-zinc-950">
              Content Library
            </h1>
          </div>

          <Link
            href="/ideas"
            className="rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
          >
            + New from Idea
          </Link>
        </header>

        <main className="px-8 py-10">
          <div className="mb-8">
            <p className="text-sm font-medium text-zinc-400">
              Your content workspace
            </p>

            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">
              Content
            </h2>

            <p className="mt-2 text-sm text-zinc-500">
              Manage every draft created from your ideas.
            </p>
          </div>

          {contents.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center">
              <h3 className="text-lg font-semibold text-zinc-950">
                No content yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
                Turn an idea into content and it will appear here.
              </p>

              <Link
                href="/ideas"
                className="mt-6 inline-flex rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800"
              >
                Go to Ideas
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {contents.map((content) => (
                <Link
                  key={content.id}
                  href={`/content/${content.id}`}
                  className="group block rounded-2xl border border-zinc-200 bg-white p-5 transition hover:border-zinc-300 hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-6">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600">
                          {content.status}
                        </span>

                        {content.platform && (
                          <span className="text-xs text-zinc-400">
                            {content.platform}
                          </span>
                        )}
                      </div>

                      <h3 className="mt-3 truncate text-base font-semibold text-zinc-950">
                        {content.title}
                      </h3>

                      <p className="mt-1 line-clamp-2 text-sm leading-6 text-zinc-500">
                        {content.body || "No content written yet."}
                      </p>

                      {content.idea && (
                        <p className="mt-3 text-xs text-zinc-400">
                          From idea: {content.idea.title}
                        </p>
                      )}
                    </div>

                    <span className="shrink-0 pt-1 text-sm font-medium text-zinc-400 transition group-hover:text-zinc-950">
                      Open →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>
    </AppShell>
  );
}
