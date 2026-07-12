import { cookies, headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "./auth";
import { getStore } from "./data";
import type { AdminUser } from "./types";

/** Simple in-memory rate limiter (per process). */
const buckets = new Map<string, { count: number; reset: number }>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now > bucket.reset) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= limit;
}

export function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

/** Returns the authenticated admin user or null. */
export async function getAdmin(): Promise<AdminUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const adminId = verifySessionToken(token);
  if (!adminId) return null;
  const store = await getStore();
  return store.getAdminById(adminId);
}

/** CSRF defense for cookie-authenticated admin APIs: browser requests must
 *  be same-origin. `sec-fetch-site` (sent by all modern browsers) must be
 *  same-origin/none when present; an Origin header, when present, must match
 *  the Host. Non-browser clients (no such headers) pass — they cannot carry
 *  the victim's cookie. Combined with SameSite=Lax this blocks cross-site
 *  request forgery on state-changing admin routes. */
async function sameOriginOk(): Promise<boolean> {
  const h = await headers();
  const fetchSite = h.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none")
    return false;
  const origin = h.get("origin");
  const host = h.get("host");
  if (origin && host) {
    try {
      if (new URL(origin).host !== host) return false;
    } catch {
      return false;
    }
  }
  return true;
}

export async function requireAdmin(): Promise<
  { admin: AdminUser } | { error: NextResponse }
> {
  if (!(await sameOriginOk())) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  const admin = await getAdmin();
  if (!admin) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { admin };
}
