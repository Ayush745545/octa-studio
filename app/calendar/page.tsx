import AppShell from "@/components/layout/app-shell";
import CalendarView from "@/components/calendar/calendar-view";
import { prisma } from "@/lib/prisma";

export default async function CalendarPage() {
  const scheduledContent = await prisma.content.findMany({
    where: {
      status: "SCHEDULED",
      scheduledAt: {
        not: null,
      },
    },
    orderBy: {
      scheduledAt: "asc",
    },
  });

  const contents = scheduledContent
    .filter((content) => content.scheduledAt)
    .map((content) => ({
      id: content.id,
      title: content.title,
      platform: content.platform,
      scheduledAt: content.scheduledAt!.toISOString(),
    }));

  return (
    <AppShell>
      <div className="min-h-screen bg-white">
        <header className="flex h-14 items-center justify-between border-b border-zinc-200 px-7">
          <span className="text-sm font-medium text-zinc-500">
            Content Calendar
          </span>

          <span className="text-xs text-zinc-400">
            {contents.length} scheduled
          </span>
        </header>

        <main className="mx-auto max-w-7xl px-7 py-10">
          <CalendarView
            contents={contents}
            initialDate={new Date().toISOString()}
          />
        </main>
      </div>
    </AppShell>
  );
}
