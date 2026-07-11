import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/data";
import { rateLimit, clientIp } from "@/lib/request";
import { hashToken } from "@/lib/tokens";
import { enqueueEmail, deliverSoon } from "@/lib/email/outbox";
import {
  privacyRequestAcknowledgment,
  privacyOwnerAlert,
  REPLY_TO_SUPPORT,
} from "@/lib/email/templates";

/**
 * POST { token, confirm_deletion? } — verify a privacy request (one-time
 * token). After verification:
 *  - marketing_opt_out / consent_withdrawal / wall_removal / deletion are
 *    executed automatically against the requester's own record (if any);
 *    deletion additionally requires confirm_deletion: true.
 *  - access / export return the requester's data inline for download.
 *  - correction / other are queued for manual handling via privacy@sevenfc.net.
 * Data is only ever disclosed for the verified email address itself.
 */
export async function POST(req: NextRequest) {
  if (!rateLimit(`privacy-verify:${clientIp(req)}`, 10, 60_000))
    return NextResponse.json({ error: "Too many attempts." }, { status: 429 });
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
  const consumed = await store.consumeSecurityToken("privacy", hashToken(token));
  if (!consumed)
    return NextResponse.json(
      { error: "This verification link is invalid, expired, or already used." },
      { status: 400 }
    );
  const request = await store.getPrivacyRequest(consumed.subject_id);
  if (!request)
    return NextResponse.json({ error: "Request not found." }, { status: 400 });

  const now = new Date().toISOString();
  await store.updatePrivacyRequest(request.id, { status: "verified", verified_at: now });

  const supporter = await store.findSupporterByEmail(request.email);
  let completed = false;
  let payload: unknown = undefined;
  let message = "";

  switch (request.request_type) {
    case "marketing_opt_out":
      if (supporter)
        await store.updateSupporterFields(supporter.id, {
          marketing_consent: false,
          marketing_withdrawn_at: now,
        });
      completed = true;
      message = "Marketing preference disabled for this address.";
      break;
    case "consent_withdrawal":
    case "wall_removal":
      if (supporter)
        await store.updateSupporterFields(supporter.id, {
          status: "hidden",
          display_consent: false,
          display_consent_withdrawn_at: now,
        });
      completed = true;
      message =
        "Public-display consent withdrawn. Any public Wall entry for this address has been removed from the site and its public data feeds. Independent search or AI caches may take time to update.";
      break;
    case "deletion":
      if (body.confirm_deletion !== true) {
        return NextResponse.json({
          ok: true,
          needs_deletion_confirmation: true,
          message:
            "Your identity is verified. Deletion is permanent — confirm below to delete your personal information.",
        });
      }
      if (supporter) await store.anonymizeSupporter(supporter.id);
      completed = true;
      message =
        "Personal information for this address has been deleted and any public entry removed. Independent caches may take time to update.";
      break;
    case "access":
    case "export":
      payload = supporter
        ? {
            exported_at: now,
            source: "7FC supporter record",
            data: {
              supporter_number: supporter.supporter_number,
              first_name: supporter.first_name,
              last_name: supporter.last_name,
              email: supporter.email,
              country_name: supporter.country_name,
              favorite_era: supporter.favorite_era,
              message: supporter.message,
              show_full_name: supporter.show_full_name,
              status: supporter.status,
              created_at: supporter.created_at,
              email_verified_at: supporter.email_verified_at,
              display_consent: supporter.display_consent,
              marketing_consent: supporter.marketing_consent,
              consent_source: supporter.consent_source,
            },
          }
        : { exported_at: now, source: "7FC", data: null, note: "No supporter record exists for this email address." };
      completed = true;
      message = "Here is the personal information 7FC holds for this address.";
      break;
    default:
      message =
        "Your request is verified and queued for review by privacy@sevenfc.net. We will follow up by email.";
  }

  if (completed)
    await store.updatePrivacyRequest(request.id, {
      status: "completed",
      completed_at: new Date().toISOString(),
      note: "auto-processed after email verification",
    });

  await enqueueEmail(store, {
    eventKey: `privacy-ack:${request.id}`,
    type: "privacy_request_acknowledgment",
    relatedId: request.id,
    to: request.email,
    replyTo: REPLY_TO_SUPPORT,
    content: privacyRequestAcknowledgment(request.request_type.replace(/_/g, " ")),
  });
  await enqueueEmail(store, {
    eventKey: `privacy-alert:${request.id}`,
    type: "privacy_request_alert",
    relatedId: request.id,
    to: "privacy@sevenfc.net",
    replyTo: null,
    content: privacyOwnerAlert({
      id: request.id,
      requestType: request.request_type,
      email: request.email,
      details: request.details,
    }),
  });
  await deliverSoon(store);

  return NextResponse.json({ ok: true, completed, message, export: payload });
}
