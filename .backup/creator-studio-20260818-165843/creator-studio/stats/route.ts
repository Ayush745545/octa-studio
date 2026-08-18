import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [jobs, clips] = await Promise.all([
      prisma.contentJob.findMany(),
      prisma.contentClip.findMany(),
    ]);

    const ready = clips.filter((c) => c.status === "READY");
    const scheduled = clips.filter((c) => c.status === "SCHEDULED");
    const avgScore =
      ready.length > 0
        ? Math.round(
            ready.reduce((sum, c) => sum + (c.score || 0), 0) / ready.length,
          )
        : 0;

    return NextResponse.json({
      videosAnalyzed: jobs.filter(
        (j) => j.status === "READY_FOR_REVIEW" || j.status === "COMPLETED",
      ).length,
      shortsGenerated: clips.length,
      contentReady: ready.length,
      scheduledPosts: scheduled.length,
      avgScore,
      totalProjects: jobs.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to load stats.",
      },
      { status: 500 },
    );
  }
}
