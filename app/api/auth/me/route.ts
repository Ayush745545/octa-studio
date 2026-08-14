import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { FREE_GENERATION_LIMIT, getSessionUserId } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const userId = getSessionUserId(request);

    let user: { id: string; email: string; name: string | null; plan: string; avatarUrl: string | null } | null = null;
    if (userId) {
      const record = await prisma.user.findUnique({ where: { id: userId } });
      if (record) {
        user = { id: record.id, email: record.email, name: record.name, plan: record.plan, avatarUrl: record.avatarUrl };
      }
    }

    const used = await prisma.generation.count({ where: { userId } });

    return NextResponse.json({
      user,
      usage: { used, limit: FREE_GENERATION_LIMIT },
    });
  } catch (error) {
    console.error("[auth] me error:", error);
    return NextResponse.json({ user: null, usage: { used: 0, limit: FREE_GENERATION_LIMIT } });
  }
}
