import AppShell from "@/components/layout/app-shell";
import CalendarView from "@/components/calendar/calendar-view";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const scheduledPublications = await prisma.publication.findMany({
    where: {
      status: "SCHEDULED",
      scheduledAt: {
        not: null,
      },
    },
    include: {
      content: {
        select: {
          id: true,
          title: true,
        },
      },
      channel: {
        select: {
          platform: true,
        },
      },
    },
    orderBy: {
      scheduledAt: "asc",
    },
  });

  const publications = scheduledPublications
    .filter((publication) => publication.scheduledAt)
    .map((publication) => ({
      id: publication.id,
      contentId: publication.content.id,
      title: publication.content.title,
      platform: publication.channel.platform,
      scheduledAt: publication.scheduledAt!.toISOString(),
    }));

  return (
    <AppShell>
      <div className="min-h-screen bg-white">
        <header className="flex h-14 items-center justify-between border-b border-zinc-200 px-7">
          <span className="text-sm font-medium text-zinc-500">
            Content Calendar
          </span>

          <span className="text-xs text-zinc-400">
            {publications.length} scheduled
          </span>
        </header>

        <main className="mx-auto max-w-7xl px-7 py-10">
          <CalendarView
            contents={publications}
            initialDate={new Date().toISOString()}
          />
        </main>
      </div>
    </AppShell>
  );
}
