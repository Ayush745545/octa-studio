import { prisma } from "@/lib/prisma";
import { LandingClient } from "@/components/landing-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "ContentOS — Your Content Operating System",
  description:
    "Plan, create, schedule, and publish content from one workspace.",
};

export default async function Home() {
  let ideaCount = 0;
  let contentCount = 0;
  let publishedCount = 0;
  let channelCount = 0;

  try {
    [ideaCount, contentCount, publishedCount, channelCount] =
      await Promise.all([
        prisma.idea.count(),
        prisma.content.count(),
        prisma.content.count({ where: { status: "PUBLISHED" } }),
        prisma.publishingChannel.count({ where: { connected: true } }),
      ]);
  } catch {
    // Database not configured/reachable (e.g. preview deploy without
    // DATABASE_URL) — render the landing page with zero counts instead of 500.
  }

  return (
    <LandingClient 
      ideaCount={ideaCount}
      contentCount={contentCount}
      publishedCount={publishedCount}
      channelCount={channelCount}
    />
  );
}
