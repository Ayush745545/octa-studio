import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createJob } from "@/lib/creator/pipeline";
import { listJobs } from "@/lib/creator/db";
import { getSessionUserId } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const userId = getSessionUserId(request);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "You must be logged in." } },
        { status: 401 },
      );
    }
    const body = await request.json();
    const mediaId = String(body.mediaId || "");
    if (!mediaId) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "INVALID_INPUT", message: "mediaId is required." },
        },
        { status: 400 },
      );
    }

    const media = await prisma.media.findUnique({ where: { id: mediaId } });
    if (!media) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "MEDIA_NOT_FOUND", message: "Media not found." },
        },
        { status: 404 },
      );
    }

    // Create the job and return immediately — processing is done by the
    // persistent background worker, never inside this request.
    const jobId = await createJob(mediaId, userId);

    return NextResponse.json({ success: true, jobId, status: "QUEUED" });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "JOB_CREATE_FAILED",
          message:
            error instanceof Error ? error.message : "Failed to create job.",
          retryable: false,
        },
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  const jobs = await listJobs();
  return NextResponse.json({
    jobs: jobs.map((j) => ({
      id: j.id,
      status: j.status,
      progress: j.progress,
      currentStage: j.currentStage,
      createdAt: j.createdAt,
    })),
  });
}
