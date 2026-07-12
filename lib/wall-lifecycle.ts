/**
 * Global 7 Wall signup lifecycle orchestration: verification emails,
 * welcome confirmation, and the owner signup alert — all through the
 * durable outbox (idempotent per event, safe to retry).
 */
import type { Store } from "@/lib/data";
import type { Supporter } from "@/lib/types";
import { RETENTION } from "@/lib/policy";
import { generateToken, hashToken } from "@/lib/tokens";
import { SITE_URL } from "@/lib/site";
import { enqueueEmail, deliverSoon } from "@/lib/email/outbox";
import {
  verificationEmail,
  welcomeEmail,
  ownerSignupAlert,
  rejectionNotice,
  REPLY_TO_SUPPORT,
  OWNER_ALERTS_TO,
} from "@/lib/email/templates";

/** Create a fresh one-time verification token (invalidates prior ones) and
 *  queue the verification email. resendSeq makes each resend a distinct
 *  idempotency event while still preventing accidental duplicates. */
export async function queueVerificationEmail(
  store: Store,
  supporter: Supporter,
  resendSeq = 0
): Promise<void> {
  await store.invalidateSecurityTokens("verify", supporter.id);
  const raw = generateToken();
  await store.createSecurityToken({
    purpose: "verify",
    subject_id: supporter.id,
    token_hash: hashToken(raw),
    expires_at: new Date(Date.now() + RETENTION.verificationTokenMs).toISOString(),
  });
  const verifyUrl = `${SITE_URL}/verify?token=${raw}`;
  await enqueueEmail(store, {
    eventKey: `verify:${supporter.id}:${resendSeq}`,
    type: "supporter_email_verification",
    relatedId: supporter.id,
    to: supporter.email,
    replyTo: REPLY_TO_SUPPORT,
    content: verificationEmail(supporter.first_name, verifyUrl),
  });
  await deliverSoon(store);
}

/** After successful verification: queue exactly one owner alert
 *  (idempotent event key). The welcome email is NOT sent here — it is sent
 *  only on administrator approval via queueApprovalWelcome. */
export async function queuePostVerification(
  store: Store,
  supporter: Supporter
): Promise<void> {
  await enqueueEmail(store, {
    eventKey: `owner-alert:${supporter.id}`,
    type: "owner_signup_alert",
    relatedId: supporter.id,
    to: OWNER_ALERTS_TO,
    replyTo: null,
    content: ownerSignupAlert({
      supporterNumber: supporter.supporter_number,
      firstName: supporter.first_name,
      lastName: supporter.last_name,
      email: supporter.email,
      country: supporter.country_name,
      era: supporter.favorite_era,
      message: supporter.message,
      displayConsent: supporter.display_consent,
      marketingConsent: supporter.marketing_consent,
      verifiedAt: supporter.email_verified_at ?? "\u2014",
      status:
        supporter.status === "pending" ? "pending moderation" : supporter.status,
      createdAt: supporter.created_at,
    }),
  });
  await deliverSoon(store);
}

/** On administrator approval: queue exactly one welcome email (idempotent
 *  event key welcome:{id} — retries can never duplicate it). */
export async function queueApprovalWelcome(
  store: Store,
  supporter: Supporter
): Promise<void> {
  await enqueueEmail(store, {
    eventKey: `welcome:${supporter.id}`,
    type: "supporter_welcome_confirmation",
    relatedId: supporter.id,
    to: supporter.email,
    replyTo: REPLY_TO_SUPPORT,
    content: welcomeEmail({
      firstName: supporter.first_name,
      supporterNumber: supporter.supporter_number,
      country: supporter.country_name,
      era: supporter.favorite_era,
    }),
  });
  await deliverSoon(store);
}

/** Optional respectful rejection notice (admin-triggered; idempotent). */
export async function queueRejectionNotice(
  store: Store,
  supporter: Supporter
): Promise<void> {
  await enqueueEmail(store, {
    eventKey: `reject-notice:${supporter.id}`,
    type: "supporter_welcome_confirmation",
    relatedId: supporter.id,
    to: supporter.email,
    replyTo: REPLY_TO_SUPPORT,
    content: rejectionNotice(supporter.first_name),
  });
  await deliverSoon(store);
}
