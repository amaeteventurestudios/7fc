-- 7FC trust layer: signup lifecycle, consents, tokens, email outbox,
-- privacy requests, entry reports, suppressions.
--
-- Non-destructive: existing supporters, numbers, and statuses are preserved.
-- Lifecycle mapping onto the existing status CHECK:
--   pending  + email_verified_at IS NULL  -> pending_email_verification
--   pending  + email_verified_at NOT NULL -> pending_moderation
--   approved                              -> approved/published
--   hidden                                -> removed/unpublished
--   deleted                               -> deleted (soft)

-- Supporter lifecycle + consent evidence -------------------------------------
ALTER TABLE supporters ADD COLUMN email_verified_at TEXT;
ALTER TABLE supporters ADD COLUMN terms_version TEXT;
ALTER TABLE supporters ADD COLUMN terms_accepted_at TEXT;
ALTER TABLE supporters ADD COLUMN privacy_version TEXT;
ALTER TABLE supporters ADD COLUMN privacy_ack_at TEXT;
ALTER TABLE supporters ADD COLUMN display_consent INTEGER NOT NULL DEFAULT 0;
ALTER TABLE supporters ADD COLUMN display_consent_at TEXT;
ALTER TABLE supporters ADD COLUMN display_consent_withdrawn_at TEXT;
ALTER TABLE supporters ADD COLUMN marketing_consent INTEGER NOT NULL DEFAULT 0;
ALTER TABLE supporters ADD COLUMN marketing_consent_at TEXT;
ALTER TABLE supporters ADD COLUMN marketing_withdrawn_at TEXT;
ALTER TABLE supporters ADD COLUMN age_attested_at TEXT;
ALTER TABLE supporters ADD COLUMN published_at TEXT;
ALTER TABLE supporters ADD COLUMN deleted_at TEXT;
ALTER TABLE supporters ADD COLUMN moderation_note TEXT;

-- Legacy rows joined under the pre-verification flow and appear on the public
-- Wall today: mark them verified + display-consented as of their signup time
-- so existing public entries are not silently unpublished.
UPDATE supporters SET
  email_verified_at = created_at,
  display_consent = 1,
  display_consent_at = created_at,
  age_attested_at = created_at,
  terms_version = 'legacy',
  privacy_version = 'legacy',
  published_at = CASE WHEN status = 'approved' THEN created_at ELSE NULL END
WHERE email_verified_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_supporters_email ON supporters(email);

-- One-time security tokens (verification / management / privacy) -------------
-- Only the SHA-256 hash of the token is stored; raw tokens are never logged.
CREATE TABLE IF NOT EXISTS security_tokens (
  id TEXT PRIMARY KEY,
  purpose TEXT NOT NULL CHECK (purpose IN ('verify','manage','privacy')),
  subject_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  used_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_tokens_subject ON security_tokens(purpose, subject_id);

-- Durable transactional email outbox -----------------------------------------
CREATE TABLE IF NOT EXISTS email_outbox (
  id TEXT PRIMARY KEY,
  event_key TEXT NOT NULL UNIQUE,
  notification_type TEXT NOT NULL,
  related_id TEXT,
  recipient TEXT NOT NULL,
  from_addr TEXT NOT NULL,
  reply_to TEXT,
  subject TEXT NOT NULL,
  body_html TEXT,
  body_text TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','processing','sent','failed','suppressed','cancelled')),
  attempt_count INTEGER NOT NULL DEFAULT 0,
  next_attempt_at TEXT,
  last_attempt_at TEXT,
  sent_at TEXT,
  provider TEXT,
  provider_message_id TEXT,
  last_error TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_outbox_status ON email_outbox(status, next_attempt_at);

-- Privacy request workflow -----------------------------------------------------
CREATE TABLE IF NOT EXISTS privacy_requests (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  request_type TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending_verification'
    CHECK (status IN ('pending_verification','verified','completed','rejected')),
  verified_at TEXT,
  completed_at TEXT,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Public "report this entry" queue ---------------------------------------------
CREATE TABLE IF NOT EXISTS entry_reports (
  id TEXT PRIMARY KEY,
  supporter_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  reporter_hash TEXT,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','resolved','dismissed')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_reports_supporter ON entry_reports(supporter_id, reporter_hash);

-- Email suppression list (hard bounces / complaints) ----------------------------
CREATE TABLE IF NOT EXISTS email_suppressions (
  email TEXT PRIMARY KEY,
  reason TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
