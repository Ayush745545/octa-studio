import { NextResponse } from "next/server";
import { processScheduledPublications } from "@/app/publishing/engine/process-scheduled";

export async function POST() {
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
      {
        status: 500,
      },
    );
  }
}
