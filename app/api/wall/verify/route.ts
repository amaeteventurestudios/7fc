import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/data";
import { rateLimit, clientIp } from "@/lib/request";
import { hashToken } from "@/lib/tokens";
import { queuePostVerification } from "@/lib/wall-lifecycle";

/**
 * POST { token } — one-time email verification.
 * POSTed from the /verify landing page (never consumed on GET, so mail
 * scanners that prefetch links cannot burn the token).
 */
export async function POST(req: NextRequest) {
  if (!rateLimit(`verify:${clientIp(req)}`, 10, 60_000)) {
    return NextResponse.json({ error: "Too many attempts. Please wait." }, { status: 429 });
  }
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const token = typeof body.token === "string" ? body.token : "";
  if (!token || token.length > 200)
    return NextResponse.json({ error: "Invalid verification link." }, { status: 400 });

  const store = await getStore();
  const consumed = await store.consumeSecurityToken("verify", hashToken(token));
  if (!consumed) {
    return NextResponse.json(
      {
        error:
          "This verification link is invalid, expired, or already used. You can request a new one from the signup form.",
      },
      { status: 400 }
    );
  }
  const supporter = await store.markSupporterVerified(consumed.subject_id);
  if (!supporter) {
    // Already verified previously (or record gone) — treat idempotently.
    const existing = await store.getSupporterById(consumed.subject_id);
    if (existing?.email_verified_at) {
      return NextResponse.json({
        ok: true,
        already: true,
        supporter_number: existing.supporter_number,
        status: existing.status,
      });
    }
    return NextResponse.json({ error: "This signup could not be verified." }, { status: 400 });
  }
  await queuePostVerification(store, supporter);
  return NextResponse.json({
    ok: true,
    supporter_number: supporter.supporter_number,
    status: supporter.status === "pending" ? "pending_moderation" : supporter.status,
  });
}
