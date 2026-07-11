-- Corrective, forward-only migration: legacy consent accuracy + ops metadata.
--
-- Migration 0004 backfilled pre-trust-layer supporters as if they had
-- accepted the new Terms/Privacy versions and consent language, with
-- manufactured timestamps. That misrepresents history. This migration:
--   * tags every row with a consent_source
--   * clears the invented consent/verification evidence on legacy rows
--   * keeps legacy entries, numbers, and their public visibility intact
--     (they submitted to the public Wall under the previous flow; that
--     original intent — not a new consent event — is why display_consent
--     stays 1, and consent_source makes the distinction auditable)
--   * marketing_consent stays 0 for legacy rows (never obtained)
-- Reconfirmation path: /manage lets a legacy supporter affirmatively grant
-- current consents; doing so updates consent_source to 'reconfirmed'.
-- Non-destructive: no rows deleted, no supporter numbers changed.

ALTER TABLE supporters ADD COLUMN consent_source TEXT;

-- Rows created by the trust-layer signup form carry real consent evidence.
UPDATE supporters SET consent_source = 'signup_form'
WHERE terms_version IS NOT NULL AND terms_version != 'legacy';

-- Legacy rows: tag them and remove manufactured evidence.
UPDATE supporters SET
  consent_source = 'legacy_migration',
  terms_version = NULL,
  terms_accepted_at = NULL,
  privacy_version = NULL,
  privacy_ack_at = NULL,
  display_consent_at = NULL,
  age_attested_at = NULL,
  email_verified_at = NULL
WHERE terms_version = 'legacy';

-- Safety net: any remaining untagged row predates the trust layer too.
UPDATE supporters SET consent_source = 'legacy_migration'
WHERE consent_source IS NULL;

-- Operational metadata (last cron run, last successful delivery).
CREATE TABLE IF NOT EXISTS ops_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
