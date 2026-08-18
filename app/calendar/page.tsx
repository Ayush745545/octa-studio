import CalendarWorkspace from "@/components/calendar/calendar-workspace";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const now = new Date();

  const [scheduledPublications, scheduledContent, connectedChannels] =
    await Promise.all([
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
      // Creator Studio schedules posts as Content rows directly so they appear
      // in the calendar even before social channels are connected.
      prisma.content.findMany({
        where: {
          status: "SCHEDULED",
          scheduledAt: { not: null, gt: now },
        },
        select: {
          id: true,
          title: true,
          body: true,
          platform: true,
          scheduledAt: true,
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
        orderBy: { scheduledAt: "asc" },
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

  // Merge Creator Studio scheduled content, de-duplicating by content id so a
  // post that also has publications is not shown twice.
  const seenContentIds = new Set(posts.map((post) => post.contentId));

  for (const content of scheduledContent) {
    if (!content.scheduledAt || seenContentIds.has(content.id)) continue;
    seenContentIds.add(content.id);
    posts.push({
      id: content.id,
      contentId: content.id,
      title: content.title,
      body: content.body,
      platform: content.platform ?? "Instagram",
      accountName: null,
      scheduledAt: content.scheduledAt.toISOString(),
      media: content.media,
    });
  }

  posts.sort(
    (a, b) =>
      new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
  );

  const connectedPlatforms = connectedChannels.map((ch) => ch.platform);

  return (
    <CalendarWorkspace
      posts={posts}
      connectedPlatforms={connectedPlatforms}
      connectedChannels={connectedChannels}
    />
  );
}
