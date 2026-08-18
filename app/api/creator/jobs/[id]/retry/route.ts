import { NextResponse } from "next/server";
import { retryJob } from "@/lib/creator/pipeline";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await retryJob(id);
    return NextResponse.json({ success: true, status: "PROCESSING" });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "RETRY_FAILED",
          message: error instanceof Error ? error.message : "Retry failed.",
          retryable: false,
        },
      },
      { status: 400 },
    );
  }
}
