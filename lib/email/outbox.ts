/**
 * Durable transactional email outbox.
 *
 * enqueue() writes a row with a unique event_key (idempotent — a repeated
 * event never creates a duplicate message), then deliverDue() attempts
 * delivery with exponential backoff. Delivery runs opportunistically after
 * each enqueue and via the protected admin retry endpoint
 * (POST /api/admin/outbox); there is no unauthenticated retry route.
 *
 * Provider selection:
 *  1. RESEND_API_KEY set  -> Resend HTTPS API (server-side only).
 *  2. Local dev (no key)  -> "dev-log" provider: logs subject+recipient and
 *     marks the row sent so local flows are testable. Never used when
 *     RESEND_API_KEY is present.
 *  3. Production without a key -> emailEnabled() is false; callers fall back
 *     to the legacy no-verification signup flow and no false "email sent"
 *     claims are made. Rows stay pending until a provider exists.
 */
import type { Store } from "@/lib/data";
import { OUTBOX_BACKOFF_MINUTES, OUTBOX_MAX_ATTEMPTS } from "@/lib/policy";
import { normalizeEmail } from "@/lib/tokens";
import type { EmailContent } from "./templates";
import { FROM_NOTIFICATIONS } from "./templates";

export type NotificationType =
  | "supporter_email_verification"
  | "supporter_welcome_confirmation"
  | "owner_signup_alert"
  | "contact_submission_alert"
  | "contact_acknowledgment"
  | "privacy_request_verification"
  | "privacy_request_acknowledgment"
  | "privacy_request_alert";

export interface OutboxMessage {
  id: string;
  event_key: string;
  notification_type: string;
  related_id: string | null;
  recipient: string;
  from_addr: string;
  reply_to: string | null;
  subject: string;
  body_html: string | null;
  body_text: string | null;
  status: "pending" | "processing" | "sent" | "failed" | "suppressed" | "cancelled";
  attempt_count: number;
  next_attempt_at: string | null;
  sent_at: string | null;
  provider: string | null;
  provider_message_id: string | null;
  last_error: string | null;
  created_at: string;
}

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

/** True when transactional email can genuinely be delivered. */
export function emailEnabled(): boolean {
  if (process.env.RESEND_API_KEY) return true;
  // Local development uses the dev-log provider so flows remain testable.
  return !isProduction();
}

export interface EnqueueOptions {
  eventKey: string;
  type: NotificationType;
  relatedId?: string | null;
  to: string;
  replyTo?: string | null;
  content: EmailContent;
  from?: string;
}

/** Idempotently queue a message, then attempt immediate delivery. */
export async function enqueueEmail(store: Store, opts: EnqueueOptions): Promise<void> {
  const recipient = normalizeEmail(opts.to);
  if (await store.isEmailSuppressed(recipient)) {
    await store.enqueueOutbox({
      event_key: opts.eventKey,
      notification_type: opts.type,
      related_id: opts.relatedId ?? null,
      recipient,
      from_addr: opts.from ?? FROM_NOTIFICATIONS,
      reply_to: opts.replyTo ?? null,
      subject: opts.content.subject,
      body_html: null,
      body_text: null,
      status: "suppressed",
    });
    return;
  }
  await store.enqueueOutbox({
    event_key: opts.eventKey,
    notification_type: opts.type,
    related_id: opts.relatedId ?? null,
    recipient,
    from_addr: opts.from ?? FROM_NOTIFICATIONS,
    reply_to: opts.replyTo ?? null,
    subject: opts.content.subject,
    body_html: opts.content.html,
    body_text: opts.content.text,
    status: "pending",
  });
}

interface SendResult {
  ok: boolean;
  provider: string;
  providerMessageId?: string;
  permanent?: boolean;
  error?: string;
}

async function sendViaProvider(msg: OutboxMessage): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `7fc/${msg.event_key}`,
        },
        body: JSON.stringify({
          from: msg.from_addr,
          to: [msg.recipient],
          reply_to: msg.reply_to || undefined,
          subject: msg.subject,
          html: msg.body_html || undefined,
          text: msg.body_text || undefined,
        }),
      });
      if (res.ok) {
        const json = (await res.json()) as { id?: string };
        return { ok: true, provider: "resend", providerMessageId: json.id };
      }
      const errText = (await res.text()).slice(0, 300);
      // 4xx (except 429) is permanent; 5xx/429 retryable.
      const permanent = res.status >= 400 && res.status < 500 && res.status !== 429;
      return { ok: false, provider: "resend", permanent, error: `HTTP ${res.status}: ${errText}` };
    } catch (err) {
      return {
        ok: false,
        provider: "resend",
        error: err instanceof Error ? err.message.slice(0, 300) : "network error",
      };
    }
  }
  if (!isProduction()) {
    console.log(`[email dev-log] to=${msg.recipient} type=${msg.notification_type} subject="${msg.subject}"`);
    return { ok: true, provider: "dev-log", providerMessageId: `dev-${msg.id}` };
  }
  return { ok: false, provider: "none", error: "No email provider configured (RESEND_API_KEY missing)" };
}

/** Attempt delivery of due pending messages. Returns counts for reporting. */
export async function deliverDue(
  store: Store,
  limit = 10
): Promise<{ sent: number; failed: number; skipped: number }> {
  const due = await store.claimDueOutbox(limit);
  let sent = 0,
    failed = 0,
    skipped = 0;
  for (const msg of due) {
    if (await store.isEmailSuppressed(msg.recipient)) {
      await store.finishOutboxAttempt(msg.id, {
        status: "suppressed",
        error: "recipient suppressed",
      });
      skipped++;
      continue;
    }
    const result = await sendViaProvider(msg);
    if (result.ok) {
      await store.finishOutboxAttempt(msg.id, {
        status: "sent",
        provider: result.provider,
        providerMessageId: result.providerMessageId,
      });
      sent++;
    } else {
      const attempts = msg.attempt_count + 1;
      const exhausted = result.permanent || attempts >= OUTBOX_MAX_ATTEMPTS;
      const backoffMin = OUTBOX_BACKOFF_MINUTES[Math.min(attempts - 1, OUTBOX_BACKOFF_MINUTES.length - 1)];
      await store.finishOutboxAttempt(msg.id, {
        status: exhausted ? "failed" : "pending",
        provider: result.provider,
        error: result.error,
        nextAttemptAt: exhausted
          ? null
          : new Date(Date.now() + backoffMin * 60_000).toISOString(),
      });
      failed++;
    }
  }
  return { sent, failed, skipped };
}

/** Fire-and-forget delivery after a request enqueues messages. */
export async function deliverSoon(store: Store): Promise<void> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const ctx = await getCloudflareContext({ async: true });
    ctx.ctx.waitUntil(deliverDue(store).catch(() => {}));
    return;
  } catch {
    // Local dev: run inline.
  }
  await deliverDue(store).catch(() => {});
}
