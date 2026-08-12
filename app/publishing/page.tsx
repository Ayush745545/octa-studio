import AppShell from "@/components/layout/app-shell";
import PublishingChannels from "@/components/publishing/publishing-channels";
import PublicationScheduleControls from "@/components/publishing/publication-schedule-controls";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function PublishingPage() {
  const [connectedChannels, publications] = await Promise.all([
    prisma.publishingChannel.findMany({
      where: {
        connected: true,
      },
      select: {
        platform: true,
      },
    }),

    prisma.publication.findMany({
      include: {
        content: {
          select: {
            id: true,
            title: true,
            status: true,
            publishedAt: true,
          },
        },
        channel: {
          select: {
            platform: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    }),
  ]);

  const connectedPlatforms = connectedChannels.map(
    (channel) => channel.platform,
  );

  return (
    <AppShell>
      <div className="min-h-screen bg-white">
        <header className="flex h-14 items-center justify-between border-b border-zinc-200 px-7">
          <span className="text-sm font-medium text-zinc-500">
            Publishing
          </span>

          <span className="text-xs text-zinc-400">
            Publishing center
          </span>
        </header>

        <main className="mx-auto max-w-5xl px-7 py-12">
          <div>
            <p className="text-sm font-medium text-zinc-400">
              Publishing center
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">
              Distribute your content.
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
              Connect your channels and manage every publication from one
              place.
            </p>
          </div>

          <section className="mt-10">
            <PublishingChannels
              connectedPlatforms={connectedPlatforms}
            />
          </section>

          <section className="mt-12 border-t border-zinc-200 pt-8">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-sm font-semibold text-zinc-950">
                  Distribution queue
                </h2>

                <p className="mt-1 text-xs text-zinc-400">
                  Track every content publication across your connected
                  channels.
                </p>
              </div>

              <span className="text-xs text-zinc-400">
                {publications.length} publication
                {publications.length === 1 ? "" : "s"}
              </span>
            </div>

            {publications.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-5 py-10 text-center">
                <p className="text-sm font-medium text-zinc-700">
                  No publications yet
                </p>

                <p className="mt-1 text-xs text-zinc-400">
                  Add a publishing channel to content and it will appear
                  here.
                </p>
              </div>
            ) : (
              <div className="mt-5 overflow-hidden rounded-2xl border border-zinc-200">
                <div className="grid grid-cols-[minmax(0,1fr)_120px_120px_160px_190px] border-b border-zinc-200 bg-zinc-50 px-5 py-3 text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                  <span>Content</span>
                  <span>Channel</span>
                  <span>Status</span>
                  <span>Published</span>
                  <span>Actions</span>
                </div>

                <div className="divide-y divide-zinc-100">
                  {publications.map((publication) => (
                    <div
                      key={publication.id}
                      className="grid grid-cols-[minmax(0,1fr)_120px_120px_160px_190px] items-center px-5 py-4"
                    >
                      <div className="min-w-0 pr-6">
                        <p className="truncate text-sm font-medium text-zinc-900">
                          {publication.content.title}
                        </p>

                        <p className="mt-1 text-xs text-zinc-400">
                          {publication.content.status}
                        </p>
                      </div>

                      <div className="text-sm text-zinc-600">
                        {publication.channel.platform}
                      </div>

                      <div>
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${
                            publication.status === "PUBLISHED"
                              ? "bg-emerald-50 text-emerald-700"
                              : publication.status === "QUEUED"
                                ? "bg-amber-50 text-amber-700"
                                : publication.status === "FAILED"
                                  ? "bg-red-50 text-red-700"
                                  : "bg-zinc-100 text-zinc-600"
                          }`}
                        >
                          {publication.status}
                        </span>
                      </div>

                      <div className="text-xs text-zinc-500">
                        {publication.publishedAt
                          ? new Intl.DateTimeFormat("en-US", {
                              timeZone: "Asia/Kolkata",
                              dateStyle: "medium",
                              timeStyle: "short",
                            }).format(publication.publishedAt)
                          : "—"}
                      </div>

                      <div>
                        <PublicationScheduleControls
                          publicationId={publication.id}
                          status={publication.status}
                          scheduledAt={publication.scheduledAt}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          <div className="mt-5 rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
            <p className="text-xs font-semibold text-zinc-800">
              Publishing connections are simulated
            </p>

            <p className="mt-1 max-w-2xl text-xs leading-5 text-zinc-400">
              ContentOS currently manages your content workflow,
              scheduling, and publishing status internally. Real platform
              authentication will be connected later.
            </p>
          </div>
        </main>
      </div>
    </AppShell>
  );
}
