/**
 * Durable, privacy-preserving rate limiting backed by the store (D1 in
 * production). Identifiers (IPs, normalized emails) are keyed with an HMAC
 * derived from SESSION_SECRET — a secret unavailable to the browser — so no
 * raw IP or email ever lands in the rate_limits table. Rows carry a
 * reset_at expiry and are purged by retention cleanup (retention = the
 * limit window itself; nothing outlives its window by more than one
 * cleanup cycle).
 */
import crypto from "crypto";
import type { Store } from "@/lib/data";

function limiterSecret(): string {
  // Falls back to a static pepper only outside production (lib/auth.ts
  // fails closed in production when SESSION_SECRET is missing).
  return process.env.SESSION_SECRET || "dev-rate-limit-pepper";
}

/** HMAC key for a scope+identifier — irreversible, fixed length. */
export function rateLimitKey(scope: string, identifier: string): string {
  return (
    scope +
    ":" +
    crypto
      .createHmac("sha256", limiterSecret())
      .update(`${scope}|${identifier}`)
      .digest("hex")
      .slice(0, 40)
  );
}

export interface RateLimitResult {
  allowed: boolean;
  /** Seconds until the window resets (for Retry-After). */
  retryAfterSeconds: number;
}

/** Increment-and-check a durable counter. Fails open only on store errors
 *  (the layered defenses — Turnstile, honeypot, timing — still apply). */
export async function durableRateLimit(
  store: Store,
  scope: string,
  identifier: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  try {
    const key = rateLimitKey(scope, identifier);
    const { count, reset_at } = await store.incrementRateLimit(key, windowMs);
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((new Date(reset_at).getTime() - Date.now()) / 1000)
    );
    return { allowed: count <= limit, retryAfterSeconds };
  } catch {
    return { allowed: true, retryAfterSeconds: 0 };
  }
}

/** Standard 429 payload text (user-facing, non-revealing). */
export const RATE_LIMIT_MESSAGE =
  "Too many attempts were made recently. Please wait and try again.";
