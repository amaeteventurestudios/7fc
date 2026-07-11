import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/data";
import { rateLimit, clientIp } from "@/lib/request";
import { normalizeEmail } from "@/lib/tokens";
import { verifyTurnstile } from "@/lib/turnstile";
import { queueVerificationEmail } from "@/lib/wall-lifecycle";
import { emailEnabled } from "@/lib/email/outbox";

/**
 * POST { email, turnstile_token } — controlled resend of the verification
 * email. Always responds neutrally so the endpoint cannot be used to probe
 * which emails are registered.
 */
export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  if (!rateLimit(`resend:${ip}`, 3, 10 * 60_000)) {
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
  const turnstile = await verifyTurnstile(body.turnstile_token, ip, "wall_resend");
  if (!turnstile.ok)
    return NextResponse.json({ error: "Human verification failed." }, { status: 400 });

  const email = normalizeEmail(String(body.email ?? ""));
  const neutral = {
    ok: true,
    message:
      "If a pending signup exists for that address, a new verification email has been sent.",
  };
  if (!email || email.length > 200) return NextResponse.json(neutral);
  if (!rateLimit(`resend-email:${email}`, 2, 10 * 60_000)) {
    return NextResponse.json(neutral);
  }

  const store = await getStore();
  const supporter = await store.findSupporterByEmail(email);
  if (supporter && !supporter.email_verified_at && supporter.status === "pending") {
    // New token invalidates all previous ones; unique resend event key.
    await queueVerificationEmail(store, supporter, Date.now());
  }
  return NextResponse.json(neutral);
}
