import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const userId = getSessionUserId(request);

  if (!userId) {
    return NextResponse.json(
      { error: "You must be logged in to connect LinkedIn." },
      { status: 401 },
    );
  }

  const url = new URL(request.url);

  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    return NextResponse.json(
      {
        error,
        description: url.searchParams.get("error_description"),
      },
      { status: 400 },
    );
  }

  if (!code) {
    return NextResponse.json(
      { error: "Missing LinkedIn authorization code." },
      { status: 400 },
    );
  }

  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  const appUrl = process.env.APP_URL;

  if (!clientId || !clientSecret || !appUrl) {
    return NextResponse.json(
      {
        error: "LinkedIn OAuth environment variables are not configured.",
      },
      { status: 500 },
    );
  }

  const redirectUri =
    `${appUrl}/api/publishing/linkedin/callback`;

  const tokenResponse = await fetch(
    "https://www.linkedin.com/oauth/v2/accessToken",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }),
    },
  );

  const tokenData = await tokenResponse.json();

  if (!tokenResponse.ok) {
    console.error(
      "LinkedIn token exchange failed:",
      tokenData,
    );

    return NextResponse.json(
      {
        error: "LinkedIn token exchange failed.",
        details: tokenData,
      },
      { status: 400 },
    );
  }

  if (!tokenData.access_token) {
    return NextResponse.json(
      { error: "LinkedIn did not return an access token." },
      { status: 400 },
    );
  }

  const expiresAt = tokenData.expires_in
    ? new Date(
        Date.now() +
          Number(tokenData.expires_in) * 1000,
      )
    : null;

const userInfoResponse = await fetch(
  "https://" + "api.linkedin.com/v2/userinfo",
  {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
    },
  },
);

if (!userInfoResponse.ok) {
  const errorBody = await userInfoResponse.text();

  console.error("[LinkedIn] UserInfo lookup failed:", {
    status: userInfoResponse.status,
    body: errorBody,
  });

  return NextResponse.json(
    {
      error: "Unable to retrieve LinkedIn member identity.",
      details: errorBody,
    },
    { status: 400 },
  );
}

const userInfo = await userInfoResponse.json();

if (!userInfo.sub) {
  return NextResponse.json(
    { error: "LinkedIn did not return a member identifier." },
    { status: 400 },
  );
}

const authorUrn = `urn:li:person:${userInfo.sub}`;

console.log("[LinkedIn] Member identity:", {
  sub: userInfo.sub,
  authorUrn,
});

await prisma.publishingChannel.upsert({
    where: {
      userId_platform: {
        userId,
        platform: "LinkedIn",
      },
    },
    create: {
      userId,
      platform: "LinkedIn",
      connected: true,
      accountName: "LinkedIn account",
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token ?? null,
      expiresAt,
      authorUrn,
    },
    update: {
      connected: true,
      accountName: "LinkedIn account",
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token ?? null,
      expiresAt,
      authorUrn,
    },
  });

  console.log("[LinkedIn] OAuth connection saved.", {
    expiresAt,
    accessTokenSaved: Boolean(tokenData.access_token),
    refreshTokenSaved: Boolean(tokenData.refresh_token),
  });

  return NextResponse.redirect(
    new URL(
      "/publishing?linkedin=connected",
      appUrl,
    ),
  );
}
