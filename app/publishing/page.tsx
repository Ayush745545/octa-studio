import AppShell from "@/components/layout/app-shell";
import PublishingChannels from "@/components/publishing/publishing-channels";
import { prisma } from "@/lib/prisma";

export default async function PublishingPage() {
  const connectedChannels = await prisma.publishingChannel.findMany({
    where: {
      connected: true,
    },
    select: {
      platform: true,
    },
  });

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

        <main className="mx-auto max-w-4xl px-7 py-12">
          <div>
            <p className="text-sm font-medium text-zinc-400">
              Publishing center
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">
              Connect your channels.
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
              Connect your publishing platforms once, then manage your
              content distribution from ContentOS.
            </p>
          </div>

          <section className="mt-10">
            <PublishingChannels
              connectedPlatforms={connectedPlatforms}
            />
          </section>

          <div className="mt-5 rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
            <div className="flex gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-xs text-zinc-500">
                i
              </div>

              <div>
                <p className="text-xs font-semibold text-zinc-800">
                  Publishing connections are simulated
                </p>

                <p className="mt-1 max-w-2xl text-xs leading-5 text-zinc-400">
                  ContentOS currently manages your content workflow,
                  scheduling, and publishing status internally. Real platform
                  authentication will be connected later.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </AppShell>
  );
}
