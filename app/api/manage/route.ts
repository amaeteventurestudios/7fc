import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/data";
import type { Store } from "@/lib/data";
import { rateLimit, clientIp } from "@/lib/request";
import { verifyTurnstile } from "@/lib/turnstile";
import { generateToken, hashToken, normalizeEmail } from "@/lib/tokens";
import { RETENTION } from "@/lib/policy";
import { SITE_URL } from "@/lib/site";
import { ERAS } from "@/lib/types";
import type { Supporter } from "@/lib/types";
import { enqueueEmail, deliverSoon, emailEnabled } from "@/lib/email/outbox";
import { managementLinkEmail, REPLY_TO_SUPPORT } from "@/lib/email/templates";

/** Private view of the supporter's own record (never exposes internals). */
function selfView(s: Supporter) {
  return {
    supporter_number: s.supporter_number,
    first_name: s.first_name,
    last_name: s.last_name,
    email: s.email,
    country_name: s.country_name,
    favorite_era: s.favorite_era,
    message: s.message,
    show_full_name: s.show_full_name,
    status: s.status,
    display_consent: s.display_consent,
    marketing_consent: s.marketing_consent,
    created_at: s.created_at,
    email_verified_at: s.email_verified_at,
    consent_source: s.consent_source,
  };
}

/** Full portable export of the requester's own data. */
function exportView(s: Supporter) {
  return {
    exported_at: new Date().toISOString(),
    source: "7FC Global 7 Wall supporter record",
    data: {
      supporter_number: s.supporter_number,
      first_name: s.first_name,
      last_name: s.last_name,
      email: s.email,
      country_name: s.country_name,
      country_code: s.country_code,
      favorite_era: s.favorite_era,
      message: s.message,
      show_full_name: s.show_full_name,
      status: s.status,
      created_at: s.created_at,
      email_verified_at: s.email_verified_at,
      terms_version: s.terms_version,
      terms_accepted_at: s.terms_accepted_at,
      privacy_version: s.privacy_version,
      privacy_ack_at: s.privacy_ack_at,
      display_consent: s.display_consent,
      display_consent_at: s.display_consent_at,
      display_consent_withdrawn_at: s.display_consent_withdrawn_at,
      marketing_consent: s.marketing_consent,
      marketing_consent_at: s.marketing_consent_at,
      marketing_withdrawn_at: s.marketing_withdrawn_at,
      age_attested_at: s.age_attested_at,
      published_at: s.published_at,
      consent_source: s.consent_source,
    },
  };
}

async function supporterForToken(store: Store, rawToken: unknown) {
  if (typeof rawToken !== "string" || !rawToken || rawToken.length > 200) return null;
  const token = await store.peekSecurityToken("manage", hashToken(rawToken));
  if (!token) return null;
  const supporter = await store.getSupporterById(token.subject_id);
  if (!supporter || supporter.status === "deleted") return null;
  return supporter;
}

/** GET ?token= — view own record. Token is multi-use within its 1h expiry
 *  (revoked on deletion or when a new link is issued). */
export async function GET(req: NextRequest) {
  if (!rateLimit(`manage-view:${clientIp(req)}`, 30, 60_000))
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  const store = await getStore();
  const supporter = await supporterForToken(
    store,
    req.nextUrl.searchParams.get("token")
  );
  if (!supporter)
    return NextResponse.json(
      { error: "This management link is invalid or has expired. Request a new one below." },
      { status: 401 }
    );
  return NextResponse.json({ supporter: selfView(supporter) });
}

/**
 * POST — two modes:
 *  { action: "request_link", email, turnstile_token }  (no token required)
 *  { token, action: update|set_display|set_marketing|unpublish|export|delete, ... }
 */
export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const action = String(body.action ?? "");
  const store = await getStore();
  const now = new Date().toISOString();

  if (action === "request_link") {
    if (!emailEnabled()) {
      // Refuse before any token is minted; no dead-end links.
      return NextResponse.json(
        { error: "Email delivery is temporarily unavailable, so management links cannot be sent right now. Please try again soon or email support@sevenfc.net." },
        { status: 503 }
      );
    }
    if (!rateLimit(`manage-link:${ip}`, 3, 10 * 60_000))
      return NextResponse.json({ error: "Too many requests. Please wait." }, { status: 429 });
    const turnstile = await verifyTurnstile(body.turnstile_token, ip, "manage_link");
    if (!turnstile.ok)
      return NextResponse.json({ error: "Human verification failed." }, { status: 400 });
    const email = normalizeEmail(String(body.email ?? ""));
    const neutral = {
      ok: true,
      message:
        "If a supporter record exists for that address, a management link has been emailed to it.",
    };
    if (!email || email.length > 200 || !rateLimit(`manage-link-email:${email}`, 2, 10 * 60_000))
      return NextResponse.json(neutral);
    const supporter = await store.findSupporterByEmail(email);
    // Receiving and using the emailed link IS the email-control proof, so
    // legacy (pre-verification-era) supporters can also manage their entry.
    if (supporter) {
      await store.invalidateSecurityTokens("manage", supporter.id);
      const raw = generateToken();
      await store.createSecurityToken({
        purpose: "manage",
        subject_id: supporter.id,
        token_hash: hashToken(raw),
        expires_at: new Date(Date.now() + RETENTION.managementTokenMs).toISOString(),
      });
      await enqueueEmail(store, {
        eventKey: `manage-link:${supporter.id}:${Date.now()}`,
        type: "supporter_welcome_confirmation",
        relatedId: supporter.id,
        to: supporter.email,
        replyTo: REPLY_TO_SUPPORT,
        content: managementLinkEmail(`${SITE_URL}/manage?token=${raw}`),
      });
      await deliverSoon(store);
    }
    return NextResponse.json(neutral);
  }

  if (!rateLimit(`manage-act:${ip}`, 20, 60_000))
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  const supporter = await supporterForToken(store, body.token);
  if (!supporter)
    return NextResponse.json(
      { error: "This management link is invalid or has expired. Request a new one below." },
      { status: 401 }
    );

  switch (action) {
    case "update": {
      const patch: Record<string, unknown> = {};
      if (typeof body.first_name === "string") {
        const v = body.first_name.trim();
        if (!v || v.length > 60)
          return NextResponse.json({ error: "Invalid first name." }, { status: 400 });
        patch.first_name = v;
      }
      if (typeof body.last_name === "string") {
        const v = body.last_name.trim();
        if (v.length > 60)
          return NextResponse.json({ error: "Last name too long." }, { status: 400 });
        patch.last_name = v || null;
      }
      if (typeof body.favorite_era === "string") {
        const v = body.favorite_era.trim();
        if (v && !(ERAS as readonly string[]).includes(v))
          return NextResponse.json({ error: "Invalid era." }, { status: 400 });
        patch.favorite_era = v || null;
      }
      if (typeof body.message === "string") {
        const v = body.message.trim();
        if (v.length > 500)
          return NextResponse.json({ error: "Message too long." }, { status: 400 });
        patch.message = v || null;
      }
      if (typeof body.show_full_name === "boolean")
        patch.show_full_name = body.show_full_name;
      if (Object.keys(patch).length === 0)
        return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
      // Edits to publicly displayed text re-enter moderation review.
      if (
        (patch.message !== undefined || patch.first_name !== undefined) &&
        supporter.status === "approved"
      ) {
        patch.status = "pending";
      }
      await store.updateSupporterFields(supporter.id, patch);
      const updated = await store.getSupporterById(supporter.id);
      return NextResponse.json({
        ok: true,
        message:
          patch.status === "pending"
            ? "Saved. Because public text changed, your entry will be re-reviewed before it reappears on the Wall."
            : "Saved.",
        supporter: updated ? selfView(updated) : null,
      });
    }
    case "set_display": {
      const grant = body.value === true;
      await store.updateSupporterFields(supporter.id, {
        display_consent: grant,
        ...(grant
          ? {
              display_consent_at: now,
              // Affirmative action via the emailed link: legacy records
              // become 'reconfirmed' with a real consent timestamp.
              ...(supporter.consent_source === "legacy_migration"
                ? { consent_source: "reconfirmed" }
                : {}),
            }
          : { display_consent_withdrawn_at: now }),
      });
      const updated = await store.getSupporterById(supporter.id);
      return NextResponse.json({
        ok: true,
        message: grant
          ? "Public display consent granted. Your entry appears once approved."
          : "Public display consent withdrawn. Your entry has been removed from the public Wall and public data feeds. Independent search-engine or AI caches may take time to update and are not controlled by 7FC.",
        supporter: updated ? selfView(updated) : null,
      });
    }
    case "set_marketing": {
      const grant = body.value === true;
      await store.updateSupporterFields(supporter.id, {
        marketing_consent: grant,
        ...(grant ? { marketing_consent_at: now } : { marketing_withdrawn_at: now }),
      });
      const updated = await store.getSupporterById(supporter.id);
      return NextResponse.json({
        ok: true,
        message: grant ? "Marketing preference enabled." : "Marketing preference disabled.",
        supporter: updated ? selfView(updated) : null,
      });
    }
    case "unpublish": {
      await store.updateSupporterFields(supporter.id, {
        status: "hidden",
        display_consent: false,
        display_consent_withdrawn_at: now,
      });
      const updated = await store.getSupporterById(supporter.id);
      return NextResponse.json({
        ok: true,
        message:
          "Your entry has been unpublished and removed from the public Wall. Your private record is kept so your supporter number is preserved; you can delete it entirely below.",
        supporter: updated ? selfView(updated) : null,
      });
    }
    case "export": {
      return NextResponse.json({ ok: true, export: exportView(supporter) });
    }
    case "delete": {
      if (body.confirm !== true)
        return NextResponse.json(
          { error: "Deletion requires confirmation." },
          { status: 400 }
        );
      await store.anonymizeSupporter(supporter.id);
      return NextResponse.json({
        ok: true,
        deleted: true,
        message:
          "Your personal information has been deleted and your entry removed from the public Wall. Your supporter number remains reserved and is not reassigned. Independent search or AI caches may take time to update.",
      });
    }
    default:
      return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }
}
