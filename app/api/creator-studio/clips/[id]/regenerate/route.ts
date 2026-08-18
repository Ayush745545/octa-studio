import { NextResponse } from "next/server";
import { regenerateClip } from "@/lib/creator/pipeline";
import { getClip, toUiClip } from "@/lib/creator/db";

export const dynamic = "force-dynamic";

/**
 * Re-renders a single clip from its real source segment. Updates the clip
 * with the new video/thumbnail URLs and Media record.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const clip = await getClip(id);
    if (!clip) {
      return NextResponse.json({ error: "Clip not found." }, { status: 404 });
    }

    await regenerateClip(id);
    const updated = await getClip(id);
    return NextResponse.json({ clip: toUiClip(updated as never) });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Regeneration failed.";
    await getClip(id)
      .then((c) => c && updateClipSafe(id, message))
      .catch(() => {});
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function updateClipSafe(id: string, message: string) {
  const { updateClip } = await import("@/lib/creator/db");
  await updateClip(id, { status: "FAILED", error: message });
}
