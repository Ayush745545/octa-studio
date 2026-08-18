import { NextRequest, NextResponse } from "next/server";
import { scheduleJob } from "@/lib/creator/schedule";
import { getSessionUserId } from "@/lib/auth";
import type { Platform } from "@/lib/creator-studio/types";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const userId = getSessionUserId(request);

    if (!userId) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 },
      );
    }

    const body = await request.json();

    const projectId = String(body.projectId || "");
    const slots = Array.isArray(body.slots) ? body.slots : [];

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required." },
        { status: 400 },
      );
    }

    if (slots.length === 0) {
      return NextResponse.json(
        { error: "No clips selected for scheduling." },
        { status: 400 },
      );
    }

    const result = await scheduleJob({
      jobId: projectId,
      userId,
      clipIds: slots.map((s: { clipId: string }) => s.clipId),
      strategy: "ai",
      slots: slots.map(
        (s: {
          clipId: string;
          platform?: string;
          scheduledAt: string;
        }) => ({
          clipId: s.clipId,
          platform: (s.platform ?? "Instagram") as Platform,
          scheduledAt: s.scheduledAt,
        }),
      ),
    });

    if (result.failed.length > 0 && result.contentCreated === 0) {
      return NextResponse.json(
        {
          error: "Scheduling failed for all selected clips.",
          result,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    console.error("[Creator Studio] Scheduling failed:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Scheduling failed.",
      },
      { status: 500 },
    );
  }
}
