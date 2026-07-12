/**
 * Cloudflare Turnstile server-side validation.
 * https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 *
 * Secrets: only TURNSTILE_SECRET_KEY (server secret, never bundled to the
 * browser) is used here; the client widget uses only
 * NEXT_PUBLIC_TURNSTILE_SITE_KEY. When the secret is not configured the
 * check is skipped and reported as unconfigured on the admin readiness view;
 * rate limiting and honeypots remain active as defense in depth. There is no
 * test-key or bypass flag that can activate in production.
 */
import { SITE_URL } from "@/lib/site";

export function turnstileConfigured(): boolean {
  return !!process.env.TURNSTILE_SECRET_KEY;
}

/** Public site key (safe for the browser). Runtime var first so the key can
 *  be added via wrangler.toml [vars] without a rebuild. */
export function turnstileSiteKey(): string {
  return (
    process.env.TURNSTILE_SITE_KEY ||
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ||
    ""
  );
}

/** User-facing message when required security config is missing (fail closed). */
export const SECURITY_UNAVAILABLE_MESSAGE =
  "Signup is temporarily unavailable. Please try again later.";
export const TURNSTILE_FAILED_MESSAGE =
  "We could not verify the submission. Please try again.";

interface SiteverifyResponse {
  success?: boolean;
  hostname?: string;
  action?: string;
  "error-codes"?: string[];
}

/** Injectable fetch for tests. */
export type SiteverifyFetch = (
  url: string,
  init: { method: string; headers: Record<string, string>; body: string }
) => Promise<{ json(): Promise<unknown> }>;

export async function verifyTurnstile(
  token: unknown,
  ip: string,
  expectedAction?: string,
  fetchImpl: SiteverifyFetch = fetch
): Promise<{ ok: boolean; configured: boolean; reason?: string }> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    // Fail closed in production: missing security configuration must never
    // silently open the door. Development stays usable without keys.
    return {
      ok: process.env.NODE_ENV !== "production",
      configured: false,
      reason: "unconfigured",
    };
  }
  if (typeof token !== "string" || !token || token.length > 2048)
    return { ok: false, configured: true, reason: "missing-token" };
  try {
    const res = await fetchImpl(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret,
          response: token,
          remoteip: ip !== "unknown" ? ip : undefined,
        }),
      }
    );
    const json = (await res.json()) as SiteverifyResponse;
    if (json.success !== true)
      return { ok: false, configured: true, reason: "rejected" };
    // Hostname must match the canonical site (or localhost during dev).
    const expectedHost = new URL(SITE_URL).hostname;
    if (
      json.hostname &&
      json.hostname !== expectedHost &&
      json.hostname !== "localhost"
    )
      return { ok: false, configured: true, reason: "hostname-mismatch" };
    // Action must match the form that requested verification (when set).
    if (expectedAction && json.action && json.action !== expectedAction)
      return { ok: false, configured: true, reason: "action-mismatch" };
    return { ok: true, configured: true };
  } catch {
    // Fail closed: a verification outage must not open the door to bots.
    return { ok: false, configured: true, reason: "network-error" };
  }
}
