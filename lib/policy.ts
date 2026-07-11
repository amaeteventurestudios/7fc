/**
 * Central policy versions and data-retention schedule for 7FC.
 * Every retention value used by cleanup code lives here — keep the
 * Privacy Policy (app/privacy) and docs/legal/retention-schedule.md in
 * sync with these values whenever they change.
 */

export const TERMS_VERSION = "2026-07-11";
export const PRIVACY_VERSION = "2026-07-11";
export const COOKIE_POLICY_VERSION = "2026-07-11";

const DAY = 24 * 60 * 60 * 1000;
export const HOUR_MS = 60 * 60 * 1000;

export const RETENTION = {
  /** Verification links expire after 24 hours (fixed requirement). */
  verificationTokenMs: 24 * HOUR_MS,
  /** Supporter-management links expire after 1 hour. */
  managementTokenMs: 1 * HOUR_MS,
  /** Privacy-request verification links expire after 24 hours. */
  privacyTokenMs: 24 * HOUR_MS,
  /** Unverified signups are deleted after 7 days. */
  unverifiedSignupMs: 7 * DAY,
  /** Used/expired token rows are purged after 30 days. */
  tokenRowMs: 30 * DAY,
  /** Sent email bodies are redacted after 7 days (metadata kept 90 days). */
  outboxBodyMs: 7 * DAY,
  outboxRowMs: 90 * DAY,
  /** Resolved entry reports are purged after 180 days. */
  reportRowMs: 180 * DAY,
  /** Completed/rejected privacy requests are kept 24 months as compliance evidence. */
  privacyRequestMs: 730 * DAY,
} as const;

/** Backoff schedule (minutes) for outbox retries; permanent failure after the last. */
export const OUTBOX_BACKOFF_MINUTES = [1, 5, 30, 120, 720] as const;
export const OUTBOX_MAX_ATTEMPTS = OUTBOX_BACKOFF_MINUTES.length + 1;
