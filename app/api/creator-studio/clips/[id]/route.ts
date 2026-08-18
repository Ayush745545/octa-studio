import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getClip,
  updateClip,
  deleteClipFiles,
  toUiClip,
} from "@/lib/creator/db";
import { CAPTION_STYLES, PLATFORMS } from "@/lib/creator-studio/types";
import type { CaptionStyle, Clip, Platform } from "@/lib/creator-studio/types";

export const dynamic = "force-dynamic";

const EDITABLE: (keyof Clip)[] = [
  "title",
  "caption",
  "hookOriginal",
  "hookAi",
  "useAiHook",
  "hashtags",
  "platforms",
  "captionStyle",
  "category",
  "recommendedTime",
  "status",
];

const STATUS_TO_DB: Record<string, string> = {
  draft: "PENDING",
  generating: "GENERATING",
  ready: "READY",
  scheduled: "SCHEDULED",
  failed: "FAILED",
  rejected: "REJECTED",
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const clip = await getClip(id);
    if (!clip) {
      return NextResponse.json({ error: "Clip not found." }, { status: 404 });
    }

    const body = await request.json();
    const patch: Record<string, unknown> = {};

    for (const key of EDITABLE) {
      if (key in body) patch[key] = body[key];
    }

    if (patch.hashtags && Array.isArray(patch.hashtags)) {
      patch.hashtags = patch.hashtags.map((t: string) =>
        String(t).replace(/^#/, "").trim().toLowerCase(),
      );
    }
    if (patch.platforms && Array.isArray(patch.platforms)) {
      patch.platforms = patch.platforms.filter((p): p is Platform =>
        PLATFORMS.includes(p as Platform),
      );
    }
    if (
      patch.captionStyle &&
      !CAPTION_STYLES.includes(patch.captionStyle as CaptionStyle)
    ) {
      delete patch.captionStyle;
    }
    if (patch.status && typeof patch.status === "string") {
      patch.status = STATUS_TO_DB[patch.status] ?? "PENDING";
    }

    if (patch.hookAi || patch.hookOriginal) {
      patch.hook =
        patch.hookAi ?? clip.hookAi ?? clip.hookOriginal ?? clip.hook ?? null;
    }

    await updateClip(id, patch);
    const updated = await getClip(id);
    return NextResponse.json({ clip: toUiClip(updated as never) });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to update clip.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const ok = await deleteClipFiles(id);
    if (!ok) {
      return NextResponse.json({ error: "Clip not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to delete clip.",
      },
      { status: 500 },
    );
  }
}
