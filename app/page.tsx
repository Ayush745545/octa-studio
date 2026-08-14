import { prisma } from "@/lib/prisma";
import { LandingClient } from "@/components/landing-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "ContentOS — Your Content Operating System",
  description:
    "Plan, create, schedule, and publish content from one workspace.",
};

export default async function Home() {
  const [ideaCount, contentCount, publishedCount, channelCount] =
    await Promise.all([
      prisma.idea.count(),
      prisma.content.count(),
      prisma.content.count({ where: { status: "PUBLISHED" } }),
      prisma.publishingChannel.count({ where: { connected: true } }),
    ]);

  return (
    <LandingClient 
      ideaCount={ideaCount}
      contentCount={contentCount}
      publishedCount={publishedCount}
      channelCount={channelCount}
    />
  );
}
