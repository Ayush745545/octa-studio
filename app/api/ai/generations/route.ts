import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const userId = getSessionUserId(request);
    const items = await prisma.generation.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json({ items });
  } catch (error) {
    console.error("[ai] generations list error:", error);
    return NextResponse.json({ items: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getSessionUserId(request);
    const body = await request.json();

    const prompt = String(body.prompt || "").trim();
    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
    }

    const item = await prisma.generation.create({
      data: {
        userId,
        type: String(body.type || "text"),
        tool: body.tool ? String(body.tool) : null,
        platform: body.platform ? String(body.platform) : null,
        prompt,
        result: body.result ? String(body.result) : null,
      },
    });

    return NextResponse.json({ item });
  } catch (error) {
    console.error("[ai] generations save error:", error);
    return NextResponse.json({ error: "Could not save the generation." }, { status: 500 });
  }
}
