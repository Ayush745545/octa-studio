import { NextResponse } from "next/server";
import { approveJob } from "@/lib/creator/pipeline";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await approveJob(id);
    return NextResponse.json({ success: true, status: "APPROVED" });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "APPROVE_FAILED",
          message:
            error instanceof Error ? error.message : "Approval failed.",
          retryable: false,
        },
      },
      { status: 400 },
    );
  }
}
