/**
 * Seeds the Cloudflare D1 database (7fc-prod) with:
 *   - temporary bootstrap admin (password stored as scrypt hash only)
 *   - default Global Wall settings
 *   - default legal disclaimers
 *   - the 9 default affiliate products
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

const PRODUCTS = [
  ["Books & Biographies", "Reading", "/images/7fc-kit-books.webp", "Stories of discipline, hunger, and greatness — for students of the game."],
  ["Training Cones", "Training", "/images/7fc-kit-training-cones.webp", "Sharpen footwork and agility with simple, repeatable drills."],
  ["Agility Ladder", "Training", "/images/7fc-kit-agility-ladder.webp", "Fast feet are built one rung at a time. Repetition. Output."],
  ["Resistance Bands", "Strength", "/images/7fc-kit-resistance-bands.webp", "Explosive power and injury-proofing, anywhere you train."],
  ["Football", "Essentials", "/images/7fc-kit-football.webp", "Every legacy starts with a ball. Get the touches in."],
  ["Shin Guards", "Essentials", "/images/7fc-kit-shin-guards.webp", "Protection for the players who never pull out of a challenge."],
  ["Recovery Roller", "Recovery", "/images/7fc-kit-recovery-roller.webp", "Longevity is a skill. Recover like it matters — because it does."],
  ["Water Bottle", "Hydration", "/images/7fc-kit-water-bottle.webp", "Fuel the work. Hydration is part of the standard."],
  ["Gym Bag", "Essentials", "/images/7fc-kit-gym-bag.webp", "Everything you need for the sessions nobody sees."],
  ["Speed Hurdles", "Training", "/images/7fc-kit-speed-hurdles.webp", "Build the first-step burst that separates good from great."],
  ["Training Bibs", "Training", "/images/7fc-kit-training-bibs.webp", "Small-sided games, full-sized intensity. Gear for the group session."],
  ["Ball Pump", "Essentials", "/images/7fc-kit-ball-pump.webp", "A flat ball never made anyone better. Stay ready."],
  ["Compression Socks", "Recovery", "/images/7fc-kit-compression-socks.webp", "Support the legs that do the work, session after session."],
  ["Captain Armband", "Essentials", "/images/7fc-kit-captain-armband.webp", "Leadership is a standard you wear. Set the tone."],
  ["Stretching Strap", "Recovery", "/images/7fc-kit-stretching-strap.webp", "Flexibility is longevity. Stretch like it's part of the job."],
];

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

PRODUCTS.forEach(([title, category, image, description], i) => {
  statements.push(
    `INSERT INTO affiliate_products (id, title, category, image_path, description, affiliate_url, button_text, active, sort_order, click_count)
     SELECT ${q(crypto.randomUUID())}, ${q(title)}, ${q(category)}, ${q(image)}, ${q(description)}, 'https://www.amazon.com/?tag=YOUR_AFFILIATE_TAG', 'View on Amazon', 1, ${i}, 0
     WHERE NOT EXISTS (SELECT 1 FROM affiliate_products WHERE title = ${q(title)});`
  );
});

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
