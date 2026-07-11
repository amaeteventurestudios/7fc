import { getStore } from "@/lib/data";
import { emailEnabled } from "@/lib/email/outbox";
import { turnstileConfigured } from "@/lib/turnstile";
import {
  TERMS_VERSION,
  PRIVACY_VERSION,
  COOKIE_POLICY_VERSION,
} from "@/lib/policy";
import EmailTestButton from "./EmailTestButton";

export const dynamic = "force-dynamic";

const SECURITY_TXT_EXPIRES = "2027-07-11";

function Flag({ ok, label, warn }: { ok: boolean; label: string; warn?: string }) {
  return (
    <div className="flex items-center justify-between border border-gold/20 rounded px-4 py-3">
      <span className="text-sm text-gray-200">{label}</span>
      <span
        className={`text-[11px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full border ${
          ok
            ? "text-emerald-300 border-emerald-500/50"
            : "text-amber-300 border-amber-500/50"
        }`}
      >
        {ok ? "Yes" : warn ?? "No"}
      </span>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="border border-gold/20 rounded px-4 py-3">
      <p className="text-[11px] tracking-[0.2em] uppercase text-gray-500">{label}</p>
      <p className="text-xl font-bold text-gold-2 mt-1">{value}</p>
    </div>
  );
}

/** Operational readiness: configuration flags (never secret values) plus
 *  queue/moderation counts. Protected by the admin layout. */
export default async function ReadinessPage() {
  const store = await getStore();
  const [counts, lastCron, lastEmail] = await Promise.all([
    store.readinessCounts(),
    store.getOpsMeta("last_cron_at"),
    store.getOpsMeta("last_email_sent_at"),
  ]);
  return (
    <div className="space-y-8">
      <h1 className="font-display text-xl font-bold text-gold-2">
        Operational Readiness
      </h1>

      <section>
        <h2 className="text-sm font-bold tracking-[0.2em] uppercase text-gray-400 mb-3">
          Configuration
        </h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <Flag ok={!!process.env.RESEND_API_KEY} label="Resend configured" />
          <Flag
            ok={!!process.env.RESEND_WEBHOOK_SECRET}
            label="Resend webhook configured"
            warn="No / Unknown"
          />
          <Flag ok={turnstileConfigured()} label="Turnstile configured (server)" />
          <Flag
            ok={!!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
            label="Turnstile site key set (client)"
          />
          <Flag ok={emailEnabled()} label="Transactional email enabled" />
        </div>
        <p className="text-[11px] text-gray-500 mt-2">
          Flags only — secret values are never displayed. While email is not
          enabled, signups, management links, and automated privacy requests
          are paused with an honest visitor-facing message.
        </p>
      </section>

      <section>
        <h2 className="text-sm font-bold tracking-[0.2em] uppercase text-gray-400 mb-3">
          Queues
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Stat label="Outbox pending" value={counts.outbox_pending} />
          <Stat label="Outbox failed (permanent)" value={counts.outbox_failed} />
          <Stat label="Outbox sent" value={counts.outbox_sent} />
          <Stat label="Suppressed recipients" value={counts.suppressed} />
          <Stat label="Pending moderation" value={counts.pending_moderation} />
          <Stat label="Open reports" value={counts.open_reports} />
          <Stat label="Pending privacy requests" value={counts.pending_privacy_requests} />
          <Stat label="Legacy-consent supporters" value={counts.legacy_consent_supporters} />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-bold tracking-[0.2em] uppercase text-gray-400 mb-3">
          Operations
        </h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <Stat label="Last scheduled outbox run (UTC)" value={lastCron ?? "never"} />
          <Stat label="Last successful email delivery (UTC)" value={lastEmail ?? "never"} />
          <Stat label="Terms / Privacy versions" value={`${TERMS_VERSION} / ${PRIVACY_VERSION}`} />
          <Stat label="Cookie policy version" value={COOKIE_POLICY_VERSION} />
          <Stat label="security.txt expires" value={SECURITY_TXT_EXPIRES} />
        </div>
        <p className="text-[11px] text-gray-500 mt-2">
          The outbox cron runs every 5 minutes (wrangler.toml triggers).
        </p>
      </section>

      <section>
        <h2 className="text-sm font-bold tracking-[0.2em] uppercase text-gray-400 mb-3">
          End-to-end email test
        </h2>
        <EmailTestButton />
      </section>
    </div>
  );
}
