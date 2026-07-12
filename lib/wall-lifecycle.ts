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
  ownerNewSupporterAlert,
  ownerReviewAlert,
  rejectionNotice,
  REPLY_TO_SUPPORT,
  OWNER_ALERTS_TO,
} from "@/lib/email/templates";

/** Public display name for owner alerts: first name plus last initial (never
 *  the full private last name unless the supporter opted to show it). */
function displayName(s: Supporter): string {
  if (s.show_full_name && s.last_name) return `${s.first_name} ${s.last_name}`;
  if (s.last_name) return `${s.first_name} ${s.last_name[0].toUpperCase()}.`;
  return s.first_name;
}

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

/** CLEAN auto-approval: exactly one welcome + exactly one owner "new
 *  supporter" alert. Both event keys are per-supporter, so retries (or a
 *  later manual re-approve) can never duplicate either message. */
export async function queueCleanApproval(
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
  await enqueueEmail(store, {
    eventKey: `owner-new:${supporter.id}`,
    type: "owner_signup_alert",
    relatedId: supporter.id,
    to: OWNER_ALERTS_TO,
    replyTo: null,
    content: ownerNewSupporterAlert({
      supporterNumber: supporter.supporter_number,
      displayName: displayName(supporter),
      country: supporter.country_name,
      createdAt: supporter.created_at,
    }),
  });
  await deliverSoon(store);
}

/** FLAGGED submission: exactly one owner review alert, and NO welcome. */
export async function queueFlaggedReview(
  store: Store,
  supporter: Supporter,
  flagReason: string
): Promise<void> {
  await enqueueEmail(store, {
    eventKey: `owner-review:${supporter.id}`,
    type: "owner_signup_alert",
    relatedId: supporter.id,
    to: OWNER_ALERTS_TO,
    replyTo: null,
    content: ownerReviewAlert({
      supporterNumber: supporter.supporter_number,
      displayName: displayName(supporter),
      country: supporter.country_name,
      createdAt: supporter.created_at,
      flagReason,
    }),
  });
  await deliverSoon(store);
}

/** On administrator approval of a previously-flagged entry: exactly one
 *  welcome email (same welcome:{id} key so it can never double-send). */
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
