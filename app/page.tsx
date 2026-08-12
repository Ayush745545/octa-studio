import Link from "next/link";

import AppShell from "@/components/layout/app-shell";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [
    ideasCount,
    totalContent,
    draftCount,
    readyCount,
    scheduledCount,
    publishedCount,
    upcomingContent,
    recentContent,
  ] = await Promise.all([
    prisma.idea.count(),
    prisma.content.count(),
    prisma.content.count({ where: { status: "DRAFT" } }),
    prisma.content.count({ where: { status: "READY" } }),
    prisma.content.count({ where: { status: "SCHEDULED" } }),
    prisma.content.count({ where: { status: "PUBLISHED" } }),

    prisma.content.findMany({
      where: {
        status: "SCHEDULED",
        scheduledAt: {
          not: null,
        },
      },
      orderBy: {
        scheduledAt: "asc",
      },
      take: 4,
    }),

    prisma.content.findMany({
      orderBy: {
        updatedAt: "desc",
      },
      take: 5,
    }),
  ]);

  const completionRate =
    totalContent > 0
      ? Math.round((publishedCount / totalContent) * 100)
      : 0;

  return (
    <AppShell>
      <div className="min-h-screen">
        <header className="flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-8">
          <div>
            <p className="text-sm font-medium text-zinc-500">
              Workspace
            </p>
          </div>

          <Link
            href="/content/new"
            className="rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
          >
            + New Content
          </Link>
        </header>

        <main className="mx-auto max-w-6xl px-8 py-10">
          <div>
            <p className="text-sm font-medium text-zinc-400">
              ContentOS
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">
              Your content operating system.
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
              Capture ideas, create content, schedule it, publish it,
              and understand your pipeline.
            </p>
          </div>

          {/* Stats */}
          <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              {
                label: "Ideas",
                value: ideasCount,
                href: "/ideas",
                description: "Ideas captured",
              },
              {
                label: "Total content",
                value: totalContent,
                href: "/content",
                description: "Content created",
              },
              {
                label: "Drafts",
                value: draftCount,
                href: "/content",
                description: "Still being edited",
              },
              {
                label: "Scheduled",
                value: scheduledCount,
                href: "/calendar",
                description: "Queued for publishing",
              },
              {
                label: "Published",
                value: publishedCount,
                href: "/analytics",
                description: "Published content",
              },
            ].map((stat) => (
              <Link
                key={stat.label}
                href={stat.href}
                className="group rounded-2xl border border-zinc-200 bg-white p-5 transition hover:border-zinc-300 hover:shadow-sm"
              >
                <p className="text-sm text-zinc-500">
                  {stat.label}
                </p>

                <p className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">
                  {stat.value}
                </p>

                <p className="mt-2 text-xs text-zinc-400">
                  {stat.description}
                </p>
              </Link>
            ))}
          </section>

          {/* Pipeline */}
          <section className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-zinc-950">
                    Content pipeline
                  </h2>

                  <p className="mt-1 text-xs text-zinc-400">
                    Where your content currently stands.
                  </p>
                </div>

                <Link
                  href="/analytics"
                  className="text-xs text-zinc-400 hover:text-zinc-950"
                >
                  Analytics →
                </Link>
              </div>

              <div className="mt-6 space-y-5">
                {[
                  { label: "Draft", value: draftCount },
                  { label: "Ready", value: readyCount },
                  { label: "Scheduled", value: scheduledCount },
                  { label: "Published", value: publishedCount },
                ].map((item) => {
                  const percentage =
                    totalContent > 0
                      ? Math.max(
                          (item.value / totalContent) * 100,
                          item.value > 0 ? 4 : 0,
                        )
                      : 0;

                  return (
                    <div key={item.label}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-zinc-600">
                          {item.label}
                        </span>

                        <span className="text-sm font-medium text-zinc-950">
                          {item.value}
                        </span>
                      </div>

                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-100">
                        <div
                          className="h-full rounded-full bg-zinc-950 transition-all"
                          style={{
                            width: `${percentage}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-zinc-950">
                    Workspace overview
                  </h2>

                  <p className="mt-1 text-xs text-zinc-400">
                    A quick look at your current workload.
                  </p>
                </div>
              </div>

              <div className="mt-5 divide-y divide-zinc-100">
                <div className="flex items-center justify-between py-4">
                  <span className="text-sm text-zinc-600">
                    Ideas captured
                  </span>

                  <span className="font-semibold text-zinc-950">
                    {ideasCount}
                  </span>
                </div>

                <div className="flex items-center justify-between py-4">
                  <span className="text-sm text-zinc-600">
                    Content created
                  </span>

                  <span className="font-semibold text-zinc-950">
                    {totalContent}
                  </span>
                </div>

                <div className="flex items-center justify-between py-4">
                  <span className="text-sm text-zinc-600">
                    Ready + scheduled
                  </span>

                  <span className="font-semibold text-zinc-950">
                    {readyCount + scheduledCount}
                  </span>
                </div>

                <div className="flex items-center justify-between py-4">
                  <span className="text-sm text-zinc-600">
                    Published
                  </span>

                  <span className="font-semibold text-zinc-950">
                    {publishedCount}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Lower dashboard */}
          <section className="mt-6 grid gap-6 lg:grid-cols-3">
            {/* Publishing rate */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <p className="text-sm font-semibold text-zinc-950">
                Publishing rate
              </p>

              <p className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950">
                {completionRate}%
              </p>

              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-zinc-100">
                <div
                  className="h-full rounded-full bg-zinc-950"
                  style={{
                    width: `${completionRate}%`,
                  }}
                />
              </div>

              <p className="mt-2 text-xs text-zinc-400">
                Published content / total content
              </p>
            </div>

            {/* Upcoming */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 lg:col-span-2">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-zinc-950">
                    Upcoming content
                  </h2>

                  <p className="mt-1 text-xs text-zinc-400">
                    Your next scheduled posts.
                  </p>
                </div>

                <Link
                  href="/calendar"
                  className="text-xs text-zinc-400 hover:text-zinc-950"
                >
                  View calendar →
                </Link>
              </div>

              <div className="mt-5 divide-y divide-zinc-100">
                {upcomingContent.length === 0 ? (
                  <div className="py-8 text-sm text-zinc-400">
                    Nothing scheduled yet.
                  </div>
                ) : (
                  upcomingContent.map((item) => (
                    <Link
                      key={item.id}
                      href={`/content/${item.id}`}
                      className="flex items-center justify-between gap-4 py-4 transition hover:bg-zinc-50"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-zinc-950">
                          {item.title}
                        </p>

                        <p className="mt-1 text-xs text-zinc-400">
                          {item.platform || "General"}
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-sm font-medium text-zinc-700">
                          {item.scheduledAt
                            ? new Intl.DateTimeFormat("en-US", {
                                month: "short",
                                day: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                              }).format(item.scheduledAt)
                            : ""}
                        </p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </section>

          {/* Recent content */}
          <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-sm font-semibold text-zinc-950">
                  Recent content
                </h2>

                <p className="mt-1 text-xs text-zinc-400">
                  Recently created or updated.
                </p>
              </div>

              <Link
                href="/content"
                className="text-xs text-zinc-400 hover:text-zinc-950"
              >
                View all →
              </Link>
            </div>

            <div className="mt-5 divide-y divide-zinc-100">
              {recentContent.map((item) => (
                <Link
                  key={item.id}
                  href={`/content/${item.id}`}
                  className="flex items-center justify-between gap-4 py-4 transition hover:bg-zinc-50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-950">
                      {item.title}
                    </p>

                    <p className="mt-1 text-xs text-zinc-400">
                      {item.platform || "General"}
                    </p>
                  </div>

                  <span className="shrink-0 rounded-full bg-zinc-100 px-3 py-1 text-[10px] font-medium text-zinc-500">
                    {item.status}
                  </span>
                </Link>
              ))}

              {recentContent.length === 0 && (
                <div className="py-8 text-sm text-zinc-400">
                  No content yet.
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    </AppShell>
  );
}
