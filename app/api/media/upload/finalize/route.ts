import { NextResponse } from "next/server";
import {
  mkdir,
  readFile,
  readdir,
  appendFile,
  unlink,
  rm,
  stat,
} from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { prisma } from "@/lib/prisma";

const execFileAsync = promisify(execFile);

const UPLOAD_ROOT = path.join(process.cwd(), ".data", "uploads");
const PUBLIC_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

const MAX_UPLOAD_SIZE = 10 * 1024 * 1024 * 1024;

function safeFilename(filename: string) {
  return path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const uploadId = String(body.uploadId || "");
    const filename = safeFilename(String(body.filename || "video.mp4"));
    const totalChunks = Number(body.totalChunks);
    const totalSize = Number(body.totalSize);

    if (!uploadId) {
      return NextResponse.json(
        { error: "uploadId is required." },
        { status: 400 },
      );
    }

    if (!Number.isInteger(totalChunks) || totalChunks <= 0) {
      return NextResponse.json(
        { error: "Invalid totalChunks." },
        { status: 400 },
      );
    }

    if (!Number.isFinite(totalSize) || totalSize <= 0 || totalSize > MAX_UPLOAD_SIZE) {
      return NextResponse.json(
        { error: "Invalid video size." },
        { status: 400 },
      );
    }

    const safeId = uploadId.replace(/[^a-zA-Z0-9_-]/g, "");
    const chunkDir = path.join(UPLOAD_ROOT, safeId);

    const files = await readdir(chunkDir);

    const chunks = files
      .filter((file) => /^chunk-\d+$/.test(file))
      .sort();

    if (chunks.length !== totalChunks) {
      return NextResponse.json(
        {
          error: `Missing chunks. Expected ${totalChunks}, received ${chunks.length}.`,
        },
        { status: 400 },
      );
    }

    await mkdir(PUBLIC_UPLOAD_DIR, { recursive: true });

    const originalExtension = path.extname(filename) || ".mp4";
    const sourceFilename = `${randomUUID()}${originalExtension}`;
    const sourcePath = path.join(PUBLIC_UPLOAD_DIR, sourceFilename);

    for (const chunk of chunks) {
      const chunkPath = path.join(chunkDir, chunk);
      const data = await readFile(chunkPath);
      await appendFile(sourcePath, data);
    }

    const sourceStats = await stat(sourcePath);

    if (sourceStats.size !== totalSize) {
      await unlink(sourcePath).catch(() => {});
      return NextResponse.json(
        {
          error: `Upload size mismatch. Expected ${totalSize}, got ${sourceStats.size}.`,
        },
        { status: 400 },
      );
    }

    const normalizedFilename = `${randomUUID()}.mp4`;
    const normalizedPath = path.join(
      PUBLIC_UPLOAD_DIR,
      normalizedFilename,
    );

    try {
      await execFileAsync("ffmpeg", [
        "-y",
        "-i",
        sourcePath,
        "-map_metadata",
        "-1",
        "-map",
        "0:v:0",
        "-map",
        "0:a?",
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-crf",
        "18",
        "-c:a",
        "aac",
        "-b:a",
        "192k",
        "-movflags",
        "+faststart",
        normalizedPath,
      ]);

      await unlink(sourcePath).catch(() => {});
    } catch (error) {
      console.warn(
        "[finalize-upload] FFmpeg normalization failed; keeping original:",
        error,
      );

      await unlink(normalizedPath).catch(() => {});
    }

    const finalPath = await stat(normalizedPath).catch(() => null);

    const finalFilename = finalPath
      ? normalizedFilename
      : sourceFilename;

    const finalSize = finalPath?.size ?? sourceStats.size;

    const media = await prisma.media.create({
      data: {
        url: `/uploads/${finalFilename}`,
        filename,
        mimeType: "video/mp4",
        size: finalSize,
        type: "VIDEO",
      },
    });

    await rm(chunkDir, { recursive: true, force: true });

    return NextResponse.json({
      success: true,
      media,
      uploadId,
    });
  } catch (error) {
    console.error("[finalize-upload]", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to finalize upload.",
      },
      { status: 500 },
    );
  }
}
