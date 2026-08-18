import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createJob } from "@/lib/creator/pipeline";
import {
  listJobs,
  toUiProject,
} from "@/lib/creator/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const jobs = await listJobs();
    return NextResponse.json({
      projects: jobs.map((j) => toUiProject(j as never)),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const mediaId = String(body.mediaId || "");

    let resolvedMediaId = mediaId;
    if (!resolvedMediaId) {
      // Legacy path: register a Media row from a provided URL.
      if (!body.url) {
        return NextResponse.json(
          { error: "mediaId or url is required." },
          { status: 400 },
        );
      }
      const media = await prisma.media.create({
        data: {
          url: String(body.url),
          filename: String(body.filename || "video.mp4"),
          mimeType: String(body.mimeType || "video/mp4"),
          size: Number(body.size) || 0,
          type: "VIDEO",
        },
      });
      resolvedMediaId = media.id;
    }

    const jobId = await createJob(resolvedMediaId);
    const job = await prisma.contentJob.findUnique({ where: { id: jobId } });
    return NextResponse.json({ project: toUiProject(job as never) });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create project.",
      },
      { status: 500 },
    );
  }
}
