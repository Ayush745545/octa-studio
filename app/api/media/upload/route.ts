import { NextResponse } from "next/server";
import { mkdir, unlink, writeFile, stat } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { prisma } from "@/lib/prisma";

const execFileAsync = promisify(execFile);

const MAX_FILE_SIZE = 500 * 1024 * 1024;

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

    let resolvedContentId: string | null = null;

    if (typeof contentId === "string" && contentId) {
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

      resolvedContentId = content.id;
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type}` },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File must be smaller than 500 MB." },
        { status: 400 },
      );
    }

    const extension = path.extname(file.name) || "";
    const filename = `${randomUUID()}${extension}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");

    await mkdir(uploadDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadedPath = path.join(uploadDir, filename);

    await writeFile(uploadedPath, buffer);

    let finalFilename = filename;
    let finalMimeType = file.type;
    let finalSize = file.size;

    /*
     * Normalize video uploads with FFmpeg.
     *
     * This makes phone rotation metadata permanent in the rendered
     * pixels so portrait videos display upright in the browser.
     */
    if (file.type.startsWith("video/")) {
      const normalizedFilename = `${randomUUID()}.mp4`;
      const normalizedPath = path.join(uploadDir, normalizedFilename);

      try {
        await execFileAsync("ffmpeg", [
          "-y",
          "-i",
          uploadedPath,
          "-map_metadata",
          "-1",
          "-c:v",
          "libx264",
          "-preset",
          "veryfast",
          "-crf",
          "18",
          "-c:a",
          "aac",
          "-movflags",
          "+faststart",
          normalizedPath,
        ]);

        await unlink(uploadedPath);

        const normalizedStats = await stat(normalizedPath);

        finalFilename = normalizedFilename;
        finalMimeType = "video/mp4";
        finalSize = normalizedStats.size;
      } catch (ffmpegError) {
        console.warn(
          "FFmpeg normalization failed; keeping original upload:",
          ffmpegError,
        );
      }
    }

    const type = file.type.startsWith("video/")
      ? "VIDEO"
      : "IMAGE";

    const media = await prisma.media.create({
      data: {
        contentId: resolvedContentId,
        url: `/uploads/${finalFilename}`,
        filename: file.name,
        mimeType: finalMimeType,
        size: finalSize,
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
