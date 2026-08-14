import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const clientId = process.env.INSTAGRAM_CLIENT_ID;
  const appUrl = process.env.APP_URL;

  if (!clientId || !appUrl) {
    /*
     * Test mode: no Meta app configured. Connect a simulated Instagram
     * channel so the whole flow can be exercised end-to-end, matching the
     * project's simulated-fallback convention (see simulated provider).
     */
    await prisma.publishingChannel.upsert({
      where: { platform: "Instagram" },
      create: {
        platform: "Instagram",
        connected: true,
        accountName: "Instagram (test mode)",
      },
      update: {
        connected: true,
        accountName: "Instagram (test mode)",
      },
    });

    console.log(
      "[Instagram] Test-mode connection saved (no Meta app configured).",
    );

    return NextResponse.redirect(
      new URL(
        "/publishing?instagram=connected",
        appUrl ?? "http://localhost:3000",
      ),
    );
  }

  const redirectUri = `${appUrl}/api/publishing/instagram/callback`;

  /*
   * Business Login for Instagram: the app is configured for "API setup
   * with Instagram login", so authorization happens on instagram.com
   * with the Instagram App ID (not the Facebook dialog).
   */
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "instagram_business_basic,instagram_business_content_publish",
  });

  const authorizationUrl =
    `https://www.instagram.com/oauth/authorize?${params.toString()}`;

  console.log("[Instagram] OAuth authorization:", { redirectUri });

  return NextResponse.redirect(authorizationUrl);
}
