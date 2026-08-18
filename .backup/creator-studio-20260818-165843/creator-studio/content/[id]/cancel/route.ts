import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const content = await prisma.content.findUnique({
      where: { id },
    });
    if (!content) {
      return NextResponse.json({ error: "Content not found." }, { status: 404 });
    }

    // Remove the schedule. Drop unsent publications, reset the content so it
    // can be re-scheduled later from Creator Studio.
    await prisma.publication.deleteMany({
      where: {
        contentId: id,
        status: { in: ["SCHEDULED", "QUEUED", "FAILED"] },
      },
    });

    const updated = await prisma.content.update({
      where: { id },
      data: { status: "READY", scheduledAt: null, publishedAt: null },
    });

    return NextResponse.json({ content: updated });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to cancel." },
      { status: 500 },
    );
  }
}
