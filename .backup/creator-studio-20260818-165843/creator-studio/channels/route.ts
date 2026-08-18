import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const channels = await prisma.publishingChannel.findMany({
    where: { connected: true },
    select: { id: true, platform: true },
  });
  return NextResponse.json({
    connected: channels.map((c) => c.platform),
    hasChannel: channels.length > 0,
  });
}
