import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/data";
import { rateLimit, clientIp } from "@/lib/request";
import { privacyHash } from "@/lib/tokens";
import { turnstileGate, limitGate, HOUR } from "@/lib/guard";

const REASONS = [
  "spam",
  "harassment_or_hate",
  "impersonation",
  "private_information",
  "illegal_or_unsafe",
  "copyright_or_trademark",
  "other",
] as const;

/** POST { supporter_number, reason, details?, turnstile_token } — report a
 *  public Wall entry for moderation review. The reporter is never publicly
 *  identified; only a salted hash is stored for duplicate protection. */
export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  if (!rateLimit(`report:${ip}`, 5, 10 * 60_000)) {
    return NextResponse.json({ error: "Too many reports. Please wait." }, { status: 429 });
  }
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const gate = await turnstileGate(body.turnstile_token, ip, "entry_report");
  if (gate) return gate;

  const supporterNumber = Number(body.supporter_number);
  const reason = String(body.reason ?? "");
  const details = String(body.details ?? "").trim().slice(0, 1000);
  if (!Number.isInteger(supporterNumber) || supporterNumber < 1)
    return NextResponse.json({ error: "Invalid entry." }, { status: 400 });
  if (!(REASONS as readonly string[]).includes(reason))
    return NextResponse.json({ error: "Please choose a reason." }, { status: 400 });

  const store = await getStore();
  const limited = await limitGate(store, [
    { scope: "report-ip", identifier: ip, limit: 5, windowMs: HOUR },
  ]);
  if (limited) return limited;
  // Only published entries can be reported (no probing of private records).
  const { approved } = await store.getPublicHome();
  const target = approved.find((s) => s.supporter_number === supporterNumber);
  if (!target)
    return NextResponse.json({ error: "Entry not found." }, { status: 404 });

  await store.createEntryReport({
    supporter_id: target.id,
    reason,
    details: details || null,
    reporter_hash: privacyHash(`report:${ip}`),
  });
  // Same response whether or not it was a duplicate.
  return NextResponse.json({
    ok: true,
    message: "Thank you. This entry has been flagged for moderation review.",
  });
}
