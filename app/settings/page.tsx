import WorkspaceLayout from "@/components/layout/workspace-layout";
import SettingsClient from "@/components/settings/settings-client";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [connectedChannels, contentCount, publishedCount, scheduledCount, ideasCount] =
    await Promise.all([
      prisma.publishingChannel.findMany({
        where: { connected: true },
        select: { platform: true, accountName: true, connected: true },
      }),
      prisma.content.count(),
      prisma.content.count({ where: { status: "PUBLISHED" } }),
      prisma.content.count({ where: { status: "SCHEDULED" } }),
      prisma.idea.count(),
    ]);

  return (
    <WorkspaceLayout activeItem="settings">
      <div className="min-h-screen bg-[#0a0a0c]">
        <header className="flex h-16 items-center justify-between border-b border-zinc-800 bg-[#0a0a0c] px-4 sm:px-6 lg:px-8">
          <span className="text-sm font-medium text-zinc-500">Settings</span>
          <span className="text-xs text-zinc-500">Workspace preferences</span>
        </header>

        <SettingsClient
          connectedChannels={connectedChannels}
          contentCount={contentCount}
          publishedCount={publishedCount}
          scheduledCount={scheduledCount}
          ideasCount={ideasCount}
        />
      </div>
    </WorkspaceLayout>
  );
}
