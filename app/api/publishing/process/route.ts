import { NextRequest, NextResponse } from "next/server";
import { processScheduledPublications } from "@/app/publishing/engine/process-scheduled";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET;

  if (!expected) {
    console.error("[CRON] CRON_SECRET is not configured.");

    return NextResponse.json(
      { error: "CRON_SECRET is not configured." },
      { status: 500 },
    );
  }

  if (authorization !== `Bearer ${expected}`) {
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401 },
    );
  }

  try {
    const startedAt = new Date();

    console.log(
      `[CRON] Scheduled publishing started at ${startedAt.toISOString()}`,
    );

    const result = await processScheduledPublications();

    console.log("[CRON] Scheduled publishing finished:", result);

    return NextResponse.json({
      ...result,
      processedAt: startedAt.toISOString(),
    });
  } catch (error) {
    console.error("[CRON] Scheduled publishing failed:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to process scheduled publications.",
      },
      { status: 500 },
    );
  }
}
