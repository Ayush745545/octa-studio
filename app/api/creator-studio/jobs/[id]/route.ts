import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getJob, toUiJob } from "@/lib/creator/db";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const job = await getJob(id);
    if (!job) {
      return NextResponse.json({ error: "Job not found." }, { status: 404 });
    }
    return NextResponse.json({ job: toUiJob(job as never, null) });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to load job.",
      },
      { status: 500 },
    );
  }
}
