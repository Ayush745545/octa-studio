import WorkspaceLayout from "@/components/layout/workspace-layout";
import PublishingChannels from "@/components/publishing/publishing-channels";
import PublicationScheduleControls from "@/components/publishing/publication-schedule-controls";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function formatDateTime(date: Date | null) {
  if (!date) return "—";

  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function PublishingPage() {
  const connectedChannels = await prisma.publishingChannel.findMany({
    where: {
      connected: true,
    },
    select: {
      platform: true,
    },
  });

  const publications = await prisma.publication.findMany({
    include: {
      content: {
        select: {
          id: true,
          title: true,
          status: true,
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
  });

  const connectedPlatforms = connectedChannels.map(
    (channel) => channel.platform,
  );

  return (
    <WorkspaceLayout activeItem="publishing">
      <div className="min-h-screen bg-[#0a0a0c]">
        <header className="flex h-16 items-center justify-between border-b border-zinc-800 bg-[#0a0a0c] px-4 sm:px-6 lg:px-8">
          <span className="text-sm font-medium text-zinc-500">Publishing</span>

          <span className="text-xs text-zinc-500">Publishing center</span>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-7">
          <div>
            <p className="text-sm font-medium text-zinc-500">Publishing center</p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Distribute your content.</h1>

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

          <section className="mt-12 border-t border-zinc-800 pt-8">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-sm font-semibold text-white">Distribution queue</h2>

                <p className="mt-1 text-xs text-zinc-500">Schedule and manage each channel independently.</p>
              </div>

              <span className="text-xs text-zinc-500">
                {publications.length} publication
                {publications.length === 1 ? "" : "s"}
              </span>
            </div>

            {publications.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-dashed border-zinc-800 bg-zinc-950 px-5 py-10 text-center">
                <p className="text-sm font-medium text-zinc-300">No publications yet</p>

                <p className="mt-1 text-xs text-zinc-500">
                  Add a publishing channel to content and it will appear
                  here.
                </p>
              </div>
            ) : (
              <div className="mt-5 overflow-x-auto rounded-2xl border border-zinc-800">
                <div className="min-w-[900px]">
                  <div className="grid grid-cols-[minmax(0,1fr)_110px_110px_220px_160px] border-b border-zinc-800 bg-zinc-950 px-5 py-3 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                    <span>Content</span>
                    <span>Channel</span>
                    <span>Status</span>
                    <span>Schedule</span>
                    <span>Published</span>
                  </div>

                  <div className="divide-y divide-zinc-800">
                    {publications.map((publication) => (
                      <div
                        key={publication.id}
                        className="grid grid-cols-[minmax(0,1fr)_110px_110px_220px_160px] items-center px-5 py-4"
                      >
                        <div className="min-w-0 pr-6">
                          <p className="truncate text-sm font-medium text-white">
                            {publication.content.title}
                          </p>

                          <p className="mt-1 text-xs text-zinc-500">
                            Content: {publication.content.status}
                          </p>
                        </div>

                        <div className="text-sm text-zinc-300">
                          {publication.channel.platform}
                        </div>

                        <div>
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${
                              publication.status === "PUBLISHED"
                                ? "bg-emerald-950/50 text-emerald-400"
                                : publication.status === "SCHEDULED"
                                  ? "bg-sky-950/50 text-sky-400"
                                  : publication.status === "QUEUED"
                                    ? "bg-amber-950/50 text-amber-400"
                                    : publication.status === "FAILED"
                                      ? "bg-red-950/50 text-red-400"
                                      : "bg-zinc-100 text-zinc-500"
                            }`}
                          >
                            {publication.status}
                          </span>
                        </div>

                        <div>
                          <PublicationScheduleControls
                            publicationId={publication.id}
                            status={publication.status}
                            scheduledAt={publication.scheduledAt}
                          />
                        </div>

                        <div className="text-xs text-zinc-500">
                          {formatDateTime(publication.publishedAt)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>

          <div className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
            <p className="text-xs font-semibold text-zinc-300">
              Publishing connections are simulated
            </p>

            <p className="mt-1 max-w-2xl text-xs leading-5 text-zinc-500">
              ContentOS currently manages your content workflow, scheduling,
              and publishing status internally. Real platform authentication
              will be connected later.
            </p>
          </div>
        </main>
      </div>
    </WorkspaceLayout>
  );
}
