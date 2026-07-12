import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/data";
import { rateLimit, clientIp } from "@/lib/request";
import { hashToken } from "@/lib/tokens";
import { classifySubmission, normalizeMessage } from "@/lib/content-safety";
import { queueCleanApproval, queueFlaggedReview } from "@/lib/wall-lifecycle";

/**
 * POST { token } — one-time email verification.
 * POSTed from the /verify landing page (never consumed on GET, so mail
 * scanners that prefetch links cannot burn the token).
 *
 * After verification the submission is classified:
 *  - clean + auto-approve mode  -> approved, published, welcome + owner alert
 *  - flagged OR manual mode     -> stays pending (nonpublic) in the review
 *    queue, owner review alert, no welcome.
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
        published: existing.status === "approved",
        supporter_number: existing.supporter_number,
      });
    }
    return NextResponse.json({ error: "This signup could not be verified." }, { status: 400 });
  }

  // Classify the verified submission.
  const settings = await store.getSettings();
  const verdict = classifySubmission(supporter);
  const duplicate =
    verdict.clean &&
    (await store.hasDuplicateMessage(
      normalizeMessage(supporter.message),
      supporter.id
    ));
  const flagged = !verdict.clean || duplicate;
  const flagReason = duplicate ? "near_duplicate_message" : verdict.reason;

  // Auto-approve only when the owner has auto-approval enabled, the entry is
  // clean, and public-display consent is active. Otherwise → review queue.
  const autoApprove =
    !settings.require_manual_approval && !flagged && supporter.display_consent;

  if (autoApprove) {
    const approved = await store.autoApproveVerified(supporter.id);
    const finalSupporter = approved ?? supporter;
    await queueCleanApproval(store, finalSupporter);
    return NextResponse.json({
      ok: true,
      published: finalSupporter.status === "approved",
      supporter_number: finalSupporter.supporter_number,
    });
  }

  // Flagged, manual-review mode, or consent withdrawn before verification:
  // hold in the queue. Store the internal reason for the owner (never shown
  // to the submitter) and send exactly one owner review alert, no welcome.
  if (flagReason) {
    await store.updateSupporterFields(supporter.id, { moderation_note: flagReason });
  }
  await queueFlaggedReview(store, supporter, flagReason ?? "manual_review_mode");
  return NextResponse.json({
    ok: true,
    published: false,
    review: true,
    supporter_number: supporter.supporter_number,
  });
}
