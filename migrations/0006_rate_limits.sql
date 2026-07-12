-- Durable server-side rate limiting (Worker isolates lose in-memory
-- counters). Keys are HMAC hashes of scope + identifier (IP or normalized
-- email) — raw IPs are never stored. Rows expire at reset_at and are purged
-- by the retention cleanup that runs in the 5-minute cron.
CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  reset_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_rate_limits_reset ON rate_limits(reset_at);
