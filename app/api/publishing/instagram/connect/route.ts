import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const userId = getSessionUserId(request);

  if (!userId) {
    return NextResponse.redirect(
      new URL("/login", request.url),
    );
  }

  const appUrl = process.env.APP_URL;
  const clientId = process.env.INSTAGRAM_CLIENT_ID;

  if (!appUrl || !clientId) {
    console.error("[Instagram] Missing OAuth configuration.", {
      APP_URL: Boolean(appUrl),
      INSTAGRAM_CLIENT_ID: Boolean(clientId),
    });

    return NextResponse.json(
      {
        error:
          "Instagram OAuth is not configured. Check APP_URL and INSTAGRAM_CLIENT_ID.",
      },
      { status: 500 },
    );
  }

  const redirectUri =
    `${appUrl}/api/publishing/instagram/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope:
      "instagram_business_basic,instagram_business_content_publish",
  });

  const authorizationUrl =
    `https://www.instagram.com/oauth/authorize?${params.toString()}`;

  console.log("[Instagram] Starting OAuth", {
    userId,
    clientId,
    redirectUri,
  });

  return NextResponse.redirect(authorizationUrl);
}
