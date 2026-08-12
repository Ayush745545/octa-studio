import Link from "next/link";

import AppShell from "@/components/layout/app-shell";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export default async function AnalyticsPage() {
  const now = new Date();
  const sevenDaysAgo = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000,
  );

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
          gte: sevenDaysAgo,
        },
      },
    }),

    prisma.content.findMany({
      where: {
        OR: [
          { createdAt: { gte: sevenDaysAgo } },
          { publishedAt: { gte: sevenDaysAgo } },
        ],
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
      return (
        content.createdAt >= date &&
        content.createdAt < nextDate
      );
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
    ...activityDays.flatMap((day) => [
      day.created,
      day.published,
    ]),
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

  const platforms = Array.from(
    platformCounts.entries(),
  ).sort((a, b) => b[1] - a[1]);

  const maxPlatformCount = Math.max(
    ...platforms.map(([, count]) => count),
    1,
  );

  const publishingRate =
    totalContent > 0
      ? Math.round((publishedCount / totalContent) * 100)
      : 0;

  const pipeline = [
    {
      label: "Draft",
      count: draftCount,
    },
    {
      label: "Ready",
      count: readyCount,
    },
    {
      label: "Scheduled",
      count: scheduledCount,
    },
    {
      label: "Published",
      count: publishedCount,
    },
  ];

  const stats = [
    {
      label: "Total content",
      value: totalContent,
      description: "Everything in your workspace",
    },
    {
      label: "Drafts",
      value: draftCount,
      description: "Still being edited",
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
      description: "Successfully published",
    },
  ];

  return (
    <AppShell>
      <div className="min-h-screen bg-zinc-50">
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

        <main className="px-6 py-10 sm:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
              <div>
                <p className="text-sm font-medium text-zinc-400">
                  Workspace intelligence
                </p>

                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">
                  Analytics
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                  See what is being created, what is ready,
                  and what is moving toward publication.
                </p>
              </div>

              <Link
                href="/ai-studio"
                className="inline-flex w-fit items-center rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800"
              >
                Create content
                <span className="ml-2">→</span>
              </Link>
            </div>

            <section className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {stats.map((stat, index) => (
                <div
                  key={stat.label}
                  className={`rounded-2xl border bg-white p-5 ${
                    index === 4
                      ? "border-zinc-950"
                      : "border-zinc-200"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <p className="text-xs font-medium text-zinc-500">
                      {stat.label}
                    </p>

                    <span className="text-[10px] text-zinc-300">
                      0{index + 1}
                    </span>
                  </div>

                  <p className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950">
                    {stat.value}
                  </p>

                  <p className="mt-2 text-xs leading-5 text-zinc-400">
                    {stat.description}
                  </p>
                </div>
              ))}
            </section>

            <section className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
              <div className="rounded-2xl border border-zinc-200 bg-white p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-zinc-950">
                      Content activity
                    </h2>

                    <p className="mt-1 text-xs text-zinc-400">
                      Created and published over the last 7 days.
                    </p>
                  </div>

                  <span className="rounded-full bg-zinc-50 px-3 py-1 text-[11px] font-medium text-zinc-500">
                    Last 7 days
                  </span>
                </div>

                <div className="mt-6 flex items-center gap-5 text-xs text-zinc-500">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-sm bg-zinc-950" />
                    Created
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-sm bg-zinc-300" />
                    Published
                  </div>
                </div>

                <div className="mt-8 grid h-56 grid-cols-7 gap-3">
                  {activityDays.map((day) => (
                    <div
                      key={day.date.toISOString()}
                      className="flex min-w-0 flex-col items-center"
                    >
                      <div className="flex h-44 w-full items-end justify-center gap-1">
                        <div
                          className="w-full max-w-6 rounded-t-md bg-zinc-950 transition-all"
                          style={{
                            height: `${
                              day.created > 0
                                ? Math.max(
                                    (day.created /
                                      maxActivityCount) *
                                      100,
                                    8,
                                  )
                                : 3
                            }%`,
                          }}
                          title={`${day.created} created`}
                        />

                        <div
                          className="w-full max-w-6 rounded-t-md bg-zinc-300 transition-all"
                          style={{
                            height: `${
                              day.published > 0
                                ? Math.max(
                                    (day.published /
                                      maxActivityCount) *
                                      100,
                                    8,
                                  )
                                : 3
                            }%`,
                          }}
                          title={`${day.published} published`}
                        />
                      </div>

                      <span className="mt-3 text-[10px] font-medium text-zinc-400">
                        {day.label}
                      </span>

                      <span className="mt-1 text-[10px] text-zinc-300">
                        {day.created}/{day.published}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-zinc-950">
                      Platform mix
                    </h2>

                    <p className="mt-1 text-xs text-zinc-400">
                      Where your content is being created.
                    </p>
                  </div>

                  <span className="text-xs text-zinc-400">
                    {platforms.length} platforms
                  </span>
                </div>

                <div className="mt-7 space-y-5">
                  {platforms.length === 0 ? (
                    <div className="rounded-xl bg-zinc-50 px-4 py-8 text-center">
                      <p className="text-sm text-zinc-400">
                        No platform data yet.
                      </p>
                    </div>
                  ) : (
                    platforms.map(([platform, count]) => {
                      const percentage =
                        totalContent > 0
                          ? Math.round(
                              (count / totalContent) * 100,
                            )
                          : 0;

                      return (
                        <div key={platform}>
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-sm font-medium text-zinc-700">
                              {platform}
                            </span>

                            <span className="text-xs text-zinc-400">
                              {count} · {percentage}%
                            </span>
                          </div>

                          <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                            <div
                              className="h-full rounded-full bg-zinc-950 transition-all"
                              style={{
                                width: `${
                                  (count /
                                    maxPlatformCount) *
                                  100
                                }%`,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </section>

            <section className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
              <div className="rounded-2xl border border-zinc-200 bg-white p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-zinc-950">
                      Publishing pipeline
                    </h2>

                    <p className="mt-1 text-xs text-zinc-400">
                      Current state of your content.
                    </p>
                  </div>

                  <span className="text-xs text-zinc-400">
                    {totalContent} total
                  </span>
                </div>

                <div className="mt-8 grid grid-cols-4 gap-2">
                  {pipeline.map((stage, index) => (
                    <div key={stage.label}>
                      <div
                        className={`flex h-20 flex-col justify-between rounded-xl p-3 ${
                          index === 3
                            ? "bg-zinc-950 text-white"
                            : "bg-zinc-50"
                        }`}
                      >
                        <span
                          className={`text-[10px] font-medium ${
                            index === 3
                              ? "text-zinc-400"
                              : "text-zinc-400"
                          }`}
                        >
                          {stage.label}
                        </span>

                        <span className="text-xl font-semibold">
                          {stage.count}
                        </span>
                      </div>

                      {index < pipeline.length - 1 && (
                        <div className="hidden" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-zinc-950">
                      Publishing rate
                    </h2>

                    <p className="mt-1 text-xs text-zinc-400">
                      Published content versus total content.
                    </p>
                  </div>

                  <span className="text-2xl font-semibold tracking-tight text-zinc-950">
                    {publishingRate}%
                  </span>
                </div>

                <div className="mt-8 h-3 overflow-hidden rounded-full bg-zinc-100">
                  <div
                    className="h-full rounded-full bg-zinc-950 transition-all"
                    style={{
                      width: `${publishingRate}%`,
                    }}
                  />
                </div>

                <div className="mt-4 flex items-center justify-between text-xs text-zinc-400">
                  <span>{publishedCount} published</span>
                  <span>{totalContent} total</span>
                </div>

                <div className="mt-6 rounded-xl bg-zinc-50 p-4">
                  <p className="text-xs text-zinc-400">
                    Published this week
                  </p>

                  <p className="mt-1 text-2xl font-semibold text-zinc-950">
                    {publishedLast7Days}
                  </p>
                </div>
              </div>
            </section>

            <section className="mt-6 grid gap-6 lg:grid-cols-2">
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
                    Calendar →
                  </Link>
                </div>

                <div className="mt-5 divide-y divide-zinc-100">
                  {upcomingContent.length === 0 ? (
                    <div className="rounded-xl bg-zinc-50 py-10 text-center">
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
                        className="flex items-center justify-between gap-4 rounded-lg py-4 transition hover:bg-zinc-50"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-zinc-900">
                            {content.title}
                          </p>

                          <div className="mt-1 flex items-center gap-2">
                            <span className="text-xs text-zinc-400">
                              {content.platform || "General"}
                            </span>

                            <span className="h-1 w-1 rounded-full bg-zinc-300" />

                            <span className="text-xs text-zinc-400">
                              Scheduled
                            </span>
                          </div>
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

                <div className="mt-5 divide-y divide-zinc-100">
                  {recentContent.length === 0 ? (
                    <div className="rounded-xl bg-zinc-50 py-10 text-center">
                      <p className="text-sm text-zinc-400">
                        No content yet.
                      </p>
                    </div>
                  ) : (
                    recentContent.map((content) => (
                      <Link
                        key={content.id}
                        href={`/content/${content.id}`}
                        className="flex items-center justify-between gap-4 rounded-lg py-4 transition hover:bg-zinc-50"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-zinc-900">
                            {content.title}
                          </p>

                          <div className="mt-1 flex items-center gap-2">
                            <span className="text-xs text-zinc-400">
                              {content.platform || "General"}
                            </span>

                            <span className="h-1 w-1 rounded-full bg-zinc-300" />

                            <span className="text-[11px] text-zinc-300">
                              {formatDateTime(content.updatedAt)}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium ${
                            content.status === "PUBLISHED"
                              ? "bg-zinc-950 text-white"
                              : "bg-zinc-100 text-zinc-500"
                          }`}
                        >
                          {content.status}
                        </span>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            </section>

            <section className="mt-6 grid gap-6 sm:grid-cols-2">
              <div className="rounded-2xl border border-zinc-200 bg-white p-6">
                <p className="text-xs font-medium text-zinc-400">
                  Ideas captured
                </p>

                <p className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950">
                  {ideaCount}
                </p>

                <p className="mt-2 text-xs text-zinc-400">
                  Ideas available for future content.
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-6">
                <p className="text-xs font-medium text-zinc-400">
                  Ready + scheduled
                </p>

                <p className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950">
                  {readyCount + scheduledCount}
                </p>

                <p className="mt-2 text-xs text-zinc-400">
                  Content moving toward publication.
                </p>
              </div>
            </section>
          </div>
        </main>
      </div>
    </AppShell>
  );
}
