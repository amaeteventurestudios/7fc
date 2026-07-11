/**
 * Seeds the Cloudflare D1 database (7fc-prod) with:
 *   - temporary bootstrap admin (password stored as scrypt hash only)
 *   - default Global Wall settings
 *   - default legal disclaimers
 *   - (products are imported separately: scripts/import-kit-csv.mjs)
 *
 * Idempotent: existing rows are left untouched (INSERT OR IGNORE).
 *
 * Usage:
 *   node scripts/seed-d1.mjs --local    # seed wrangler's local D1
 *   node scripts/seed-d1.mjs --remote   # seed the production database
 *   node scripts/seed-d1.mjs --print    # print SQL without executing
 *
 * Env overrides (no secrets are committed):
 *   ADMIN_TEMP_EMAIL     (default admin@7fc.net)
 *   ADMIN_TEMP_PASSWORD  (default ChangeMe-7FC-Now)
 */
import crypto from "node:crypto";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const DB_NAME = "7fc-prod";

const ADMIN_EMAIL = process.env.ADMIN_TEMP_EMAIL || "admin@7fc.net";
const ADMIN_PASSWORD = process.env.ADMIN_TEMP_PASSWORD || "ChangeMe-7FC-Now";

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

const q = (s) => `'${String(s).replace(/'/g, "''")}'`;

const SETTINGS = {
  enable_submissions: 1,
  require_manual_approval: 1,
  show_supporter_count: 1,
  show_country_count: 1,
  show_latest_supporters: 1,
  show_country_flags: 1,
  allow_fan_messages: 1,
  allow_full_names: 1,
  show_favorite_era: 1,
  emergency_lock: 0,
  founding_slots_enabled: 1,
  founding_slot_target: 777,
  homepage_preview_count: 8,
  wall_page_size: 24,
};

const LEGAL = {
  top_disclaimer:
    "Unofficial fan tribute. 7FC is not affiliated with, endorsed by, sponsored by, or connected to Cristiano Ronaldo, CR7, any club, federation, sponsor, or official brand.",
  footer_disclaimer:
    "7FC is an independent, unofficial fan tribute and football culture site. This site is not affiliated with, endorsed by, sponsored by, or connected to Cristiano Ronaldo, CR7, any club, federation, sponsor, or official brand. All names, marks, images, club names, and trademarks belong to their respective owners. Any references are used for identification, commentary, fan discussion, and historical context. As an Amazon Associate, I earn from qualifying purchases.",
  affiliate_disclosure:
    "Paid links: As an Amazon Associate, I earn from qualifying purchases.",
  privacy_note:
    "Your email stays private. Your name and country may appear on the Global 7 Wall if you choose.",
  product_note:
    "Product links point to third-party retailers. 7FC does not sell products directly.",
};

// Products are seeded via scripts/import-kit-csv.mjs (approved 15-product set).

const now = new Date().toISOString();
const statements = [];

// Temporary bootstrap admin — only if no admin exists yet.
statements.push(
  `INSERT INTO admin_users (id, email, password_hash, is_temporary, created_at, updated_at)
   SELECT ${q(crypto.randomUUID())}, ${q(ADMIN_EMAIL)}, ${q(hashPassword(ADMIN_PASSWORD))}, 1, ${q(now)}, ${q(now)}
   WHERE NOT EXISTS (SELECT 1 FROM admin_users);`
);

for (const [key, value] of Object.entries(SETTINGS)) {
  statements.push(
    `INSERT OR IGNORE INTO global_wall_settings (key, value) VALUES (${q(key)}, ${value});`
  );
}

for (const [key, value] of Object.entries(LEGAL)) {
  statements.push(
    `INSERT OR IGNORE INTO legal_disclaimers (key, value, updated_at) VALUES (${q(key)}, ${q(value)}, ${q(now)});`
  );
}


const sql = statements.join("\n");
const mode = process.argv[2];

if (mode === "--print") {
  console.log(sql);
  process.exit(0);
}
if (mode !== "--local" && mode !== "--remote") {
  console.error("Usage: node scripts/seed-d1.mjs --local | --remote | --print");
  process.exit(1);
}

const file = path.join(mkdtempSync(path.join(tmpdir(), "7fc-seed-")), "seed.sql");
writeFileSync(file, sql, "utf8");
console.log(`Seeding ${DB_NAME} (${mode.slice(2)})…`);
const res = spawnSync(
  "npx",
  ["wrangler", "d1", "execute", DB_NAME, mode, "--file", file],
  { stdio: "inherit" }
);
process.exit(res.status ?? 1);
