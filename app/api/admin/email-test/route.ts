import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { requireAdmin } from "@/lib/request";
import { getStore } from "@/lib/data";
import { enqueueEmail, deliverDue } from "@/lib/email/outbox";
import { REPLY_TO_SUPPORT } from "@/lib/email/templates";
import { normalizeEmail } from "@/lib/tokens";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * POST { recipient? } — admin-only end-to-end transactional email test.
 * Goes through the real outbox with a unique idempotency key. To prevent any
 * open-relay use, the recipient must be one of:
 *   - the EMAIL_TEST_RECIPIENT environment value (preferred),
 *   - the logged-in administrator's own account email, or
 *   - an @sevenfc.net alias.
 * The response reports the resulting outbox state; it never exposes the
 * provider API key.
 */
export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    // empty body allowed — falls back to the configured recipient
  }
  const requested = normalizeEmail(String(body.recipient ?? ""));
  const configured = normalizeEmail(process.env.EMAIL_TEST_RECIPIENT ?? "");
  const adminEmail = normalizeEmail(auth.admin.email);

  const recipient = requested || configured || adminEmail;
  const allowed =
    recipient === configured ||
    recipient === adminEmail ||
    recipient.endsWith("@sevenfc.net");
  if (!EMAIL_RE.test(recipient) || !allowed) {
    return NextResponse.json(
      {
        error:
          "Recipient not allowed. Use the configured test recipient, your admin email, or an @sevenfc.net alias.",
      },
      { status: 400 }
    );
  }

  const testId = crypto.randomUUID();
  const eventKey = `email-test:${testId}`;
  const store = await getStore();
  await enqueueEmail(store, {
    eventKey,
    type: "owner_signup_alert",
    relatedId: null,
    to: recipient,
    replyTo: REPLY_TO_SUPPORT,
    content: {
      subject: `7FC transactional email test ${testId.slice(0, 8)}`,
      html: `<p>This is a 7FC end-to-end transactional email test.</p><p>Test ID: ${testId}</p><p>If you received this, outbound delivery works.</p>`,
      text: `This is a 7FC end-to-end transactional email test.\nTest ID: ${testId}\nIf you received this, outbound delivery works.`,
    },
  });
  await deliverDue(store, 25);

  // Report the actual resulting state of this specific message.
  const record = await store.getOutboxByEventKey(eventKey);
  return NextResponse.json({
    test_id: testId,
    recipient,
    status: record?.status ?? "unknown",
    provider: record?.provider ?? null,
    provider_message_id: record?.provider_message_id ?? null,
    error: record?.last_error ?? null,
    outbox: await store.outboxSummary(),
  });
}
