import Link from "next/link";

import AppShell from "@/components/layout/app-shell";
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

  return (
    <AppShell>
      <div className="flex min-h-screen">
        <main className="flex-1">
          <div className="border-b border-zinc-200 px-8 py-5">
            <p className="text-sm font-medium text-zinc-500">
              Content Calendar
            </p>
          </div>

          <div className="px-8 py-10">
            <div className="max-w-5xl">
              <p className="text-sm text-zinc-400">
                Publishing schedule
              </p>

              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">
                Calendar
              </h1>

              <p className="mt-2 text-sm text-zinc-500">
                See when your content is scheduled to go live.
              </p>

              <div className="mt-10 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
                <div className="grid grid-cols-7 border-b border-zinc-200">
                  {[
                    "Mon",
                    "Tue",
                    "Wed",
                    "Thu",
                    "Fri",
                    "Sat",
                    "Sun",
                  ].map((day) => (
                    <div
                      key={day}
                      className="border-r border-zinc-100 px-4 py-3 text-xs font-medium text-zinc-400 last:border-r-0"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7">
                  {Array.from({ length: 35 }).map((_, index) => {
                    const day = index + 1;

                    const items = scheduledContent.filter((content) => {
                      if (!content.scheduledAt) return false;

                      return (
                        content.scheduledAt.getDate() === day &&
                        content.scheduledAt.getMonth() ===
                          new Date().getMonth() &&
                        content.scheduledAt.getFullYear() ===
                          new Date().getFullYear()
                      );
                    });

                    return (
                      <div
                        key={index}
                        className="min-h-32 border-b border-r border-zinc-100 p-3"
                      >
                        <span className="text-xs font-medium text-zinc-400">
                          {day}
                        </span>

                        <div className="mt-2 space-y-2">
                          {items.map((content) => (
                            <Link
                              key={content.id}
                              href={`/content/${content.id}`}
                              className="block rounded-lg border border-zinc-200 bg-zinc-50 p-2 transition hover:border-zinc-400 hover:bg-white"
                            >
                              <p className="line-clamp-2 text-xs font-medium text-zinc-900">
                                {content.title}
                              </p>

                              <p className="mt-1 text-[11px] text-zinc-400">
                                {content.scheduledAt?.toLocaleTimeString(
                                  [],
                                  {
                                    hour: "numeric",
                                    minute: "2-digit",
                                  },
                                )}
                              </p>
                            </Link>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </AppShell>
  );
}
