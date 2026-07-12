import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/request";
import { getStore } from "@/lib/data";
import { emailEnabled } from "@/lib/email/outbox";
import { turnstileConfigured } from "@/lib/turnstile";
import {
  TERMS_VERSION,
  PRIVACY_VERSION,
  COOKIE_POLICY_VERSION,
} from "@/lib/policy";

/** security.txt Expires — keep in sync with app/.well-known/security.txt. */
const SECURITY_TXT_EXPIRES = "2027-07-11T00:00:00.000Z";

/**
 * GET — operational readiness snapshot (admin only). Boolean configuration
 * flags and aggregate counts only; secret values are never returned.
 */
export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const store = await getStore();
  const [counts, lastCron, lastEmail, activeRateWindows, permanentAdmin] =
    await Promise.all([
      store.readinessCounts(),
      store.getOpsMeta("last_cron_at"),
      store.getOpsMeta("last_email_sent_at"),
      store.countActiveRateLimits(),
      store.hasPermanentAdmin(),
    ]);
  return NextResponse.json({
    config: {
      resend_configured: !!process.env.RESEND_API_KEY,
      resend_webhook_configured: !!process.env.RESEND_WEBHOOK_SECRET,
      turnstile_configured: turnstileConfigured(),
      turnstile_site_key_set:
        !!process.env.TURNSTILE_SITE_KEY ||
        !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
      email_enabled: emailEnabled(),
      // Status only, never values: a permanent (non-temporary) scrypt admin
      // credential exists in the database.
      admin_password_hash_configured: permanentAdmin,
      session_secret_configured: !!process.env.SESSION_SECRET,
    },
    counts,
    ops: {
      last_scheduled_outbox_run: lastCron,
      last_successful_email_delivery: lastEmail,
      // Count of live hashed rate-limit windows; no identifiers exposed.
      active_rate_limit_windows: activeRateWindows,
    },
    policy: {
      terms_version: TERMS_VERSION,
      privacy_version: PRIVACY_VERSION,
      cookie_policy_version: COOKIE_POLICY_VERSION,
      security_txt_expires: SECURITY_TXT_EXPIRES,
    },
  });
}
