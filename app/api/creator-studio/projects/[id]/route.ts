import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getJob,
  listClips,
  toUiClip,
  toUiJob,
  toUiProject,
  deleteProjectFiles,
} from "@/lib/creator/db";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const ok = await deleteProjectFiles(id);
    if (!ok) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to delete project.",
      },
      { status: 500 },
    );
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const job = await getJob(id);
    if (!job) {
      return NextResponse.json(
        { error: "Project not found." },
        { status: 404 },
      );
    }

    const clips = await listClips(id);
    const uiClips = clips.map((c) => toUiClip(c as never));

    return NextResponse.json({
      project: toUiProject(job as never),
      clips: uiClips,
      job: toUiJob(job as never, null),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to load project.",
      },
      { status: 500 },
    );
  }
}
