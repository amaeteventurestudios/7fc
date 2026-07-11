import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/data";
import { rateLimit, clientIp } from "@/lib/request";
import { verifyTurnstile } from "@/lib/turnstile";
import { normalizeEmail, privacyHash } from "@/lib/tokens";
import { enqueueEmail, deliverSoon } from "@/lib/email/outbox";
import {
  contactAcknowledgment,
  contactAlert,
  stripHeaderChars,
  REPLY_TO_SUPPORT,
  REPLY_TO_CONTACT,
} from "@/lib/email/templates";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Category -> destination alias. The browser can never supply a recipient. */
const CATEGORIES: Record<string, { to: string; label: string; replyTo: string }> = {
  general: { to: "contact@sevenfc.net", label: "General inquiry", replyTo: REPLY_TO_CONTACT },
  media: { to: "contact@sevenfc.net", label: "Media or partnership", replyTo: REPLY_TO_CONTACT },
  wall_support: { to: "support@sevenfc.net", label: "Global 7 Wall support", replyTo: REPLY_TO_SUPPORT },
  technical: { to: "support@sevenfc.net", label: "Technical support", replyTo: REPLY_TO_SUPPORT },
  kit: { to: "contact@sevenfc.net", label: "Kit or affiliate question", replyTo: REPLY_TO_CONTACT },
  privacy: { to: "privacy@sevenfc.net", label: "Privacy request", replyTo: REPLY_TO_SUPPORT },
  legal: { to: "legal@sevenfc.net", label: "Legal / IP / copyright", replyTo: REPLY_TO_CONTACT },
  security: { to: "security@sevenfc.net", label: "Security report", replyTo: REPLY_TO_CONTACT },
};

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  if (!rateLimit(`contact:${ip}`, 3, 10 * 60_000)) {
    return NextResponse.json(
      { error: "Too many messages. Please wait a few minutes." },
      { status: 429 }
    );
  }
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  // Honeypot
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ error: "Submission rejected." }, { status: 400 });
  }
  const turnstile = await verifyTurnstile(body.turnstile_token, ip);
  if (!turnstile.ok)
    return NextResponse.json(
      { error: "Human verification failed. Please try again." },
      { status: 400 }
    );

  const name = stripHeaderChars(String(body.name ?? "")).slice(0, 100);
  const email = normalizeEmail(String(body.email ?? ""));
  const categoryKey = String(body.category ?? "");
  const subject = stripHeaderChars(String(body.subject ?? "")).slice(0, 150);
  const message = String(body.message ?? "").trim();
  const terms = body.terms_accepted === "1" || body.terms_accepted === true;

  if (!name)
    return NextResponse.json({ error: "Please tell us your name." }, { status: 400 });
  if (!EMAIL_RE.test(email) || email.length > 200)
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  const category = CATEGORIES[categoryKey];
  if (!category)
    return NextResponse.json({ error: "Please choose a category." }, { status: 400 });
  if (!subject)
    return NextResponse.json({ error: "A subject is required." }, { status: 400 });
  if (!message || message.length > 4000)
    return NextResponse.json(
      { error: "A message is required (max 4000 characters)." },
      { status: 400 }
    );
  if (!terms)
    return NextResponse.json(
      { error: "Please acknowledge the Terms and Privacy Policy." },
      { status: 400 }
    );

  const store = await getStore();
  // Idempotency: identical repeated submissions collapse into one event.
  const fingerprint = privacyHash(`${email}|${categoryKey}|${subject}|${message}`);

  await enqueueEmail(store, {
    eventKey: `contact-alert:${fingerprint}`,
    type: "contact_submission_alert",
    relatedId: null,
    to: category.to,
    replyTo: email, // owner can reply straight to the sender
    content: contactAlert({ name, email, category: category.label, subject, message }),
  });
  await enqueueEmail(store, {
    eventKey: `contact-ack:${fingerprint}`,
    type: "contact_acknowledgment",
    relatedId: null,
    to: email,
    replyTo: category.replyTo,
    content: contactAcknowledgment(name, category.label),
  });
  await deliverSoon(store);

  return NextResponse.json({
    ok: true,
    message:
      "Thank you for contacting 7FC. Your message has been received and routed to the appropriate inbox. We review every submission, but we cannot guarantee a response to every message.",
  });
}
