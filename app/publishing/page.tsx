import WorkspaceLayout from "@/components/layout/workspace-layout";
import PublishingChannels from "@/components/publishing/publishing-channels";
import PublicationScheduleControls from "@/components/publishing/publication-schedule-controls";
import ContentScheduleControls from "@/components/publishing/content-schedule-controls";
import { prisma } from "@/lib/prisma";
import VideoWithFallback from "@/components/video-with-fallback";

export const dynamic = "force-dynamic";

function formatDateTime(date: Date | null) {
  if (!date) return "—";

  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

type ReportRow = {
  id: string;
  title: string;
  platform: string;
  status: string;
  contentStatus: string;
  scheduledAt: Date | null;
  publishedAt: Date | null;
  executionTimeMs: number | null;
  error: string | null;
  isContentOnly: boolean;
  mediaUrl?: string | null;
};

const STATUS_BADGE: Record<string, string> = {
  PUBLISHED: "bg-emerald-950/50 text-emerald-400",
  SCHEDULED: "bg-sky-950/50 text-sky-400",
  QUEUED: "bg-amber-950/50 text-amber-400",
  FAILED: "bg-red-950/50 text-red-400",
  AWAITING: "bg-zinc-800 text-zinc-400",
  READY: "bg-zinc-800 text-zinc-400",
};

export default async function PublishingPage() {
  const connectedChannels = await prisma.publishingChannel.findMany({
    where: { connected: true },
    select: { platform: true },
  });

  const publications = await prisma.publication.findMany({
    include: {
      content: {
        select: {
          id: true,
          title: true,
          status: true,
          media: { select: { url: true } },
        },
      },
      channel: { select: { platform: true, accountName: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  // Creator Studio schedules Content rows directly (no Publication yet when no
  // channel is connected). Surface those too so the inbox shows the REAL
  // schedule and not just channel-backed publications.
  const contents = await prisma.content.findMany({
    where: {
      status: { in: ["SCHEDULED", "PUBLISHED", "READY"] },
      scheduledAt: { not: null },
    },
    include: {
      publications: { select: { id: true } },
      media: { select: { url: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const rows: ReportRow[] = [];

  for (const pub of publications) {
    rows.push({
      id: pub.id,
      title: pub.content.title,
      platform: pub.channel.platform,
      status: pub.status,
      contentStatus: pub.content.status,
      scheduledAt: pub.scheduledAt,
      publishedAt: pub.publishedAt,
      executionTimeMs: pub.executionTimeMs,
      error: pub.error,
      isContentOnly: false,
      mediaUrl: pub.content.media?.[0]?.url ?? null,
    });
  }

  for (const content of contents) {
    // Already represented by its publication rows above.
    if (content.publications.length > 0) continue;
    rows.push({
      id: content.id,
      title: content.title,
      platform: content.platform ?? "Instagram",
      status: content.status === "READY" ? "AWAITING" : content.status,
      contentStatus: content.status,
      scheduledAt: content.scheduledAt,
      publishedAt: content.publishedAt,
      executionTimeMs: null,
      error: null,
      isContentOnly: true,
      mediaUrl: content.media?.[0]?.url ?? null,
    });
  }

  rows.sort((a, b) => {
    const ta = a.scheduledAt?.getTime() ?? 0;
    const tb = b.scheduledAt?.getTime() ?? 0;
    return tb - ta;
  });

  const counts = {
    total: rows.length,
    scheduled: rows.filter((r) => r.status === "SCHEDULED").length,
    published: rows.filter((r) => r.status === "PUBLISHED").length,
    failed: rows.filter((r) => r.status === "FAILED").length,
    awaiting: rows.filter((r) => r.isContentOnly).length,
  };

  const connectedPlatforms = connectedChannels.map((c) => c.platform);

  return (
    <WorkspaceLayout activeItem="publishing">
      <div className="min-h-screen bg-[#0a0a0c]">
        <header className="flex h-16 items-center justify-between border-b border-zinc-800 bg-[#0a0a0c] px-4 sm:px-6 lg:px-8">
          <span className="text-sm font-medium text-zinc-500">Social Inbox</span>
          <span className="text-xs text-zinc-500">Real publishing reports</span>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-7">
          <div>
            <p className="text-sm font-medium text-zinc-500">Social Inbox</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
              Your real schedule &amp; reports.
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
              Every scheduled, published and failed post across Creator Studio
              and connected channels — with live status and execution reports.
            </p>
          </div>

          {/* Real report summary */}
          <section className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Total posts", value: counts.total, tone: "text-white" },
              { label: "Scheduled", value: counts.scheduled, tone: "text-sky-400" },
              { label: "Published", value: counts.published, tone: "text-emerald-400" },
              { label: "Awaiting channel", value: counts.awaiting, tone: "text-zinc-400" },
            ].map((c) => (
              <div
                key={c.label}
                className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4"
              >
                <div className={`text-2xl font-semibold ${c.tone}`}>{c.value}</div>
                <div className="mt-1 text-[11px] text-zinc-500">{c.label}</div>
              </div>
            ))}
          </section>

          <section className="mt-10">
            <PublishingChannels connectedPlatforms={connectedPlatforms} />
          </section>

          <section className="mt-12 border-t border-zinc-800 pt-8">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-sm font-semibold text-white">Distribution queue</h2>
                <p className="mt-1 text-xs text-zinc-500">
                  All posts and their real publishing status.
                </p>
              </div>
              <span className="text-xs text-zinc-500">
                {rows.length} post{rows.length === 1 ? "" : "s"}
              </span>
            </div>

            {rows.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-dashed border-zinc-800 bg-zinc-950 px-5 py-10 text-center">
                <p className="text-sm font-medium text-zinc-300">No posts yet</p>
                <p className="mt-1 text-xs text-zinc-500">
                  Schedule a video in Creator Studio or connect a channel to see
                  real reports here.
                </p>
              </div>
            ) : (
              <div className="mt-5 overflow-x-auto rounded-2xl border border-zinc-800">
                <div className="min-w-[920px]">
                  <div className="grid grid-cols-[minmax(0,1fr)_110px_120px_220px_160px_100px] border-b border-zinc-800 bg-zinc-950 px-5 py-3 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                    <span>Post</span>
                    <span>Channel</span>
                    <span>Status</span>
                    <span>Schedule</span>
                    <span>Published</span>
                    <span>Time</span>
                  </div>

                  <div className="divide-y divide-zinc-800">
                    {rows.map((row) => (
                      <div
                        key={row.id}
                        className="grid grid-cols-[minmax(0,1fr)_110px_120px_220px_160px_100px] items-center px-5 py-4"
                      >
                        <div className="flex min-w-0 items-center gap-3 pr-6">
                          {row.mediaUrl ? (
                            <div className="size-10 shrink-0 overflow-hidden rounded-lg bg-black">
                              {row.mediaUrl.endsWith(".mp4") ||
                              row.mediaUrl.endsWith(".webm") ? (
                                <VideoWithFallback
                                  src={row.mediaUrl}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <img
                                  src={row.mediaUrl}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              )}
                            </div>
                          ) : null}
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-white">
                              {row.title}
                            </p>
                            <p className="mt-1 text-xs text-zinc-500">
                              {row.isContentOnly
                                ? "Creator Studio · no channel"
                                : `Content: ${row.contentStatus}`}
                            </p>
                            {row.status === "FAILED" && row.error && (
                              <p className="mt-1 text-xs text-red-400">
                                {row.error.length > 80
                                  ? `${row.error.slice(0, 80)}...`
                                  : row.error}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="text-sm text-zinc-300">{row.platform}</div>

                        <div>
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${
                              STATUS_BADGE[row.status] ?? "bg-zinc-100 text-zinc-500"
                            }`}
                          >
                            {row.status === "AWAITING"
                              ? "AWAITING CHANNEL"
                              : row.status}
                          </span>
                        </div>

                        <div>
                          {row.isContentOnly ? (
                            <div className="flex flex-col gap-2">
                              <span className="text-xs text-zinc-500">
                                {formatDateTime(row.scheduledAt)}
                              </span>
                              <ContentScheduleControls
                                contentId={row.id}
                                status={row.status}
                                scheduledAt={row.scheduledAt}
                              />
                            </div>
                          ) : (
                            <PublicationScheduleControls
                              publicationId={row.id}
                              status={row.status}
                              scheduledAt={row.scheduledAt}
                            />
                          )}
                        </div>

                        <div className="text-xs text-zinc-500">
                          {formatDateTime(row.publishedAt)}
                        </div>

                        <div className="text-xs text-zinc-500">
                          {row.executionTimeMs != null
                            ? `${(row.executionTimeMs / 1000).toFixed(1)}s`
                            : "—"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>

          {counts.awaiting > 0 && (
            <div className="mt-5 rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-5">
              <p className="text-xs font-semibold text-amber-300">
                {counts.awaiting} post{counts.awaiting === 1 ? "" : "s"} not
                connected to a channel
              </p>
              <p className="mt-1 max-w-2xl text-xs leading-5 text-zinc-500">
                These were scheduled from Creator Studio but have no connected
                social account, so they won&apos;t actually publish. Connect
                Instagram, YouTube, TikTok or Facebook above and they&apos;ll
                auto-publish at their scheduled time — or use Reschedule /
                Cancel on each row.
              </p>
              <a
                href="/publishing#channels"
                className="mt-3 inline-flex items-center rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs font-medium text-amber-200 transition hover:bg-amber-400/20"
              >
                Connect a channel
              </a>
            </div>
          )}
        </main>
      </div>
    </WorkspaceLayout>
  );
}
