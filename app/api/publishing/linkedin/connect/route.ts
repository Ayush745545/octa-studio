import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";

export async function GET(request: NextRequest) {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const appUrl = process.env.APP_URL;

  if (!clientId || !appUrl) {
    return NextResponse.json(
      {
        error: "LinkedIn OAuth environment variables are not configured.",
      },
      { status: 500 },
    );
  }

  const redirectUri =
    `${appUrl}/api/publishing/linkedin/callback`;

  const state = crypto.randomBytes(32).toString("hex");

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "openid profile w_member_social",
    state,
  });

  const authorizationUrl =
    `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;

  console.log("[LinkedIn] Starting OAuth", {
    redirectUri,
    scope: "openid profile w_member_social",
  });

  return NextResponse.redirect(authorizationUrl);
}
