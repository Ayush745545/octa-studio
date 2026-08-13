import Link from "next/link";

import WorkspaceLayout from "@/components/layout/workspace-layout";
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
    <WorkspaceLayout activeItem="analytics">
      <div className="min-h-screen bg-[#0a0a0c]">
        <header className="flex h-16 items-center justify-between border-b border-zinc-800 bg-[#0a0a0c] px-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-sm font-medium text-zinc-500">Content Analytics</p>
          </div>

          <span className="text-xs text-zinc-500">{totalContent} content items</span>
        </header>

        <main className="px-4 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
              <div>
                <p className="text-sm font-medium text-zinc-500">Workspace intelligence</p>

                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Analytics</h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                  See what is being created, what is ready,
                  and what is moving toward publication.
                </p>
              </div>

              <Link
                href="/ai-studio"
                className="inline-flex w-fit items-center rounded-xl bg-fuchsia-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-fuchsia-500"
              >
                Create content
                <span className="ml-2">→</span>
              </Link>
            </div>

            <section className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {stats.map((stat, index) => (
                <div
                  key={stat.label}
                  className={`rounded-2xl border bg-zinc-950 p-5 ${
                    index === 4
                      ? "border-fuchsia-500/50"
                      : "border-zinc-800"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <p className="text-xs font-medium text-zinc-500">{stat.label}</p>

                    <span className="text-[10px] text-zinc-600">0{index + 1}</span>
                  </div>

                  <p className="mt-4 text-3xl font-semibold tracking-tight text-white">{stat.value}</p>

                  <p className="mt-2 text-xs leading-5 text-zinc-500">{stat.description}</p>
                </div>
              ))}
            </section>

            <section className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-white">Content activity</h2>

                    <p className="mt-1 text-xs text-zinc-500">Created and published over the last 7 days.</p>
                  </div>

                  <span className="rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1 text-[11px] font-medium text-zinc-500">Last 7 days</span>
                </div>

                <div className="mt-6 flex items-center gap-5 text-xs text-zinc-500">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-sm bg-fuchsia-500" />
                    Created
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-sm bg-zinc-600" />
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
                          className="w-full max-w-6 rounded-t-md bg-fuchsia-600 transition-all"
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
                          className="w-full max-w-6 rounded-t-md bg-zinc-600 transition-all"
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

                      <span className="mt-3 text-[10px] font-medium text-zinc-500">{day.label}</span>

                      <span className="mt-1 text-[10px] text-zinc-600">{day.created}/{day.published}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-white">Platform mix</h2>

                    <p className="mt-1 text-xs text-zinc-500">Where your content is being created.</p>
                  </div>

                  <span className="text-xs text-zinc-500">{platforms.length} platforms</span>
                </div>

                <div className="mt-7 space-y-5">
                  {platforms.length === 0 ? (
                    <div className="rounded-xl bg-zinc-950 px-4 py-8 text-center">
                      <p className="text-sm text-zinc-500">No platform data yet.</p>
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
                            <span className="text-sm font-medium text-zinc-300">{platform}</span>

                            <span className="text-xs text-zinc-500">{count} · {percentage}%</span>
                          </div>

                          <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                            <div
                              className="h-full rounded-full bg-fuchsia-600 transition-all"
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
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-white">Publishing pipeline</h2>

                    <p className="mt-1 text-xs text-zinc-500">Current state of your content.</p>
                  </div>

                  <span className="text-xs text-zinc-500">{totalContent} total</span>
                </div>

                <div className="mt-8 grid grid-cols-4 gap-2">
                  {pipeline.map((stage, index) => (
                    <div key={stage.label}>
                      <div
                        className={`flex h-20 flex-col justify-between rounded-xl p-3 ${
                          index === 3
                            ? "bg-fuchsia-600 text-white"
                            : "bg-zinc-950"
                        }`}
                      >
                        <span className="text-[10px] font-medium text-zinc-500">{stage.label}</span>

                        <span className="text-xl font-semibold text-white">{stage.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-white">Publishing rate</h2>

                    <p className="mt-1 text-xs text-zinc-500">Published content versus total content.</p>
                  </div>

                  <span className="text-2xl font-semibold tracking-tight text-white">{publishingRate}%</span>
                </div>

                <div className="mt-8 h-3 overflow-hidden rounded-full bg-zinc-100">
                  <div
                    className="h-full rounded-full bg-fuchsia-600 transition-all"
                    style={{
                      width: `${publishingRate}%`,
                    }}
                  />
                </div>

                <div className="mt-4 flex items-center justify-between text-xs text-zinc-500">
                  <span>{publishedCount} published</span>
                  <span>{totalContent} total</span>
                </div>

                <div className="mt-6 rounded-xl bg-zinc-950 p-4">
                  <p className="text-xs text-zinc-500">Published this week</p>

                  <p className="mt-1 text-2xl font-semibold text-white">{publishedLast7Days}</p>
                </div>
              </div>
            </section>

            <section className="mt-6 grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-white">Upcoming content</h2>

                    <p className="mt-1 text-xs text-zinc-500">Your next scheduled posts.</p>
                  </div>

                  <Link
                    href="/calendar"
                    className="text-xs font-medium text-zinc-500 transition hover:text-white"
                  >
                    Calendar →
                  </Link>
                </div>

                <div className="mt-5 divide-y divide-zinc-800">
                  {upcomingContent.length === 0 ? (
                    <div className="rounded-xl bg-zinc-950 py-10 text-center">
                      <p className="text-sm text-zinc-500">Nothing scheduled yet.</p>

                      <Link
                        href="/content"
                        className="mt-3 inline-block text-xs font-medium text-zinc-500 hover:text-white"
                      >
                        Create content →
                      </Link>
                    </div>
                  ) : (
                    upcomingContent.map((content) => (
                      <Link
                        key={content.id}
                        href={`/content/${content.id}`}
                        className="flex items-center justify-between gap-4 rounded-lg py-4 transition hover:bg-zinc-100/40"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-white">{content.title}</p>

                          <div className="mt-1 flex items-center gap-2">
                            <span className="text-xs text-zinc-500">{content.platform || "General"}</span>

                            <span className="h-1 w-1 rounded-full bg-zinc-700" />

                            <span className="text-xs text-zinc-500">Scheduled</span>
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <p className="text-xs font-medium text-zinc-300">
                            {content.scheduledAt
                              ? formatTime(content.scheduledAt)
                              : ""}
                          </p>

                          <p className="mt-1 text-[11px] text-zinc-600">
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

              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-white">Recent content</h2>

                    <p className="mt-1 text-xs text-zinc-500">Recently created or updated.</p>
                  </div>

                  <Link
                    href="/content"
                    className="text-xs font-medium text-zinc-500 transition hover:text-white"
                  >
                    View all →
                  </Link>
                </div>

                <div className="mt-5 divide-y divide-zinc-800">
                  {recentContent.length === 0 ? (
                    <div className="rounded-xl bg-zinc-950 py-10 text-center">
                      <p className="text-sm text-zinc-500">No content yet.</p>
                    </div>
                  ) : (
                    recentContent.map((content) => (
                      <Link
                        key={content.id}
                        href={`/content/${content.id}`}
                        className="flex items-center justify-between gap-4 rounded-lg py-4 transition hover:bg-zinc-100/40"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-white">{content.title}</p>

                          <div className="mt-1 flex items-center gap-2">
                            <span className="text-xs text-zinc-500">{content.platform || "General"}</span>

                            <span className="h-1 w-1 rounded-full bg-zinc-700" />

                            <span className="text-[11px] text-zinc-600">
                              {formatDateTime(content.updatedAt)}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium ${
                            content.status === "PUBLISHED"
                              ? "bg-fuchsia-600/20 text-fuchsia-300"
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
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
                <p className="text-xs font-medium text-zinc-500">Ideas captured</p>

                <p className="mt-3 text-3xl font-semibold tracking-tight text-white">{ideaCount}</p>

                <p className="mt-2 text-xs text-zinc-500">Ideas available for future content.</p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
                <p className="text-xs font-medium text-zinc-500">Ready + scheduled</p>

                <p className="mt-3 text-3xl font-semibold tracking-tight text-white">{readyCount + scheduledCount}</p>

                <p className="mt-2 text-xs text-zinc-500">Content moving toward publication.</p>
              </div>
            </section>
          </div>
        </main>
      </div>
    </WorkspaceLayout>
  );
}
