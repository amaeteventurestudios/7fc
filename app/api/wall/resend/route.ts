import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/data";
import { rateLimit, clientIp } from "@/lib/request";
import { normalizeEmail } from "@/lib/tokens";
import { turnstileGate, limitGate, HOUR } from "@/lib/guard";
import { queueVerificationEmail } from "@/lib/wall-lifecycle";
import { emailEnabled } from "@/lib/email/outbox";

/**
 * POST { email, turnstile_token } — controlled resend of the verification
 * email. Always responds neutrally so the endpoint cannot be used to probe
 * which emails are registered.
 */
export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  // In-memory pre-filter only; durable limits below govern.
  if (!rateLimit(`resend:${ip}`, 10, 10 * 60_000)) {
    return NextResponse.json({ error: "Too many requests. Please wait." }, { status: 429 });
  }
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!emailEnabled()) {
    return NextResponse.json(
      { error: "Email delivery is temporarily unavailable. Please try again soon." },
      { status: 503 }
    );
  }
  const gate = await turnstileGate(body.turnstile_token, ip, "verification_resend");
  if (gate) return gate;

  const email = normalizeEmail(String(body.email ?? ""));
  const neutral = {
    ok: true,
    message:
      "If a pending signup exists for that address, a new verification email has been sent.",
  };
  if (!email || email.length > 200) return NextResponse.json(neutral);

  const store = await getStore();
  // Durable limits: 5/IP and 3/email per hour. Email overflow stays neutral
  // (no registration probing); IP overflow returns 429.
  const ipLimited = await limitGate(store, [
    { scope: "resend-ip", identifier: ip, limit: 5, windowMs: HOUR },
  ]);
  if (ipLimited) return ipLimited;
  const emailLimited = await limitGate(store, [
    { scope: "resend-email", identifier: email, limit: 3, windowMs: HOUR },
  ]);
  if (emailLimited) return NextResponse.json(neutral);
  const supporter = await store.findSupporterByEmail(email);
  if (supporter && !supporter.email_verified_at && supporter.status === "pending") {
    // New token invalidates all previous ones; unique resend event key.
    await queueVerificationEmail(store, supporter, Date.now());
  }
  return NextResponse.json(neutral);
}
