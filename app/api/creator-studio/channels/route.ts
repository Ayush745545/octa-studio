import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const userId = getSessionUserId(request);

    if (!userId) {
      return NextResponse.json(
        {
          connected: [],
          channels: [],
          hasChannel: false,
        },
        { status: 401 },
      );
    }

    const channels = await prisma.publishingChannel.findMany({
      where: {
        userId,
        connected: true,
      },
      select: {
        id: true,
        platform: true,
        accountName: true,
        externalId: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json({
      connected: channels.map((c) => c.platform),
      channels,
      hasChannel: channels.length > 0,
    });
  } catch (error) {
    console.error("[Creator Studio] Failed to load channels:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load connected channels.",
      },
      { status: 500 },
    );
  }
}
