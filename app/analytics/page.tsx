import Link from "next/link";

import AppShell from "@/components/layout/app-shell";
import { prisma } from "@/lib/prisma";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export default async function AnalyticsPage() {
  const now = new Date();

  const [
    totalContent,
    draftCount,
    readyCount,
    scheduledCount,
    publishedCount,
    ideaCount,
    upcomingContent,
    recentContent,
    allContent,
    publishedLast7Days,
    recentActivity,
  ] = await Promise.all([
    prisma.content.count(),

    prisma.content.count({
      where: { status: "DRAFT" },
    }),

    prisma.content.count({
      where: { status: "READY" },
    }),

    prisma.content.count({
      where: {
        status: "SCHEDULED",
        scheduledAt: { not: null },
      },
    }),

    prisma.content.count({
      where: { status: "PUBLISHED" },
    }),

    prisma.idea.count(),

    prisma.content.findMany({
      where: {
        status: "SCHEDULED",
        scheduledAt: {
          not: null,
          gte: now,
        },
      },
      orderBy: {
        scheduledAt: "asc",
      },
      take: 5,
    }),

    prisma.content.findMany({
      orderBy: {
        updatedAt: "desc",
      },
      take: 6,
    }),

    prisma.content.findMany({
      select: {
        platform: true,
      },
    }),

    prisma.content.count({
      where: {
        status: "PUBLISHED",
        publishedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    }),

    prisma.content.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        },
      },
      select: {
        createdAt: true,
        publishedAt: true,
      },
    }),
  ]);

  const activityDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));

    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const created = recentActivity.filter((content) => {
      return content.createdAt >= date && content.createdAt < nextDate;
    }).length;

    const published = recentActivity.filter((content) => {
      return (
        content.publishedAt &&
        content.publishedAt >= date &&
        content.publishedAt < nextDate
      );
    }).length;

    return {
      date,
      created,
      published,
      label: new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Kolkata",
        weekday: "short",
      }).format(date),
    };
  });

  const maxActivityCount = Math.max(
    ...activityDays.flatMap((day) => [day.created, day.published]),
    1,
  );

  const platformCounts = new Map<string, number>();

  for (const content of allContent) {
    const platform = content.platform?.trim() || "General";
    platformCounts.set(
      platform,
      (platformCounts.get(platform) ?? 0) + 1,
    );
  }

  const platforms = Array.from(platformCounts.entries()).sort(
    (a, b) => b[1] - a[1],
  );

  const maxPlatformCount = Math.max(
    ...platforms.map(([, count]) => count),
    1,
  );

  const stats = [
    {
      label: "Total content",
      value: totalContent,
      description: "All content in your workspace",
    },
    {
      label: "Drafts",
      value: draftCount,
      description: "Content still being edited",
    },
    {
      label: "Ready",
      value: readyCount,
      description: "Ready to publish",
    },
    {
      label: "Scheduled",
      value: scheduledCount,
      description: "Queued for publishing",
    },
    {
      label: "Published",
      value: publishedCount,
      description: "Published content",
    },
  ];

  return (
    <AppShell>
      <div className="min-h-screen">
        <header className="flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-8">
          <div>
            <p className="text-sm font-medium text-zinc-500">
              Content Analytics
            </p>
          </div>

          <span className="text-xs text-zinc-400">
            {totalContent} content items
          </span>
        </header>

        <main className="px-8 py-10">
          <div className="mx-auto max-w-6xl">
            <div>
              <p className="text-sm font-medium text-zinc-400">
                Workspace intelligence
              </p>

              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">
                Analytics
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                Understand what is being created, what is ready, and what is
                coming next.
              </p>
            </div>

            {/* Stats */}
            <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-zinc-200 bg-white p-5"
                >
                  <p className="text-sm text-zinc-500">{stat.label}</p>

                  <p className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950">
                    {stat.value}
                  </p>

                  <p className="mt-2 text-xs leading-5 text-zinc-400">
                    {stat.description}
                  </p>
                </div>
              ))}
            </section>

            {/* Main analytics */}
            <section className="mt-6 grid gap-6 lg:grid-cols-2">
              {/* Platforms */}
              <div className="rounded-2xl border border-zinc-200 bg-white p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-zinc-950">
                      Content by platform
                    </h2>

                    <p className="mt-1 text-xs text-zinc-400">
                      Where your content is being created.
                    </p>
                  </div>

                  <span className="text-xs text-zinc-400">
                    {platforms.length} platforms
                  </span>
                </div>

                <div className="mt-8 space-y-5">
                  {platforms.length === 0 ? (
                    <p className="text-sm text-zinc-400">
                      No content yet.
                    </p>
                  ) : (
                    platforms.map(([platform, count]) => (
                      <div key={platform}>
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-sm font-medium text-zinc-700">
                            {platform}
                          </span>

                          <span className="text-xs text-zinc-400">
                            {count}
                          </span>
                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                          <div
                            className="h-full rounded-full bg-zinc-950 transition-all"
                            style={{
                              width: `${(count / maxPlatformCount) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Workspace overview */}
              <div className="rounded-2xl border border-zinc-200 bg-white p-6">
                <div>
                  <h2 className="text-sm font-semibold text-zinc-950">
                    Workspace overview
                  </h2>

                  <p className="mt-1 text-xs text-zinc-400">
                    A quick look at your current pipeline.
                  </p>
                </div>

                <div className="mt-7 space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                    <span className="text-sm text-zinc-600">
                      Ideas captured
                    </span>

                    <span className="text-sm font-semibold text-zinc-950">
                      {ideaCount}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                    <span className="text-sm text-zinc-600">
                      Content created
                    </span>

                    <span className="text-sm font-semibold text-zinc-950">
                      {totalContent}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                    <span className="text-sm text-zinc-600">
                      Ready + scheduled
                    </span>

                    <span className="text-sm font-semibold text-zinc-950">
                      {readyCount + scheduledCount}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-600">
                      Published
                    </span>

                    <span className="text-sm font-semibold text-zinc-950">
                      {publishedCount}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Content activity */}
            <section className="mt-6">
              <div className="rounded-2xl border border-zinc-200 bg-white p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-zinc-950">
                      Content activity
                    </h2>

                    <p className="mt-1 text-xs text-zinc-400">
                      Content created over the last 7 days.
                    </p>
                  </div>

                  <span className="text-xs text-zinc-400">
                    7 days
                  </span>
                </div>

                <div className="mt-6 flex items-center gap-5 text-xs text-zinc-500">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-zinc-950" />
                    Created
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
                    Published
                  </div>
                </div>

                <div className="mt-6 flex h-48 items-end gap-3">
                  {activityDays.map((day) => (
                    <div
                      key={day.date.toISOString()}
                      className="flex h-full flex-1 flex-col items-center justify-end"
                    >
                      <div className="mb-2 flex h-32 w-full items-end justify-center gap-1">
                        <div
                          className="w-1/2 max-w-8 rounded-t-md bg-zinc-950 transition-all"
                          style={{
                            height: `${Math.max(
                              (day.created / maxActivityCount) * 100,
                              day.created > 0 ? 8 : 0,
                            )}%`,
                          }}
                          title={`${day.created} created`}
                        />

                        <div
                          className="w-1/2 max-w-8 rounded-t-md bg-zinc-300 transition-all"
                          style={{
                            height: `${Math.max(
                              (day.published / maxActivityCount) * 100,
                              day.published > 0 ? 8 : 0,
                            )}%`,
                          }}
                          title={`${day.published} published`}
                        />
                      </div>

                      <span className="text-[10px] text-zinc-400">
                        {day.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Publishing activity */}
            <section className="mt-6 grid gap-6 lg:grid-cols-3">
              <div className="rounded-2xl border border-zinc-200 bg-white p-6">
                <p className="text-sm font-semibold text-zinc-950">
                  Published this week
                </p>

                <p className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950">
                  {publishedLast7Days}
                </p>

                <p className="mt-2 text-xs text-zinc-400">
                  Published in the last 7 days
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-6">
                <p className="text-sm font-semibold text-zinc-950">
                  Pipeline
                </p>

                <div className="mt-5 flex items-center gap-2 text-xs">
                  <span className="rounded-lg bg-zinc-100 px-3 py-2">
                    {draftCount} Draft
                  </span>

                  <span className="text-zinc-300">→</span>

                  <span className="rounded-lg bg-zinc-100 px-3 py-2">
                    {readyCount} Ready
                  </span>

                  <span className="text-zinc-300">→</span>

                  <span className="rounded-lg bg-zinc-950 px-3 py-2 text-white">
                    {scheduledCount} Scheduled
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-6">
                <p className="text-sm font-semibold text-zinc-950">
                  Publishing rate
                </p>

                <p className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950">
                  {totalContent > 0
                    ? Math.round((publishedCount / totalContent) * 100)
                    : 0}%
                </p>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-100">
                  <div
                    className="h-full rounded-full bg-zinc-950"
                    style={{
                      width: `${
                        totalContent > 0
                          ? (publishedCount / totalContent) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>

                <p className="mt-2 text-xs text-zinc-400">
                  Published content / total content
                </p>
              </div>
            </section>

            {/* Upcoming + Recent */}
            <section className="mt-6 grid gap-6 lg:grid-cols-2">
              {/* Upcoming */}
              <div className="rounded-2xl border border-zinc-200 bg-white p-6">
                <div className="flex items-center justify-between">
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
                    className="text-xs font-medium text-zinc-500 transition hover:text-zinc-950"
                  >
                    View calendar →
                  </Link>
                </div>

                <div className="mt-6 divide-y divide-zinc-100">
                  {upcomingContent.length === 0 ? (
                    <div className="py-8 text-center">
                      <p className="text-sm text-zinc-400">
                        Nothing scheduled yet.
                      </p>

                      <Link
                        href="/content"
                        className="mt-3 inline-block text-xs font-medium text-zinc-700 hover:text-zinc-950"
                      >
                        Create content →
                      </Link>
                    </div>
                  ) : (
                    upcomingContent.map((content) => (
                      <Link
                        key={content.id}
                        href={`/content/${content.id}`}
                        className="flex items-center justify-between gap-4 py-4 transition hover:bg-zinc-50"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-zinc-900">
                            {content.title}
                          </p>

                          <p className="mt-1 text-xs text-zinc-400">
                            {content.platform || "General"}
                          </p>
                        </div>

                        <div className="shrink-0 text-right">
                          <p className="text-xs font-medium text-zinc-700">
                            {content.scheduledAt
                              ? formatTime(content.scheduledAt)
                              : ""}
                          </p>

                          <p className="mt-1 text-[11px] text-zinc-400">
                            {content.scheduledAt
                              ? formatDate(content.scheduledAt)
                              : ""}
                          </p>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>

              {/* Recent */}
              <div className="rounded-2xl border border-zinc-200 bg-white p-6">
                <div className="flex items-center justify-between">
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
                    className="text-xs font-medium text-zinc-500 transition hover:text-zinc-950"
                  >
                    View all →
                  </Link>
                </div>

                <div className="mt-6 divide-y divide-zinc-100">
                  {recentContent.map((content) => (
                    <Link
                      key={content.id}
                      href={`/content/${content.id}`}
                      className="flex items-center justify-between gap-4 py-4 transition hover:bg-zinc-50"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-zinc-900">
                          {content.title}
                        </p>

                        <p className="mt-1 text-xs text-zinc-400">
                          {content.platform || "General"}
                        </p>
                      </div>

                      <span className="shrink-0 rounded-full bg-zinc-100 px-2.5 py-1 text-[10px] font-medium text-zinc-500">
                        {content.status}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </AppShell>
  );
}
