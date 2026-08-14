import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";

/*
 * Lightweight session auth: scrypt password hashes + HMAC-signed
 * session cookie. No external auth dependency needed.
 */

const SECRET = process.env.AUTH_SECRET || "octa-studio-dev-secret";

export const COOKIE_NAME = "octa_session";
export const SESSION_DAYS = 30;
export const FREE_GENERATION_LIMIT = 10;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 32).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 32);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

function sign(payload: string): string {
  return createHmac("sha256", SECRET).update(payload).digest("hex");
}

export function createSessionToken(userId: string): string {
  const expires = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const payload = `${userId}.${expires}`;
  return `${payload}.${sign(payload)}`;
}

export function parseSessionToken(token: string | undefined | null): string | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userId, expires, signature] = parts;
  if (!userId || !expires || sign(`${userId}.${expires}`) !== signature) return null;
  if (Number(expires) < Date.now()) return null;
  return userId;
}

export function getSessionUserId(request: NextRequest): string | null {
  return parseSessionToken(request.cookies.get(COOKIE_NAME)?.value);
}

export function setSessionCookie(response: NextResponse, userId: string): NextResponse {
  response.cookies.set(COOKIE_NAME, createSessionToken(userId), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
  return response;
}

export function clearSessionCookie(response: NextResponse): NextResponse {
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
