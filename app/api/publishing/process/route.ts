import { NextRequest, NextResponse } from "next/server";
import { processScheduledPublications } from "@/app/publishing/engine/process-scheduled";

export async function POST(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET;

  if (!expected) {
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
    const result = await processScheduledPublications();

    return NextResponse.json(result);
  } catch (error) {
    console.error("Scheduled publishing failed:", error);

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
