import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const media = await prisma.media.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: 50,
  });

  return NextResponse.json({
    media: media.map((item) => ({
      id: item.id,
      url: item.url,
      filename: item.filename,
      mimeType: item.mimeType,
      size: item.size,
      type: item.type,
      createdAt: item.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const contentId = String(body.contentId || "").trim();
    const url = String(body.url || "").trim();
    const filename = String(body.filename || "").trim();
    const mimeType = String(body.mimeType || "image/jpeg").trim();
    const size = Number(body.size || 0);
    const type = String(body.type || "IMAGE").trim();

    if (!contentId || !url) {
      return NextResponse.json(
        { error: "contentId and url are required." },
        { status: 400 },
      );
    }

    const media = await prisma.media.create({
      data: {
        contentId,
        url,
        filename,
        mimeType,
        size,
        type,
      },
    });

    return NextResponse.json({
      success: true,
      media: {
        id: media.id,
        url: media.url,
        filename: media.filename,
        mimeType: media.mimeType,
        size: media.size,
        type: media.type,
        createdAt: media.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Media create failed:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Media creation failed.",
      },
      { status: 500 },
    );
  }
}
