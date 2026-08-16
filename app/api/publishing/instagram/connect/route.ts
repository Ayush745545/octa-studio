import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const userId = getSessionUserId(request);

  if (!userId) {
    return NextResponse.json(
      { error: "You must be logged in to connect Instagram." },
      { status: 401 },
    );
  }

  const clientId = process.env.INSTAGRAM_CLIENT_ID;
  const appUrl = process.env.APP_URL;

  if (!clientId || !appUrl) {
    await prisma.publishingChannel.upsert({
      where: {
        userId_platform: {
          userId,
          platform: "Instagram",
        },
      },
      create: {
        userId,
        platform: "Instagram",
        connected: true,
        accountName: "Instagram (test mode)",
      },
      update: {
        connected: true,
        accountName: "Instagram (test mode)",
      },
    });

    console.log("[Instagram] Test-mode connection saved.", { userId });

    return NextResponse.redirect(
      new URL(
        "/publishing?instagram=connected",
        appUrl ?? "http://localhost:3000",
      ),
    );
  }

  const redirectUri = `${appUrl}/api/publishing/instagram/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope:
      "instagram_business_basic,instagram_business_content_publish",
  });

  const authorizationUrl =
    `https://www.instagram.com/oauth/authorize?${params.toString()}`;

  console.log("[Instagram] OAuth authorization:", {
    userId,
    redirectUri,
  });

  return NextResponse.redirect(authorizationUrl);
}
