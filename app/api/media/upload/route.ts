import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { prisma } from "@/lib/prisma";

const MAX_FILE_SIZE = 50 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";

    if (
      !contentType.startsWith("multipart/form-data") &&
      !contentType.startsWith("application/x-www-form-urlencoded")
    ) {
      return NextResponse.json(
        { error: "Content-Type must be multipart/form-data." },
        { status: 400 },
      );
    }

    const formData = await request.formData();

    const file = formData.get("file");
    const contentId = formData.get("contentId");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "File is required." },
        { status: 400 },
      );
    }

    if (typeof contentId !== "string" || !contentId) {
      return NextResponse.json(
        { error: "contentId is required." },
        { status: 400 },
      );
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type}` },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File must be smaller than 50 MB." },
        { status: 400 },
      );
    }

    const content = await prisma.content.findUnique({
      where: { id: contentId },
      select: { id: true },
    });

    if (!content) {
      return NextResponse.json(
        { error: "Content not found." },
        { status: 404 },
      );
    }

    const extension = path.extname(file.name) || "";
    const filename = `${randomUUID()}${extension}`;

    const uploadDir = path.join(process.cwd(), "public", "uploads");

    await mkdir(uploadDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());

    await writeFile(
      path.join(uploadDir, filename),
      buffer,
    );

    const type = file.type.startsWith("video/")
      ? "VIDEO"
      : "IMAGE";

    const media = await prisma.media.create({
      data: {
        contentId,
        url: `/uploads/${filename}`,
        filename: file.name,
        mimeType: file.type,
        size: file.size,
        type,
      },
    });

    return NextResponse.json({
      success: true,
      media,
    });
  } catch (error) {
    console.error("Media upload failed:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Media upload failed.",
      },
      { status: 500 },
    );
  }
}
