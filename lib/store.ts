/**
 * Data layer for 7FC.
 *
 * Production target is Cloudflare D1 (see /migrations/0001_init.sql).
 * For local development and standard Node hosting this module provides a
 * JSON-file store with the same shape. Swap `readDb`/`writeDb` for D1
 * queries behind the same exported functions when deploying to Cloudflare.
 */
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import type {
  Database,
  Supporter,
  SupporterStatus,
  AffiliateProduct,
  GlobalWallSettings,
  LegalDisclaimers,
  ActivityEntry,
  AdminUser,
} from "./types";
import { hashPassword } from "./auth";
import { PRODUCT_FIELD_DEFAULTS } from "./kit";
import { SUPPORTER_TRUST_DEFAULTS } from "./types";

const DATA_DIR =
  process.env.SEVENFC_DATA_DIR || path.join(process.cwd(), ".data");
const DB_PATH = path.join(DATA_DIR, "db.json");

// Local-development-only bootstrap credentials (the JSON store never runs in
// production, and there is no default in production builds either way).
const DEV_ONLY = process.env.NODE_ENV !== "production";
export const TEMP_ADMIN_EMAIL =
  process.env.ADMIN_TEMP_EMAIL ||
  process.env.TEMP_ADMIN_EMAIL ||
  (DEV_ONLY ? "admin@7fc.net" : "");
export const TEMP_ADMIN_PASSWORD =
  process.env.ADMIN_TEMP_PASSWORD ||
  process.env.TEMP_ADMIN_PASSWORD ||
  (DEV_ONLY ? "ChangeMe-7FC-Now" : "");

export const DEFAULT_SETTINGS: GlobalWallSettings = {
  enable_submissions: true,
  require_manual_approval: true,
  show_supporter_count: true,
  show_country_count: true,
  show_latest_supporters: true,
  show_country_flags: true,
  allow_fan_messages: true,
  allow_full_names: true,
  show_favorite_era: true,
  emergency_lock: false,
  founding_slots_enabled: true,
  founding_slot_target: 777,
  homepage_preview_count: 8,
  wall_page_size: 24,
};

export const DEFAULT_LEGAL: LegalDisclaimers = {
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

const KIT_PRODUCTS: Array<
  Pick<AffiliateProduct, "title" | "category" | "image_path" | "description">
> = [
  { title: "Books & Biographies", category: "Reading", image_path: "/images/7fc-kit-books.webp", description: "Stories of discipline, hunger, and greatness — for students of the game." },
  { title: "Training Cones", category: "Training", image_path: "/images/7fc-kit-training-cones.webp", description: "Sharpen footwork and agility with simple, repeatable drills." },
  { title: "Agility Ladder", category: "Training", image_path: "/images/7fc-kit-agility-ladder.webp", description: "Fast feet are built one rung at a time. Repetition. Output." },
  { title: "Resistance Bands", category: "Strength", image_path: "/images/7fc-kit-resistance-bands.webp", description: "Explosive power and injury-proofing, anywhere you train." },
  { title: "Football", category: "Essentials", image_path: "/images/7fc-kit-football.webp", description: "Every legacy starts with a ball. Get the touches in." },
  { title: "Shin Guards", category: "Essentials", image_path: "/images/7fc-kit-shin-guards.webp", description: "Protection for the players who never pull out of a challenge." },
  { title: "Recovery Roller", category: "Recovery", image_path: "/images/7fc-kit-recovery-roller.webp", description: "Longevity is a skill. Recover like it matters — because it does." },
  { title: "Water Bottle", category: "Hydration", image_path: "/images/7fc-kit-water-bottle.webp", description: "Fuel the work. Hydration is part of the standard." },
  { title: "Gym Bag", category: "Essentials", image_path: "/images/7fc-kit-gym-bag.webp", description: "Everything you need for the sessions nobody sees." },
  { title: "Speed Hurdles", category: "Training", image_path: "/images/7fc-kit-speed-hurdles.webp", description: "Build the first-step burst that separates good from great." },
  { title: "Training Bibs", category: "Training", image_path: "/images/7fc-kit-training-bibs.webp", description: "Small-sided games, full-sized intensity. Gear for the group session." },
  { title: "Ball Pump", category: "Essentials", image_path: "/images/7fc-kit-ball-pump.webp", description: "A flat ball never made anyone better. Stay ready." },
  { title: "Compression Socks", category: "Recovery", image_path: "/images/7fc-kit-compression-socks.webp", description: "Support the legs that do the work, session after session." },
  { title: "Captain Armband", category: "Essentials", image_path: "/images/7fc-kit-captain-armband.webp", description: "Leadership is a standard you wear. Set the tone." },
  { title: "Stretching Strap", category: "Recovery", image_path: "/images/7fc-kit-stretching-strap.webp", description: "Flexibility is longevity. Stretch like it's part of the job." },
];

function seedDb(): Database {
  const now = new Date().toISOString();
  const admin: AdminUser = {
    id: crypto.randomUUID(),
    email: TEMP_ADMIN_EMAIL,
    password_hash: hashPassword(TEMP_ADMIN_PASSWORD),
    is_temporary: true,
    created_at: now,
    updated_at: now,
  };
  const products: AffiliateProduct[] = KIT_PRODUCTS.map((p, i) => ({
    id: crypto.randomUUID(),
    ...PRODUCT_FIELD_DEFAULTS,
    ...p,
    affiliate_url: "https://www.amazon.com/?tag=YOUR_AFFILIATE_TAG",
    button_text: "View on Amazon",
    tags: p.category.toLowerCase(),
    active: true,
    sort_order: i,
    click_count: 0,
  }));
  const seedSupporters: Array<
    [string, string, string, string | null, string]
  > = [
    ["Amaete", "United States", "US", "Umanah", "Madrid Era"],
    ["Miguel", "Portugal", "PT", null, "Portugal Era"],
    ["Daniel", "Nigeria", "NG", null, "Manchester Era"],
    ["Rafael", "Brazil", "BR", null, "All Eras"],
    ["Yusuf", "Saudi Arabia", "SA", null, "Al Nassr Era"],
    ["Victoria", "Ghana", "GH", null, "Juventus Era"],
    ["Anish", "Nepal", "NP", null, "Madrid Era"],
  ];
  const supporters: Supporter[] = seedSupporters.map((s, i) => ({
    id: crypto.randomUUID(),
    supporter_number: 7 + i,
    first_name: s[0],
    last_name: s[3],
    email: `seed-${i}@example.com`,
    country_name: s[1],
    country_code: s[2],
    favorite_era: s[4],
    message: null,
    show_full_name: i === 0,
    status: "approved",
    created_at: now,
    ...SUPPORTER_TRUST_DEFAULTS,
    display_consent: true,
    published_at: now,
    consent_source: "legacy_migration",
  }));
  return {
    admin_users: [admin],
    supporters,
    global_wall_settings: DEFAULT_SETTINGS,
    affiliate_products: products,
    legal_disclaimers: DEFAULT_LEGAL,
    activity_log: [],
    next_supporter_number: 7 + seedSupporters.length,
  };
}

let writeQueue: Promise<void> = Promise.resolve();
/** Serializes whole read-modify-write transactions (see mutate). */
let mutateQueue: Promise<unknown> = Promise.resolve();

export async function readDb(): Promise<Database> {
  try {
    const raw = await fs.readFile(DB_PATH, "utf8");
    const db = JSON.parse(raw) as Database;
    // Normalize product rows written before the kit-page fields existed.
    db.affiliate_products = db.affiliate_products.map((p) => ({
      ...PRODUCT_FIELD_DEFAULTS,
      ...p,
    }));
    // Normalize supporters written before the trust-layer fields existed:
    // legacy rows are treated as verified + display-consented at signup time.
    db.supporters = db.supporters.map((s) => {
      // Legacy rows keep their public visibility (they joined a public wall)
      // but carry NO manufactured consent events or timestamps — they are
      // tagged consent_source=legacy_migration instead.
      const legacyDefaults = {
        ...SUPPORTER_TRUST_DEFAULTS,
        display_consent: true,
        published_at: s.status === "approved" ? s.created_at : null,
        consent_source: "legacy_migration",
      };
      return { ...legacyDefaults, ...s };
    });
    db.security_tokens ??= [];
    db.email_outbox ??= [];
    db.privacy_requests ??= [];
    db.entry_reports ??= [];
    db.email_suppressions ??= [];
    return db;
  } catch {
    const db = seedDb();
    await writeDb(db);
    return db;
  }
}

export async function writeDb(db: Database): Promise<void> {
  writeQueue = writeQueue.then(async () => {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const tmp = DB_PATH + ".tmp";
    await fs.writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
    await fs.rename(tmp, DB_PATH);
  });
  return writeQueue;
}

export async function mutate<T>(
  fn: (db: Database) => T | Promise<T>
): Promise<T> {
  // The entire read-modify-write runs on a queue so concurrent mutations
  // (e.g. two outbox processors claiming rows) never operate on the same
  // stale snapshot. Mirrors the atomicity of the D1 conditional UPDATEs.
  const run = mutateQueue.then(async () => {
    const db = await readDb();
    const result = await fn(db);
    await writeDb(db);
    return result;
  });
  mutateQueue = run.catch(() => {});
  return run;
}

export function logActivity(
  db: Database,
  type: ActivityEntry["type"],
  detail: string
) {
  db.activity_log.unshift({
    id: crypto.randomUUID(),
    type,
    detail,
    created_at: new Date().toISOString(),
  });
  db.activity_log = db.activity_log.slice(0, 200);
}

/**
 * Public projection of a supporter. Never includes email or message.
 * Full last name only when the supporter opted in and the setting allows;
 * otherwise a last initial (if any) is shown.
 */
export function publicSupporterView(s: Supporter, settings: GlobalWallSettings) {
  const showFull = settings.allow_full_names && s.show_full_name;
  return {
    supporter_number: s.supporter_number,
    first_name: s.first_name,
    last_name: showFull ? s.last_name : null,
    last_initial:
      !showFull && s.last_name ? `${s.last_name[0].toUpperCase()}.` : null,
    country_name: s.country_name,
    country_code: s.country_code,
    favorite_era: settings.show_favorite_era ? s.favorite_era : null,
    created_at: s.created_at,
  };
}

export type PublicSupporter = ReturnType<typeof publicSupporterView>;

export function isSetupMode(db: Database): boolean {
  return db.admin_users.some((a) => a.is_temporary);
}

export type { SupporterStatus };
