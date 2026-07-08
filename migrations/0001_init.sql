-- 7FC Cloudflare D1 schema
-- Apply with: npx wrangler d1 migrations apply 7fc-db

CREATE TABLE IF NOT EXISTS admin_users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  is_temporary INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS supporters (
  id TEXT PRIMARY KEY,
  supporter_number INTEGER NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT,
  email TEXT NOT NULL,
  country_name TEXT NOT NULL,
  country_code TEXT NOT NULL,
  favorite_era TEXT,
  message TEXT,
  show_full_name INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','hidden','deleted')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_supporters_status ON supporters(status);
CREATE INDEX IF NOT EXISTS idx_supporters_country ON supporters(country_code);

CREATE TABLE IF NOT EXISTS global_wall_settings (
  key TEXT PRIMARY KEY,
  value INTEGER NOT NULL DEFAULT 0
);
INSERT OR IGNORE INTO global_wall_settings (key, value) VALUES
  ('enable_submissions', 1),
  ('require_manual_approval', 1),
  ('show_supporter_count', 1),
  ('show_country_count', 1),
  ('show_latest_supporters', 1),
  ('show_country_flags', 1),
  ('allow_fan_messages', 1),
  ('allow_full_names', 1),
  ('show_favorite_era', 1),
  ('emergency_lock', 0);

CREATE TABLE IF NOT EXISTS affiliate_products (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  image_path TEXT NOT NULL,
  description TEXT NOT NULL,
  affiliate_url TEXT NOT NULL,
  button_text TEXT NOT NULL DEFAULT 'View on Amazon',
  active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  click_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS legal_disclaimers (
  key TEXT PRIMARY KEY
    CHECK (key IN ('top_disclaimer','footer_disclaimer','affiliate_disclosure','privacy_note','product_note')),
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS activity_log (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  detail TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS affiliate_clicks (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES affiliate_products(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
