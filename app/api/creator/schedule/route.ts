import { NextResponse } from "next/server";
import { scheduleJob } from "@/lib/creator/schedule";
import type { Platform } from "@/lib/creator-studio/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const jobId = String(body.jobId || "");
    const clipIds = Array.isArray(body.clipIds) ? body.clipIds : [];
    const strategy = String(body.strategy || "ai");

    if (!jobId) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "INVALID_INPUT", message: "jobId is required." },
        },
        { status: 400 },
      );
    }
    if (clipIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "INVALID_INPUT", message: "clipIds are required." },
        },
        { status: 400 },
      );
    }

    const result = await scheduleJob({
      jobId,
      clipIds,
      strategy: strategy as "ai" | "manual",
      slots: Array.isArray(body.slots)
        ? body.slots.map(
            (s: { clipId: string; platform?: string; scheduledAt: string }) => ({
              clipId: s.clipId,
              platform: (s.platform ?? "Instagram") as Platform,
              scheduledAt: s.scheduledAt,
            }),
          )
        : undefined,
    });

    return NextResponse.json({
      success: true,
      contentCreated: result.contentCreated,
      publicationsCreated: result.publicationsCreated,
      failed: result.failed,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SCHEDULE_FAILED",
          message:
            error instanceof Error ? error.message : "Scheduling failed.",
          retryable: false,
        },
      },
      { status: 400 },
    );
  }
}
