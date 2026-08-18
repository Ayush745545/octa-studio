import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { prisma } from "@/lib/prisma";

const MAX_FILE_SIZE = 50 * 1024 * 1024;

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "video/mp4": ".mp4",
  "video/webm": ".webm",
};

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const url = String(body.url || "").trim();
    const requestedName = String(body.filename || "").trim();
    const requestedType = String(body.mimeType || "").trim();

    if (!url.startsWith("https://")) {
      return NextResponse.json(
        { error: "Only https:// URLs can be imported." },
        { status: 400 },
      );
    }

    const res = await fetch(url);

    if (!res.ok) {
      return NextResponse.json(
        { error: `Remote server returned ${res.status}.` },
        { status: 502 },
      );
    }

    const contentType = (res.headers.get("content-type") ?? "").split(";")[0];
    const mimeType = ALLOWED_TYPES[contentType]
      ? contentType
      : ALLOWED_TYPES[requestedType]
        ? requestedType
        : null;

    if (!mimeType) {
      return NextResponse.json(
        { error: `Unsupported file type: ${contentType || requestedType}` },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await res.arrayBuffer());

    if (buffer.length === 0) {
      return NextResponse.json(
        { error: "Remote file is empty." },
        { status: 400 },
      );
    }

    if (buffer.length > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File must be smaller than 50 MB." },
        { status: 400 },
      );
    }

    const extension = ALLOWED_TYPES[mimeType];
    const safeBase =
      requestedName.replace(/[^\w.-]+/g, "-").slice(0, 40) || "stock";
    const filename = `${safeBase}-${randomUUID().slice(0, 8)}${extension}`;

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, filename), buffer);

    const type = mimeType.startsWith("video/") ? "VIDEO" : "IMAGE";

    const media = await prisma.media.create({
      data: {
        contentId: null,
        url: `/uploads/${filename}`,
        filename: requestedName || filename,
        mimeType,
        size: buffer.length,
        type,
      },
    });

    return NextResponse.json({ success: true, media });
  } catch (error) {
    console.error("Media import failed:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Media import failed.",
      },
      { status: 500 },
    );
  }
}
