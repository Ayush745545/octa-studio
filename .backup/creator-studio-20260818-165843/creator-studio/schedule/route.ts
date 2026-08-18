import { NextResponse } from "next/server";
import { scheduleJob } from "@/lib/creator/schedule";
import type { Platform } from "@/lib/creator-studio/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const projectId = String(body.projectId || "");

    const slots = Array.isArray(body.slots) ? body.slots : [];
    if (slots.length === 0) {
      return NextResponse.json(
        { error: "No clips selected for scheduling." },
        { status: 400 },
      );
    }

    const result = await scheduleJob({
      jobId: projectId,
      clipIds: slots.map((s: { clipId: string }) => s.clipId),
      strategy: "ai",
      slots: slots.map(
        (s: { clipId: string; platform?: string; scheduledAt: string }) => ({
          clipId: s.clipId,
          platform: (s.platform ?? "Instagram") as Platform,
          scheduledAt: s.scheduledAt,
        }),
      ),
    });

    if (result.failed.length > 0 && result.contentCreated === 0) {
      return NextResponse.json(
        { error: "Scheduling failed for all selected clips.", result },
        { status: 500 },
      );
    }

    let warning: string | undefined;
    if (result.contentCreated === 0 && result.failed.length === 0) {
      warning =
        "All selected clips are already scheduled. View them in the Social Inbox.";
    } else if (result.publicationsCreated === 0) {
      warning =
        "Content scheduled. Connect Instagram/YouTube/TikTok/Facebook in Publishing to enable auto-publishing via the calendar.";
    }

    return NextResponse.json({
      ok: true,
      ...result,
      warning,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Scheduling failed.",
      },
      { status: 500 },
    );
  }
}
