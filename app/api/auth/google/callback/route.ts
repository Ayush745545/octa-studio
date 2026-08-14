import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setSessionCookie } from "@/lib/auth";
import { googleRedirectUri } from "../route";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const destination = state && state.startsWith("/") ? state : "/ai-studio";

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=google-denied", request.url));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL("/login?error=google-not-configured", request.url));
  }

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: googleRedirectUri(),
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      console.error("[auth] google token exchange failed:", await tokenRes.text());
      return NextResponse.redirect(new URL("/login?error=google-failed", request.url));
    }

    const tokens = await tokenRes.json();
    const userInfoRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userInfoRes.ok) {
      console.error("[auth] google userinfo failed:", await userInfoRes.text());
      return NextResponse.redirect(new URL("/login?error=google-failed", request.url));
    }

    const profile = await userInfoRes.json();
    const email = String(profile.email || "").toLowerCase();
    if (!email) {
      return NextResponse.redirect(new URL("/login?error=google-failed", request.url));
    }

    const displayName = profileName(profile.name, email.split("@")[0]);

    const user = await prisma.user.upsert({
      where: { email },
      update: { name: displayName, avatarUrl: profile.picture ?? null, provider: "google" },
      create: { email, name: displayName, avatarUrl: profile.picture ?? null, provider: "google" },
    });

    const response = NextResponse.redirect(new URL(destination, request.url));
    return setSessionCookie(response, user.id);
  } catch (error) {
    console.error("[auth] google callback error:", error);
    return NextResponse.redirect(new URL("/login?error=google-failed", request.url));
  }
}

function profileName(name: unknown, fallback: string): string {
  return typeof name === "string" && name.trim() ? name.trim() : fallback;
}
