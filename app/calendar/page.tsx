import CalendarWorkspace from "@/components/calendar/calendar-workspace";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const now = new Date();

  const [scheduledPublications, connectedChannels] = await Promise.all([
    prisma.publication.findMany({
      where: {
        status: "SCHEDULED",
        scheduledAt: {
          not: null,
          // Only show upcoming posts — past ones are published (or being published) and can't be rescheduled
          gt: now,
        },
      },
      include: {
        content: {
          select: {
            id: true,
            title: true,
            body: true,
            platform: true,
            media: {
              select: {
                id: true,
                url: true,
                filename: true,
                mimeType: true,
                size: true,
                type: true,
              },
            },
          },
        },
        channel: {
          select: {
            platform: true,
            accountName: true,
            connected: true,
            externalId: true,
          },
        },
      },
      orderBy: {
        scheduledAt: "asc",
      },
    }),
    prisma.publishingChannel.findMany({
      where: { connected: true },
      select: {
        platform: true,
        accountName: true,
        externalId: true,
      },
    }),
  ]);

  const posts = scheduledPublications
    .filter((pub) => pub.scheduledAt)
    .map((pub) => ({
      id: pub.id,
      contentId: pub.content.id,
      title: pub.content.title,
      body: pub.content.body,
      platform: pub.channel.platform,
      accountName: pub.channel.accountName,
      scheduledAt: pub.scheduledAt!.toISOString(),
      media: pub.content.media,
    }));

  const connectedPlatforms = connectedChannels.map((ch) => ch.platform);

  return (
    <CalendarWorkspace
      posts={posts}
      connectedPlatforms={connectedPlatforms}
      connectedChannels={connectedChannels}
    />
  );
}
