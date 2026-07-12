import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/data";
import { rateLimit, clientIp } from "@/lib/request";
import { turnstileGate, limitGate, HOUR } from "@/lib/guard";
import { generateToken, hashToken, normalizeEmail } from "@/lib/tokens";
import { RETENTION } from "@/lib/policy";
import { SITE_URL } from "@/lib/site";
import type { PrivacyRequestType } from "@/lib/types";
import { enqueueEmail, deliverSoon, emailEnabled } from "@/lib/email/outbox";
import {
  privacyRequestVerification,
  REPLY_TO_SUPPORT,
} from "@/lib/email/templates";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const TYPES: PrivacyRequestType[] = [
  "access",
  "correction",
  "export",
  "deletion",
  "wall_removal",
  "consent_withdrawal",
  "marketing_opt_out",
  "other",
];

/**
 * POST { email, request_type, details?, turnstile_token } — file a privacy
 * request. The requester must verify control of the email before any data
 * is disclosed, changed, or deleted. Responses are neutral: they never
 * reveal whether a supporter record exists for the address.
 */
export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  // In-memory pre-filter only; durable limits below govern.
  if (!rateLimit(`privacy:${ip}`, 10, 10 * 60_000))
    return NextResponse.json({ error: "Too many requests. Please wait." }, { status: 429 });
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (typeof body.website === "string" && body.website.trim() !== "")
    return NextResponse.json({ error: "Submission rejected." }, { status: 400 });
  const gate = await turnstileGate(body.turnstile_token, ip, "privacy_request");
  if (gate) return gate;

  const email = normalizeEmail(String(body.email ?? ""));
  const requestType = String(body.request_type ?? "") as PrivacyRequestType;
  const details = String(body.details ?? "").trim().slice(0, 2000);
  if (!EMAIL_RE.test(email) || email.length > 200)
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  if (!TYPES.includes(requestType))
    return NextResponse.json({ error: "Please choose a request type." }, { status: 400 });

  if (!emailEnabled()) {
    // The flow depends on a verification email; refuse before creating an
    // unusable request record or token.
    return NextResponse.json(
      {
        error:
          "Automated privacy requests are temporarily unavailable. Please email privacy@sevenfc.net directly — requests are honored either way.",
      },
      { status: 503 }
    );
  }

  const store = await getStore();
  const durableLimited = await limitGate(store, [
    { scope: "privacy-ip", identifier: ip, limit: 5, windowMs: HOUR },
    { scope: "privacy-email", identifier: email, limit: 3, windowMs: HOUR },
  ]);
  if (durableLimited) return durableLimited;
  const request = await store.createPrivacyRequest({
    email,
    request_type: requestType,
    details: details || null,
  });
  const raw = generateToken();
  await store.createSecurityToken({
    purpose: "privacy",
    subject_id: request.id,
    token_hash: hashToken(raw),
    expires_at: new Date(Date.now() + RETENTION.privacyTokenMs).toISOString(),
  });
  await enqueueEmail(store, {
    eventKey: `privacy-verify:${request.id}`,
    type: "privacy_request_verification",
    relatedId: request.id,
    to: email,
    replyTo: REPLY_TO_SUPPORT,
    content: privacyRequestVerification(
      requestType.replace(/_/g, " "),
      `${SITE_URL}/privacy-request/verify?token=${raw}`
    ),
  });
  await deliverSoon(store);

  return NextResponse.json({
    ok: true,
    message:
      "Your request has been recorded. Check your inbox for a verification email — we can only act on the request after you confirm the address. Nothing is disclosed or changed without that confirmation.",
  });
}
