import { NextResponse } from "next/server";
import {
  mkdir,
  writeFile,
  readFile,
  appendFile,
  unlink,
  stat,
} from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const UPLOAD_ROOT = path.join(process.cwd(), ".data", "uploads");
const MAX_UPLOAD_SIZE = 10 * 1024 * 1024 * 1024; // 10 GB
const MAX_CHUNK_SIZE = 25 * 1024 * 1024; // 25 MB

const ALLOWED_EXTENSIONS = new Set([
  ".mp4",
  ".mov",
  ".webm",
  ".m4v",
]);

export async function POST(request: Request) {
  try {
    const uploadId = request.headers.get("x-upload-id");
    const chunkIndex = Number(request.headers.get("x-chunk-index"));
    const totalChunks = Number(request.headers.get("x-total-chunks"));
    const encodedFilename =
      request.headers.get("x-file-name");

    const filename = encodedFilename
      ? decodeURIComponent(encodedFilename)
      : "video.mp4";
    const totalSize = Number(request.headers.get("x-file-size"));

    if (!uploadId) {
      return NextResponse.json(
        { error: "Missing x-upload-id." },
        { status: 400 },
      );
    }

    if (
      !Number.isInteger(chunkIndex) ||
      chunkIndex < 0 ||
      !Number.isInteger(totalChunks) ||
      totalChunks <= 0 ||
      chunkIndex >= totalChunks
    ) {
      return NextResponse.json(
        { error: "Invalid chunk information." },
        { status: 400 },
      );
    }

    if (
      !Number.isFinite(totalSize) ||
      totalSize <= 0 ||
      totalSize > MAX_UPLOAD_SIZE
    ) {
      return NextResponse.json(
        { error: "Video must be between 1 byte and 10 GB." },
        { status: 400 },
      );
    }

    if (chunkIndex === 0) {
      const extension = path.extname(filename).toLowerCase();

      if (!ALLOWED_EXTENSIONS.has(extension)) {
        return NextResponse.json(
          { error: `Unsupported video extension: ${extension}` },
          { status: 400 },
        );
      }
    }

    const body = Buffer.from(await request.arrayBuffer());

    if (body.length === 0) {
      return NextResponse.json(
        { error: "Empty chunk." },
        { status: 400 },
      );
    }

    if (body.length > MAX_CHUNK_SIZE) {
      return NextResponse.json(
        { error: "Chunk exceeds 25 MB." },
        { status: 400 },
      );
    }

    const safeId = uploadId.replace(/[^a-zA-Z0-9_-]/g, "");
    const dir = path.join(UPLOAD_ROOT, safeId);

    await mkdir(dir, { recursive: true });

    const chunkPath = path.join(
      dir,
      `chunk-${String(chunkIndex).padStart(6, "0")}`,
    );

    await writeFile(chunkPath, body);

    return NextResponse.json({
      success: true,
      uploadId,
      chunkIndex,
      totalChunks,
      receivedBytes: body.length,
      complete: chunkIndex === totalChunks - 1,
    });
  } catch (error) {
    console.error("[chunk-upload]", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Chunk upload failed.",
      },
      { status: 500 },
    );
  }
}
