import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { scheduledAt } = await req.json();
    if (!scheduledAt) {
      return NextResponse.json(
        { error: "scheduledAt is required." },
        { status: 400 },
      );
    }
    const when = new Date(scheduledAt);
    if (Number.isNaN(when.getTime())) {
      return NextResponse.json(
        { error: "Invalid scheduledAt." },
        { status: 400 },
      );
    }

    const content = await prisma.content.findUnique({ where: { id } });
    if (!content) {
      return NextResponse.json({ error: "Content not found." }, { status: 404 });
    }

    // Keep any downstream publications in sync with the new time.
    await prisma.publication.updateMany({
      where: { contentId: id, status: { in: ["SCHEDULED", "QUEUED"] } },
      data: { scheduledAt: when },
    });

    const updated = await prisma.content.update({
      where: { id },
      data: { scheduledAt: when },
    });

    return NextResponse.json({ content: updated });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to reschedule." },
      { status: 500 },
    );
  }
}
