import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateJob } from "@/lib/creator/db";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const projectId = String(body.projectId || "");

    const job = await prisma.contentJob.findUnique({ where: { id: projectId } });
    if (!job) {
      return NextResponse.json(
        { error: "Project not found." },
        { status: 404 },
      );
    }

    // The HTTP request only (re)queues the job; the persistent worker does
    // the actual processing, so this returns immediately.
    if (job.status === "QUEUED" || job.status === "FAILED") {
      await updateJob(projectId, {
        status: "QUEUED",
        lockedAt: null,
        workerId: null,
        error: null,
        errorMessage: null,
        currentTask: "Queued — waiting for worker",
      });
    }

    return NextResponse.json({ jobId: projectId });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to start analysis.",
      },
      { status: 500 },
    );
  }
}
