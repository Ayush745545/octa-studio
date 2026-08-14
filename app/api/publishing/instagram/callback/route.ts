import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const GRAPH = "https://graph.instagram.com";

export async function GET(request: Request) {
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
      { error: "Missing Instagram authorization code." },
      { status: 400 },
    );
  }

  const clientId = process.env.INSTAGRAM_CLIENT_ID;
  const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET;
  const appUrl = process.env.APP_URL;

  if (!clientId || !clientSecret || !appUrl) {
    return NextResponse.json(
      { error: "Instagram OAuth environment variables are not configured." },
      { status: 500 },
    );
  }

  const redirectUri = `${appUrl}/api/publishing/instagram/callback`;

  /*
   * Step 1: exchange the code for a short-lived Instagram User token.
   * Business Login for Instagram returns { data: [{ access_token, user_id }] }.
   */
  const tokenResponse = await fetch(
    "https://api.instagram.com/oauth/access_token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
        code,
      }),
    },
  );

  const tokenData = await tokenResponse.json();
  // Business Login may return either { data: [{ access_token, user_id }] }
  // or the flat shape { access_token, user_id, permissions } — accept both.
  const short = tokenData?.data?.[0] ?? tokenData;

  if (!tokenResponse.ok || !short?.access_token) {
    console.error("[Instagram] Token exchange failed:", tokenData);

    return NextResponse.json(
      {
        error:
          tokenData?.error_message ?? "Instagram token exchange failed.",
        details: tokenData,
      },
      { status: 400 },
    );
  }

  // Step 2: upgrade to a long-lived token (60 days).
  const longResponse = await fetch(
    `${GRAPH}/access_token?${new URLSearchParams({
      grant_type: "ig_exchange_token",
      client_secret: clientSecret,
      access_token: short.access_token,
    })}`,
  );

  const longData = await longResponse.json();

  if (!longResponse.ok) {
    console.error("[Instagram] Long-lived token exchange failed:", longData);
  }

  const accessToken: string = longData.access_token ?? short.access_token;
  const expiresAt = longData.expires_in
    ? new Date(Date.now() + Number(longData.expires_in) * 1000)
    : null;

  // Step 3: fetch the connected professional account identity.
  const meResponse = await fetch(
    `${GRAPH}/me?fields=id,username&access_token=${encodeURIComponent(accessToken)}`,
  );

  const meData = await meResponse.json();

  if (!meResponse.ok || !meData.id) {
    console.error("[Instagram] Account lookup failed:", meData);

    return NextResponse.json(
      {
        error:
          meData?.error?.message ??
          "Unable to read the Instagram account identity.",
        details: meData,
      },
      { status: 400 },
    );
  }

  const igUserId = String(meData.id ?? short.user_id);
  const accountName = `@${meData.username ?? "instagram"}`;

  await prisma.publishingChannel.upsert({
    where: { platform: "Instagram" },
    create: {
      platform: "Instagram",
      connected: true,
      accountName,
      accessToken,
      externalId: igUserId,
      expiresAt,
    },
    update: {
      connected: true,
      accountName,
      accessToken,
      externalId: igUserId,
      expiresAt,
    },
  });

  console.log("[Instagram] OAuth connection saved.", {
    username: meData.username,
    igUserId,
    expiresAt,
  });

  return NextResponse.redirect(
    new URL("/publishing?instagram=connected", appUrl),
  );
}
