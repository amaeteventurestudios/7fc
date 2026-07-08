import { cookies } from "next/headers";
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

export async function requireAdmin(): Promise<
  { admin: AdminUser } | { error: NextResponse }
> {
  const admin = await getAdmin();
  if (!admin) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { admin };
}
