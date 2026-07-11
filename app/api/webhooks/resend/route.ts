import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getStore } from "@/lib/data";

/**
 * Resend delivery-event webhook (bounces, complaints).
 * Signed with Svix: signature = HMAC-SHA256(base64secret, `${id}.${ts}.${body}`).
 * Unsigned or badly signed events are rejected; processing is idempotent
 * (suppression inserts are ON CONFLICT DO NOTHING).
 *
 * Configure RESEND_WEBHOOK_SECRET (whsec_...) as a Cloudflare secret and add
 * the endpoint https://sevenfc.net/api/webhooks/resend in the Resend
 * dashboard for events: email.bounced, email.complained, email.delivered.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    // Never accept unsigned events.
    return NextResponse.json({ error: "Webhook not configured." }, { status: 503 });
  }
  const id = req.headers.get("svix-id") || "";
  const timestamp = req.headers.get("svix-timestamp") || "";
  const signatures = req.headers.get("svix-signature") || "";
  const body = await req.text();
  if (!id || !timestamp || !signatures)
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });

  // Reject stale timestamps (replay protection, 5 minutes).
  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > 300)
    return NextResponse.json({ error: "Stale timestamp." }, { status: 400 });

  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const expected = crypto
    .createHmac("sha256", key)
    .update(`${id}.${timestamp}.${body}`)
    .digest("base64");
  const valid = signatures.split(" ").some((part) => {
    const sig = part.includes(",") ? part.split(",")[1] : part;
    try {
      const a = Buffer.from(sig, "base64");
      const b = Buffer.from(expected, "base64");
      return a.length === b.length && crypto.timingSafeEqual(a, b);
    } catch {
      return false;
    }
  });
  if (!valid)
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });

  let event: { type?: string; data?: { to?: string[] | string; bounce?: { type?: string } } };
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const to = event.data?.to;
  const recipient = (Array.isArray(to) ? to[0] : to)?.toLowerCase();
  const store = await getStore();

  if (recipient) {
    if (event.type === "email.bounced") {
      // Suppress hard bounces only; soft bounces are left to provider retry.
      const bounceType = event.data?.bounce?.type ?? "hard";
      if (bounceType !== "soft") {
        await store.addEmailSuppression(recipient, "hard_bounce");
      }
    } else if (event.type === "email.complained") {
      await store.addEmailSuppression(recipient, "complaint");
    }
    // Other event types (delivered/delayed) are acknowledged without storage —
    // we keep only the minimum suppression data required.
  }
  return NextResponse.json({ ok: true });
}
