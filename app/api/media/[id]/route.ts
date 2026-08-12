import { NextResponse } from "next/server";
import { unlink } from "node:fs/promises";
import path from "node:path";

import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function DELETE(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const { id } = await params;

    const media = await prisma.media.findUnique({
      where: { id },
    });

    if (!media) {
      return NextResponse.json(
        { error: "Media not found." },
        { status: 404 },
      );
    }

    const filePath = path.join(
      process.cwd(),
      "public",
      media.url.replace(/^\/+/, ""),
    );

    try {
      await unlink(filePath);
    } catch (error) {
      const code =
        error &&
        typeof error === "object" &&
        "code" in error
          ? error.code
          : undefined;

      if (code !== "ENOENT") {
        throw error;
      }
    }

    await prisma.media.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      id,
    });
  } catch (error) {
    console.error("Media delete failed:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Media delete failed.",
      },
      { status: 500 },
    );
  }
}
