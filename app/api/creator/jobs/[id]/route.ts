import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getJob } from "@/lib/creator/db";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const job = await getJob(id);
    if (!job) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Job not found." } },
        { status: 404 },
      );
    }

    const stages = await prisma.pipelineStage.findMany({
      where: { jobId: id },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      id: job.id,
      status: job.status,
      progress: job.progress,
      currentStage: job.currentStage,
      error: job.errorMessage ?? job.error ?? undefined,
      stages: stages.map((s) => ({
        name: s.name,
        status: s.status,
        progress: s.progress,
        retryCount: s.retryCount,
        error: s.error ?? undefined,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "JOB_STATUS_FAILED",
          message:
            error instanceof Error ? error.message : "Failed to load job.",
        },
      },
      { status: 500 },
    );
  }
}
