/**
 * Cloudflare D1 Store implementation (production).
 *
 * Uses the `DB` binding configured in wrangler.toml against the schema in
 * /migrations/0001_init.sql. Seed the database with `npm run db:seed`
 * (scripts/seed-d1.mjs). If the database is migrated but not seeded, this
 * store self-heals: missing settings/legal keys fall back to defaults and a
 * temporary bootstrap admin is created on first login attempt.
 */
import crypto from "crypto";
import type {
  Store,
  SupporterInput,
  SupporterFilters,
  SupporterAction,
  ProductAction,
  ProductFields,
  DashboardStats,
} from "./data";
import { ADMIN_TEMP_EMAIL, ADMIN_TEMP_PASSWORD } from "./data";
import { DEFAULT_SETTINGS, DEFAULT_LEGAL } from "./store";
import { NUMERIC_SETTINGS } from "./types";
import {
  parseGallery,
  parseContent,
  parseFaqs,
  PRODUCT_FIELD_DEFAULTS,
} from "./kit";
import { hashPassword } from "./auth";
import type {
  Supporter,
  SupporterStatus,
  AdminUser,
  GlobalWallSettings,
  AffiliateProduct,
  LegalDisclaimers,
  ActivityEntry,
  SecurityToken,
  OutboxRow,
  PrivacyRequest,
  EntryReport,
} from "./types";
import { SUPPORTER_TRUST_DEFAULTS } from "./types";
import { RETENTION } from "./policy";

/** Minimal structural typing for the D1 binding (avoids a hard dependency on workers-types). */
export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  run(): Promise<{ meta: { changes?: number } }>;
}
export interface D1Database {
  prepare(sql: string): D1PreparedStatement;
  batch(statements: D1PreparedStatement[]): Promise<unknown[]>;
}

type SupporterRow = Omit<
  Supporter,
  "show_full_name" | "display_consent" | "marketing_consent"
> & {
  show_full_name: number;
  display_consent: number | null;
  marketing_consent: number | null;
};
type ProductRow = Omit<
  AffiliateProduct,
  "active" | "featured" | "indexable" | "gallery_images" | "content" | "faqs"
> & {
  active: number;
  featured: number;
  indexable: number;
  gallery_images: string;
  content_json: string;
  faqs_json: string;
};
type AdminRow = Omit<AdminUser, "is_temporary"> & { is_temporary: number };

const STATUS_FOR_ACTION: Record<SupporterAction, SupporterStatus> = {
  approve: "approved",
  hide: "hidden",
  delete: "deleted",
};

function toSupporter(r: SupporterRow): Supporter {
  return {
    ...SUPPORTER_TRUST_DEFAULTS,
    ...r,
    show_full_name: !!r.show_full_name,
    display_consent: !!r.display_consent,
    marketing_consent: !!r.marketing_consent,
  };
}
function toProduct(r: ProductRow): AffiliateProduct {
  const { content_json, faqs_json, ...rest } = r;
  const stringDefaults = Object.fromEntries(
    Object.entries(PRODUCT_FIELD_DEFAULTS).map(([k, v]) => [
      k,
      typeof v === "string" ? v : undefined,
    ])
  );
  return {
    ...(stringDefaults as Partial<AffiliateProduct>),
    ...Object.fromEntries(
      Object.entries(rest).filter(([, v]) => v !== null && v !== undefined)
    ),
    active: !!r.active,
    featured: !!r.featured,
    indexable: r.indexable === undefined || r.indexable === null || !!r.indexable,
    gallery_images: parseGallery(r.gallery_images),
    content: parseContent(content_json),
    faqs: parseFaqs(faqs_json),
  } as AffiliateProduct;
}
function toAdmin(r: AdminRow): AdminUser {
  return { ...r, is_temporary: !!r.is_temporary };
}

export class D1Store implements Store {
  constructor(private db: D1Database) {}

  private async log(type: ActivityEntry["type"], detail: string) {
    await this.db
      .prepare(
        "INSERT INTO activity_log (id, type, detail, created_at) VALUES (?, ?, ?, ?)"
      )
      .bind(crypto.randomUUID(), type, detail, new Date().toISOString())
      .run();
  }

  // ---------- settings / legal ----------

  async getSettings(): Promise<GlobalWallSettings> {
    const { results } = await this.db
      .prepare("SELECT key, value FROM global_wall_settings")
      .all<{ key: string; value: number }>();
    const settings: GlobalWallSettings = { ...DEFAULT_SETTINGS };
    const numeric = new Set<string>(NUMERIC_SETTINGS);
    for (const row of results) {
      if (!(row.key in settings)) continue;
      const target = settings as unknown as Record<string, boolean | number>;
      target[row.key] = numeric.has(row.key) ? row.value : !!row.value;
    }
    return settings;
  }

  async updateSettings(patch: Partial<GlobalWallSettings>) {
    for (const [key, value] of Object.entries(patch)) {
      if (typeof value !== "boolean" && typeof value !== "number") continue;
      await this.db
        .prepare(
          "INSERT INTO global_wall_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
        )
        .bind(key, typeof value === "number" ? Math.round(value) : value ? 1 : 0)
        .run();
    }
    await this.log("settings_changed", "Global Wall settings updated");
    return this.getSettings();
  }

  async getLegal(): Promise<LegalDisclaimers> {
    const { results } = await this.db
      .prepare("SELECT key, value FROM legal_disclaimers")
      .all<{ key: string; value: string }>();
    const legal = { ...DEFAULT_LEGAL };
    for (const row of results) {
      if (row.key in legal) legal[row.key as keyof LegalDisclaimers] = row.value;
    }
    return legal;
  }

  async updateLegal(patch: Partial<LegalDisclaimers>) {
    for (const [key, value] of Object.entries(patch)) {
      if (typeof value !== "string") continue;
      await this.db
        .prepare(
          "INSERT INTO legal_disclaimers (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at"
        )
        .bind(key, value, new Date().toISOString())
        .run();
    }
    await this.log("legal_edited", "Legal disclaimers updated");
    return this.getLegal();
  }

  // ---------- public home ----------

  async getPublicHome() {
    const [settings, legal, productRows, supporterRows] = await Promise.all([
      this.getSettings(),
      this.getLegal(),
      this.db
        .prepare(
          "SELECT * FROM affiliate_products WHERE active = 1 ORDER BY sort_order ASC"
        )
        .all<ProductRow>(),
      this.db
        .prepare(
          "SELECT * FROM supporters WHERE status = 'approved' AND display_consent = 1"
        )
        .all<SupporterRow>(),
    ]);
    return {
      settings,
      legal,
      products: productRows.results.map(toProduct),
      approved: supporterRows.results.map(toSupporter),
    };
  }

  // ---------- supporters ----------

  async submitSupporter(input: SupporterInput) {
    const settings = await this.getSettings();
    if (!settings.enable_submissions || settings.emergency_lock) {
      return { error: "Submissions are currently closed." };
    }
    const c = input.consents;
    const requireVerification = c?.require_email_verification ?? false;
    const status: SupporterStatus =
      requireVerification || settings.require_manual_approval
        ? "pending"
        : "approved";
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    // supporter_number assigned atomically in the INSERT (numbers start at 7)
    await this.db
      .prepare(
        `INSERT INTO supporters
           (id, supporter_number, first_name, last_name, email, country_name,
            country_code, favorite_era, message, show_full_name, status, created_at,
            email_verified_at, terms_version, terms_accepted_at, privacy_version,
            privacy_ack_at, display_consent, display_consent_at, marketing_consent,
            marketing_consent_at, age_attested_at, published_at, consent_source)
         SELECT ?, COALESCE(MAX(supporter_number), 6) + 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
         FROM supporters`
      )
      .bind(
        id,
        input.first_name,
        input.last_name,
        input.email,
        input.country_name,
        input.country_code,
        input.favorite_era,
        settings.allow_fan_messages ? input.message : null,
        settings.allow_full_names && input.show_full_name ? 1 : 0,
        status,
        now,
        requireVerification ? null : now,
        c?.terms_version ?? null,
        c ? now : null,
        c?.privacy_version ?? null,
        c ? now : null,
        c ? (c.display_consent ? 1 : 0) : 1,
        c?.display_consent ? now : null,
        c?.marketing_consent ? 1 : 0,
        c?.marketing_consent ? now : null,
        c?.age_attested ? now : null,
        status === "approved" ? now : null,
        c ? "signup_form" : "legacy_migration"
      )
      .run();
    const row = await this.db
      .prepare("SELECT supporter_number FROM supporters WHERE id = ?")
      .bind(id)
      .first<{ supporter_number: number }>();
    const supporter_number = row?.supporter_number ?? 0;
    await this.log(
      "supporter_submitted",
      `New supporter #${supporter_number} (${input.first_name}, ${input.country_name}) submitted`
    );
    return { id, supporter_number, status };
  }

  async listSupporters(filters: SupporterFilters): Promise<Supporter[]> {
    const clauses = ["status != 'deleted'"];
    const params: unknown[] = [];
    if (filters.status) {
      clauses.push("status = ?");
      params.push(filters.status);
    }
    if (filters.country) {
      clauses.push("country_code = ?");
      params.push(filters.country.toUpperCase());
    }
    if (filters.era) {
      clauses.push("favorite_era = ?");
      params.push(filters.era);
    }
    if (filters.q) {
      clauses.push(
        "(LOWER(first_name) LIKE ? OR LOWER(COALESCE(last_name, '')) LIKE ? OR LOWER(email) LIKE ?)"
      );
      const like = `%${filters.q.toLowerCase()}%`;
      params.push(like, like, like);
    }
    const { results } = await this.db
      .prepare(
        `SELECT * FROM supporters WHERE ${clauses.join(" AND ")} ORDER BY supporter_number DESC`
      )
      .bind(...params)
      .all<SupporterRow>();
    return results.map(toSupporter);
  }

  async setSupporterStatus(id: string, action: SupporterAction) {
    const status = STATUS_FOR_ACTION[action];
    const row = await this.db
      .prepare("SELECT supporter_number FROM supporters WHERE id = ?")
      .bind(id)
      .first<{ supporter_number: number }>();
    if (!row) return false;
    await this.db
      .prepare(
        "UPDATE supporters SET status = ?, published_at = CASE WHEN ? = 'approved' THEN COALESCE(published_at, ?) ELSE published_at END WHERE id = ?"
      )
      .bind(status, status, new Date().toISOString(), id)
      .run();
    const type =
      action === "approve"
        ? "supporter_approved"
        : action === "hide"
          ? "supporter_hidden"
          : "supporter_deleted";
    await this.log(type, `Supporter #${row.supporter_number} ${status}`);
    return true;
  }

  // ---------- affiliate products ----------

  async listProducts(): Promise<AffiliateProduct[]> {
    const { results } = await this.db
      .prepare("SELECT * FROM affiliate_products ORDER BY sort_order ASC")
      .all<ProductRow>();
    return results.map(toProduct);
  }

  async listActiveProducts(): Promise<AffiliateProduct[]> {
    const { results } = await this.db
      .prepare(
        "SELECT * FROM affiliate_products WHERE active = 1 ORDER BY sort_order ASC"
      )
      .all<ProductRow>();
    return results.map(toProduct);
  }

  /** Editable columns in bind order (see fieldBindValues). */
  private static FIELD_COLUMNS = [
    "title",
    "short_title",
    "brand",
    "category",
    "image_path",
    "image_alt",
    "description",
    "affiliate_url",
    "button_text",
    "slug",
    "tags",
    "gallery_images",
    "seo_title",
    "seo_description",
    "og_title",
    "og_description",
    "og_image",
    "primary_keyword",
    "secondary_keywords",
    "search_intent",
    "h1",
    "eyebrow",
    "image_disclaimer",
    "affiliate_disclosure",
    "legal_disclaimer",
    "content_json",
    "faqs_json",
    "related_fallback_slugs",
    "featured",
    "indexable",
  ] as const;

  private static fieldBindValues(f: ProductFields): unknown[] {
    return [
      f.title,
      f.short_title,
      f.brand,
      f.category,
      f.image_path,
      f.image_alt,
      f.description,
      f.affiliate_url,
      f.button_text,
      f.slug,
      f.tags,
      JSON.stringify(f.gallery_images ?? []),
      f.seo_title,
      f.seo_description,
      f.og_title,
      f.og_description,
      f.og_image,
      f.primary_keyword,
      f.secondary_keywords,
      f.search_intent,
      f.h1,
      f.eyebrow,
      f.image_disclaimer,
      f.affiliate_disclosure,
      f.legal_disclaimer,
      JSON.stringify(f.content ?? {}),
      JSON.stringify(f.faqs ?? []),
      f.related_fallback_slugs,
      f.featured ? 1 : 0,
      f.indexable ? 1 : 0,
    ];
  }

  async createProduct(fields: ProductFields, active: boolean) {
    const id = crypto.randomUUID();
    const cols = D1Store.FIELD_COLUMNS;
    await this.db
      .prepare(
        `INSERT INTO affiliate_products
           (id, ${cols.join(", ")}, active, updated_at, sort_order, click_count)
         SELECT ?, ${cols.map(() => "?").join(", ")}, ?, ?, COALESCE(MAX(sort_order), -1) + 1, 0
         FROM affiliate_products`
      )
      .bind(
        id,
        ...D1Store.fieldBindValues(fields),
        active ? 1 : 0,
        new Date().toISOString()
      )
      .run();
    const row = await this.db
      .prepare("SELECT * FROM affiliate_products WHERE id = ?")
      .bind(id)
      .first<ProductRow>();
    return toProduct(row!);
  }

  async updateProduct(
    id: string,
    action: ProductAction,
    fields?: Partial<ProductFields> & { active?: boolean }
  ) {
    const products = await this.listProducts();
    const idx = products.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    const product = products[idx];

    const swapOrder = async (a: AffiliateProduct, b: AffiliateProduct) => {
      await this.db
        .prepare("UPDATE affiliate_products SET sort_order = ? WHERE id = ?")
        .bind(b.sort_order, a.id)
        .run();
      await this.db
        .prepare("UPDATE affiliate_products SET sort_order = ? WHERE id = ?")
        .bind(a.sort_order, b.id)
        .run();
    };

    if (action === "move_up" && idx > 0) {
      await swapOrder(product, products[idx - 1]);
    } else if (action === "move_down" && idx < products.length - 1) {
      await swapOrder(product, products[idx + 1]);
    } else if (action === "toggle_active") {
      await this.db
        .prepare("UPDATE affiliate_products SET active = ? WHERE id = ?")
        .bind(product.active ? 0 : 1, id)
        .run();
    } else if (action === "update" && fields) {
      const merged: AffiliateProduct = { ...product };
      for (const [key, value] of Object.entries(fields)) {
        if (value === undefined) continue;
        (merged as unknown as Record<string, unknown>)[key] = value;
      }
      const cols = D1Store.FIELD_COLUMNS;
      await this.db
        .prepare(
          `UPDATE affiliate_products
             SET ${cols.map((c) => `${c} = ?`).join(", ")}, active = ?, updated_at = ?
           WHERE id = ?`
        )
        .bind(
          ...D1Store.fieldBindValues(merged),
          merged.active ? 1 : 0,
          new Date().toISOString(),
          id
        )
        .run();
    }
    return true;
  }

  async deleteProduct(id: string) {
    await this.db
      .prepare("DELETE FROM affiliate_clicks WHERE product_id = ?")
      .bind(id)
      .run();
    const res = await this.db
      .prepare("DELETE FROM affiliate_products WHERE id = ?")
      .bind(id)
      .run();
    return (res.meta.changes ?? 0) > 0;
  }

  async recordAffiliateClick(productId: string) {
    const product = await this.db
      .prepare("SELECT title FROM affiliate_products WHERE id = ?")
      .bind(productId)
      .first<{ title: string }>();
    if (!product) return;
    await this.db
      .prepare(
        "UPDATE affiliate_products SET click_count = click_count + 1 WHERE id = ?"
      )
      .bind(productId)
      .run();
    await this.db
      .prepare(
        "INSERT INTO affiliate_clicks (id, product_id, created_at) VALUES (?, ?, ?)"
      )
      .bind(crypto.randomUUID(), productId, new Date().toISOString())
      .run();
    await this.log(
      "affiliate_click",
      `Affiliate product clicked: ${product.title}`
    );
  }

  // ---------- admin ----------

  /** Creates the temporary bootstrap admin if the table is empty (hash only). */
  private async ensureBootstrapAdmin(): Promise<void> {
    // No bootstrap without explicit credentials (never in production unless
    // ADMIN_TEMP_* env/secrets are deliberately set).
    if (!ADMIN_TEMP_EMAIL || !ADMIN_TEMP_PASSWORD) return;
    const row = await this.db
      .prepare("SELECT COUNT(*) AS n FROM admin_users")
      .first<{ n: number }>();
    if ((row?.n ?? 0) > 0) return;
    const now = new Date().toISOString();
    await this.db
      .prepare(
        `INSERT INTO admin_users (id, email, password_hash, is_temporary, created_at, updated_at)
         VALUES (?, ?, ?, 1, ?, ?)`
      )
      .bind(
        crypto.randomUUID(),
        ADMIN_TEMP_EMAIL,
        hashPassword(ADMIN_TEMP_PASSWORD),
        now,
        now
      )
      .run();
  }

  async getAdminById(id: string): Promise<AdminUser | null> {
    const row = await this.db
      .prepare("SELECT * FROM admin_users WHERE id = ?")
      .bind(id)
      .first<AdminRow>();
    return row ? toAdmin(row) : null;
  }

  async getAdminByEmail(email: string): Promise<AdminUser | null> {
    await this.ensureBootstrapAdmin();
    const row = await this.db
      .prepare("SELECT * FROM admin_users WHERE LOWER(email) = LOWER(?)")
      .bind(email)
      .first<AdminRow>();
    return row ? toAdmin(row) : null;
  }

  async isSetupMode(): Promise<boolean> {
    await this.ensureBootstrapAdmin();
    const row = await this.db
      .prepare("SELECT COUNT(*) AS n FROM admin_users WHERE is_temporary = 1")
      .first<{ n: number }>();
    return (row?.n ?? 0) > 0;
  }

  async updateAdminCredentials(
    id: string,
    opts: { email?: string; passwordHash?: string }
  ) {
    const now = new Date().toISOString();
    if (opts.email) {
      await this.db
        .prepare("UPDATE admin_users SET email = ?, updated_at = ? WHERE id = ?")
        .bind(opts.email, now, id)
        .run();
    }
    if (opts.passwordHash) {
      // Changing the password permanently ends temporary setup mode.
      await this.db
        .prepare(
          "UPDATE admin_users SET password_hash = ?, is_temporary = 0, updated_at = ? WHERE id = ?"
        )
        .bind(opts.passwordHash, now, id)
        .run();
    }
    await this.log("credentials_changed", "Admin credentials updated");
  }

  // ---------- stats ----------

  async getStats(): Promise<{
    stats: DashboardStats;
    activity: ActivityEntry[];
  }> {
    const today = new Date().toISOString().slice(0, 10);
    const [totals, clicks, topEra, activity] = await Promise.all([
      this.db
        .prepare(
          `SELECT COUNT(*) AS total,
                  SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
                  SUM(CASE WHEN status = 'pending' AND email_verified_at IS NOT NULL THEN 1 ELSE 0 END) AS flagged,
                  SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS approved,
                  SUM(CASE WHEN status = 'hidden' THEN 1 ELSE 0 END) AS hidden,
                  COUNT(DISTINCT country_code) AS countries,
                  COUNT(DISTINCT email) AS emails,
                  SUM(CASE WHEN created_at LIKE ? THEN 1 ELSE 0 END) AS today
           FROM supporters WHERE status != 'deleted'`
        )
        .bind(`${today}%`)
        .first<{
          total: number;
          pending: number | null;
          flagged: number | null;
          approved: number | null;
          hidden: number | null;
          countries: number;
          emails: number;
          today: number | null;
        }>(),
      this.db
        .prepare(
          "SELECT COALESCE(SUM(click_count), 0) AS n FROM affiliate_products"
        )
        .first<{ n: number }>(),
      this.db
        .prepare(
          `SELECT favorite_era, COUNT(*) AS n FROM supporters
           WHERE status != 'deleted' AND favorite_era IS NOT NULL
           GROUP BY favorite_era ORDER BY n DESC LIMIT 1`
        )
        .first<{ favorite_era: string }>(),
      this.db
        .prepare(
          "SELECT * FROM activity_log ORDER BY created_at DESC LIMIT 20"
        )
        .all<ActivityEntry>(),
    ]);
    return {
      stats: {
        total_supporters: totals?.total ?? 0,
        pending_approval: totals?.pending ?? 0,
        flagged_review: totals?.flagged ?? 0,
        auto_approved: totals?.approved ?? 0,
        unpublished: totals?.hidden ?? 0,
        countries: totals?.countries ?? 0,
        email_signups: totals?.emails ?? 0,
        affiliate_clicks: clicks?.n ?? 0,
        top_era: topEra?.favorite_era ?? "—",
        today_signups: totals?.today ?? 0,
      },
      activity: activity.results,
    };
  }

  // ---------- trust layer ----------

  async getSupporterById(id: string): Promise<Supporter | null> {
    const row = await this.db
      .prepare("SELECT * FROM supporters WHERE id = ?")
      .bind(id)
      .first<SupporterRow>();
    return row ? toSupporter(row) : null;
  }

  async findSupporterByEmail(email: string): Promise<Supporter | null> {
    const row = await this.db
      .prepare(
        "SELECT * FROM supporters WHERE LOWER(email) = LOWER(?) AND status != 'deleted' ORDER BY created_at DESC LIMIT 1"
      )
      .bind(email)
      .first<SupporterRow>();
    return row ? toSupporter(row) : null;
  }

  async markSupporterVerified(id: string): Promise<Supporter | null> {
    const now = new Date().toISOString();
    // Mark verified but keep the entry pending + nonpublic. Approval (and
    // publication) is decided afterward by the verify route: clean
    // submissions in auto-approve mode call autoApproveVerified; flagged
    // ones stay pending for the moderation queue.
    const res = await this.db
      .prepare(
        `UPDATE supporters
         SET email_verified_at = ?
         WHERE id = ? AND email_verified_at IS NULL AND status = 'pending'`
      )
      .bind(now, id)
      .run();
    if (!res.meta.changes) return null;
    return this.getSupporterById(id);
  }

  async autoApproveVerified(id: string): Promise<Supporter | null> {
    const now = new Date().toISOString();
    // Atomic + guarded: only a verified, still-pending row with active
    // display consent transitions. Retries find status != 'pending' and
    // change nothing, so approval/publication/number stay exactly-once.
    const res = await this.db
      .prepare(
        `UPDATE supporters
         SET status = 'approved', published_at = COALESCE(published_at, ?)
         WHERE id = ? AND status = 'pending' AND email_verified_at IS NOT NULL
           AND display_consent = 1`
      )
      .bind(now, id)
      .run();
    if (!res.meta.changes) return null;
    await this.log(
      "supporter_approved",
      `Supporter #(auto) approved after verification`
    );
    return this.getSupporterById(id);
  }

  async hasDuplicateMessage(
    normalizedMessage: string,
    excludeId: string
  ): Promise<boolean> {
    if (!normalizedMessage) return false;
    const row = await this.db
      .prepare(
        `SELECT COUNT(*) AS n FROM supporters
         WHERE id != ? AND status != 'deleted' AND message IS NOT NULL
           AND LOWER(TRIM(message)) = ?`
      )
      .bind(excludeId, normalizedMessage)
      .first<{ n: number }>();
    return (row?.n ?? 0) > 0;
  }

  async updateSupporterFields(
    id: string,
    patch: Record<string, unknown>
  ): Promise<boolean> {
    const allowed = new Set([
      "first_name",
      "last_name",
      "favorite_era",
      "message",
      "show_full_name",
      "display_consent",
      "display_consent_at",
      "display_consent_withdrawn_at",
      "marketing_consent",
      "marketing_consent_at",
      "marketing_withdrawn_at",
      "status",
      "published_at",
      "moderation_note",
      "terms_version",
      "terms_accepted_at",
      "privacy_version",
      "privacy_ack_at",
      "consent_source",
      "email_verified_at",
    ]);
    const keys = Object.keys(patch).filter((k) => allowed.has(k));
    if (keys.length === 0) return false;
    const sets = keys.map((k) => `${k} = ?`).join(", ");
    const values = keys.map((k) => {
      const v = patch[k];
      return typeof v === "boolean" ? (v ? 1 : 0) : v;
    });
    const res = await this.db
      .prepare(`UPDATE supporters SET ${sets} WHERE id = ? AND status != 'deleted'`)
      .bind(...values, id)
      .run();
    return !!res.meta.changes;
  }

  async anonymizeSupporter(id: string): Promise<boolean> {
    const now = new Date().toISOString();
    const res = await this.db
      .prepare(
        `UPDATE supporters SET
           first_name = 'Deleted', last_name = NULL,
           email = 'deleted-' || id || '@invalid.sevenfc.net',
           favorite_era = NULL, message = NULL, show_full_name = 0,
           display_consent = 0, marketing_consent = 0,
           status = 'deleted', deleted_at = ?, moderation_note = NULL
         WHERE id = ?`
      )
      .bind(now, id)
      .run();
    if (res.meta.changes) {
      await this.invalidateSecurityTokens("manage", id);
      await this.invalidateSecurityTokens("verify", id);
      await this.log("supporter_deleted", `Supporter record ${id} anonymized (privacy request)`);
    }
    return !!res.meta.changes;
  }

  async createSecurityToken(t: {
    purpose: SecurityToken["purpose"];
    subject_id: string;
    token_hash: string;
    expires_at: string;
  }): Promise<void> {
    await this.db
      .prepare(
        "INSERT INTO security_tokens (id, purpose, subject_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?)"
      )
      .bind(
        crypto.randomUUID(),
        t.purpose,
        t.subject_id,
        t.token_hash,
        t.expires_at,
        new Date().toISOString()
      )
      .run();
  }

  async consumeSecurityToken(
    purpose: SecurityToken["purpose"],
    token_hash: string
  ): Promise<SecurityToken | null> {
    const now = new Date().toISOString();
    // Atomic one-time consumption: only an unused, unexpired token flips.
    const res = await this.db
      .prepare(
        "UPDATE security_tokens SET used_at = ? WHERE purpose = ? AND token_hash = ? AND used_at IS NULL AND expires_at > ?"
      )
      .bind(now, purpose, token_hash, now)
      .run();
    if (!res.meta.changes) return null;
    const row = await this.db
      .prepare("SELECT * FROM security_tokens WHERE purpose = ? AND token_hash = ?")
      .bind(purpose, token_hash)
      .first<SecurityToken>();
    return row ?? null;
  }

  async peekSecurityToken(
    purpose: SecurityToken["purpose"],
    token_hash: string
  ): Promise<SecurityToken | null> {
    const row = await this.db
      .prepare(
        "SELECT * FROM security_tokens WHERE purpose = ? AND token_hash = ? AND used_at IS NULL AND expires_at > ?"
      )
      .bind(purpose, token_hash, new Date().toISOString())
      .first<SecurityToken>();
    return row ?? null;
  }

  async invalidateSecurityTokens(
    purpose: SecurityToken["purpose"],
    subject_id: string
  ): Promise<void> {
    await this.db
      .prepare(
        "UPDATE security_tokens SET used_at = ? WHERE purpose = ? AND subject_id = ? AND used_at IS NULL"
      )
      .bind(new Date().toISOString(), purpose, subject_id)
      .run();
  }

  async enqueueOutbox(row: {
    event_key: string;
    notification_type: string;
    related_id: string | null;
    recipient: string;
    from_addr: string;
    reply_to: string | null;
    subject: string;
    body_html: string | null;
    body_text: string | null;
    status: OutboxRow["status"];
  }): Promise<void> {
    const now = new Date().toISOString();
    // ON CONFLICT DO NOTHING = idempotency on event_key.
    await this.db
      .prepare(
        `INSERT INTO email_outbox
           (id, event_key, notification_type, related_id, recipient, from_addr,
            reply_to, subject, body_html, body_text, status, next_attempt_at,
            created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(event_key) DO NOTHING`
      )
      .bind(
        crypto.randomUUID(),
        row.event_key,
        row.notification_type,
        row.related_id,
        row.recipient,
        row.from_addr,
        row.reply_to,
        row.subject,
        row.body_html,
        row.body_text,
        row.status,
        row.status === "pending" ? now : null,
        now,
        now
      )
      .run();
  }

  async claimDueOutbox(limit: number): Promise<OutboxRow[]> {
    const now = new Date().toISOString();
    // Recover rows stuck in `processing` (crashed worker) after 10 minutes.
    const stale = new Date(Date.now() - 10 * 60_000).toISOString();
    await this.db
      .prepare(
        "UPDATE email_outbox SET status = 'pending', updated_at = ? WHERE status = 'processing' AND updated_at < ?"
      )
      .bind(now, stale)
      .run();
    const { results } = await this.db
      .prepare(
        `SELECT * FROM email_outbox
         WHERE status = 'pending' AND (next_attempt_at IS NULL OR next_attempt_at <= ?)
         ORDER BY created_at ASC LIMIT ?`
      )
      .bind(now, limit)
      .all<OutboxRow>();
    // Atomic per-row claim: a concurrent processor loses the UPDATE race and
    // skips the row, so overlapping executions can never double-send.
    const claimed: OutboxRow[] = [];
    for (const row of results) {
      const res = await this.db
        .prepare(
          "UPDATE email_outbox SET status = 'processing', updated_at = ? WHERE id = ? AND status = 'pending'"
        )
        .bind(now, row.id)
        .run();
      if (res.meta.changes) claimed.push(row);
    }
    return claimed;
  }

  async finishOutboxAttempt(
    id: string,
    result: {
      status: OutboxRow["status"];
      provider?: string;
      providerMessageId?: string;
      error?: string;
      nextAttemptAt?: string | null;
      countAttempt?: boolean;
    }
  ): Promise<void> {
    const now = new Date().toISOString();
    const inc = result.countAttempt === false ? 0 : 1;
    await this.db
      .prepare(
        `UPDATE email_outbox SET
           status = ?, attempt_count = attempt_count + ?, last_attempt_at = ?,
           sent_at = CASE WHEN ? = 'sent' THEN ? ELSE sent_at END,
           body_html = CASE WHEN ? = 'sent' THEN NULL ELSE body_html END,
           body_text = CASE WHEN ? = 'sent' THEN NULL ELSE body_text END,
           provider = COALESCE(?, provider),
           provider_message_id = COALESCE(?, provider_message_id),
           last_error = ?, next_attempt_at = ?, updated_at = ?
         WHERE id = ?`
      )
      .bind(
        result.status,
        inc,
        now,
        result.status,
        now,
        result.status,
        result.status,
        result.provider ?? null,
        result.providerMessageId ?? null,
        result.error ?? null,
        result.nextAttemptAt ?? null,
        now,
        id
      )
      .run();
  }

  async outboxSummary() {
    const row = await this.db
      .prepare(
        `SELECT
           SUM(CASE WHEN status IN ('pending','processing') THEN 1 ELSE 0 END) AS pending,
           SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) AS sent,
           SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed
         FROM email_outbox`
      )
      .first<{ pending: number | null; sent: number | null; failed: number | null }>();
    return {
      pending: row?.pending ?? 0,
      sent: row?.sent ?? 0,
      failed: row?.failed ?? 0,
    };
  }

  async getOutboxByEventKey(eventKey: string): Promise<OutboxRow | null> {
    const row = await this.db
      .prepare("SELECT * FROM email_outbox WHERE event_key = ?")
      .bind(eventKey)
      .first<OutboxRow>();
    return row ?? null;
  }

  async isEmailSuppressed(email: string): Promise<boolean> {
    const row = await this.db
      .prepare("SELECT email FROM email_suppressions WHERE email = ?")
      .bind(email.toLowerCase())
      .first();
    return !!row;
  }

  async addEmailSuppression(email: string, reason: string): Promise<void> {
    await this.db
      .prepare(
        "INSERT INTO email_suppressions (email, reason, created_at) VALUES (?, ?, ?) ON CONFLICT(email) DO NOTHING"
      )
      .bind(email.toLowerCase(), reason, new Date().toISOString())
      .run();
  }

  async createPrivacyRequest(r: {
    email: string;
    request_type: PrivacyRequest["request_type"];
    details: string | null;
  }): Promise<PrivacyRequest> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await this.db
      .prepare(
        "INSERT INTO privacy_requests (id, email, request_type, details, status, created_at) VALUES (?, ?, ?, ?, 'pending_verification', ?)"
      )
      .bind(id, r.email, r.request_type, r.details, now)
      .run();
    return {
      id,
      email: r.email,
      request_type: r.request_type,
      details: r.details,
      status: "pending_verification",
      verified_at: null,
      completed_at: null,
      note: null,
      created_at: now,
    };
  }

  async getPrivacyRequest(id: string): Promise<PrivacyRequest | null> {
    const row = await this.db
      .prepare("SELECT * FROM privacy_requests WHERE id = ?")
      .bind(id)
      .first<PrivacyRequest>();
    return row ?? null;
  }

  async updatePrivacyRequest(
    id: string,
    patch: Partial<Pick<PrivacyRequest, "status" | "verified_at" | "completed_at" | "note">>
  ): Promise<boolean> {
    const keys = Object.keys(patch);
    if (!keys.length) return false;
    const sets = keys.map((k) => `${k} = ?`).join(", ");
    const res = await this.db
      .prepare(`UPDATE privacy_requests SET ${sets} WHERE id = ?`)
      .bind(...keys.map((k) => (patch as Record<string, unknown>)[k]), id)
      .run();
    return !!res.meta.changes;
  }

  async listPrivacyRequests(): Promise<PrivacyRequest[]> {
    const { results } = await this.db
      .prepare("SELECT * FROM privacy_requests ORDER BY created_at DESC LIMIT 200")
      .all<PrivacyRequest>();
    return results;
  }

  async createEntryReport(r: {
    supporter_id: string;
    reason: string;
    details: string | null;
    reporter_hash: string | null;
  }): Promise<{ created: boolean }> {
    if (r.reporter_hash) {
      const dup = await this.db
        .prepare(
          "SELECT id FROM entry_reports WHERE supporter_id = ? AND reporter_hash = ? AND status = 'open'"
        )
        .bind(r.supporter_id, r.reporter_hash)
        .first();
      if (dup) return { created: false };
    }
    await this.db
      .prepare(
        "INSERT INTO entry_reports (id, supporter_id, reason, details, reporter_hash, status, created_at) VALUES (?, ?, ?, ?, ?, 'open', ?)"
      )
      .bind(
        crypto.randomUUID(),
        r.supporter_id,
        r.reason,
        r.details,
        r.reporter_hash,
        new Date().toISOString()
      )
      .run();
    return { created: true };
  }

  async listEntryReports(status?: EntryReport["status"]): Promise<EntryReport[]> {
    const { results } = status
      ? await this.db
          .prepare("SELECT * FROM entry_reports WHERE status = ? ORDER BY created_at DESC LIMIT 200")
          .bind(status)
          .all<EntryReport>()
      : await this.db
          .prepare("SELECT * FROM entry_reports ORDER BY created_at DESC LIMIT 200")
          .all<EntryReport>();
    return results;
  }

  async updateEntryReport(id: string, status: EntryReport["status"]): Promise<boolean> {
    const res = await this.db
      .prepare("UPDATE entry_reports SET status = ? WHERE id = ?")
      .bind(status, id)
      .run();
    return !!res.meta.changes;
  }

  async incrementRateLimit(key: string, windowMs: number) {
    const now = Date.now();
    const reset = new Date(now + windowMs).toISOString();
    const nowIso = new Date(now).toISOString();
    // Atomic: expired windows restart at 1; live windows increment.
    await this.db
      .prepare(
        `INSERT INTO rate_limits (key, count, reset_at) VALUES (?, 1, ?)
         ON CONFLICT(key) DO UPDATE SET
           count = CASE WHEN rate_limits.reset_at <= ? THEN 1 ELSE rate_limits.count + 1 END,
           reset_at = CASE WHEN rate_limits.reset_at <= ? THEN excluded.reset_at ELSE rate_limits.reset_at END`
      )
      .bind(key, reset, nowIso, nowIso)
      .run();
    const row = await this.db
      .prepare("SELECT count, reset_at FROM rate_limits WHERE key = ?")
      .bind(key)
      .first<{ count: number; reset_at: string }>();
    return row ?? { count: 1, reset_at: reset };
  }

  async hasPermanentAdmin(): Promise<boolean> {
    const row = await this.db
      .prepare("SELECT COUNT(*) n FROM admin_users WHERE is_temporary = 0")
      .first<{ n: number }>();
    return (row?.n ?? 0) > 0;
  }

  async countActiveRateLimits(): Promise<number> {
    const row = await this.db
      .prepare("SELECT COUNT(*) n FROM rate_limits WHERE reset_at > ?")
      .bind(new Date().toISOString())
      .first<{ n: number }>();
    return row?.n ?? 0;
  }

  async getOpsMeta(key: string): Promise<string | null> {
    const row = await this.db
      .prepare("SELECT value FROM ops_meta WHERE key = ?")
      .bind(key)
      .first<{ value: string }>();
    return row?.value ?? null;
  }

  async setOpsMeta(key: string, value: string): Promise<void> {
    await this.db
      .prepare(
        "INSERT INTO ops_meta (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at"
      )
      .bind(key, value, new Date().toISOString())
      .run();
  }

  async readinessCounts() {
    const [outbox, suppressed, moderation, reports, privacy, legacy] =
      await Promise.all([
        this.outboxSummary(),
        this.db
          .prepare("SELECT COUNT(*) n FROM email_suppressions")
          .first<{ n: number }>(),
        this.db
          .prepare(
            "SELECT COUNT(*) n FROM supporters WHERE status = 'pending' AND email_verified_at IS NOT NULL"
          )
          .first<{ n: number }>(),
        this.db
          .prepare("SELECT COUNT(*) n FROM entry_reports WHERE status = 'open'")
          .first<{ n: number }>(),
        this.db
          .prepare(
            "SELECT COUNT(*) n FROM privacy_requests WHERE status IN ('pending_verification','verified')"
          )
          .first<{ n: number }>(),
        this.db
          .prepare(
            "SELECT COUNT(*) n FROM supporters WHERE consent_source = 'legacy_migration' AND status != 'deleted'"
          )
          .first<{ n: number }>(),
      ]);
    return {
      outbox_pending: outbox.pending,
      outbox_failed: outbox.failed,
      outbox_sent: outbox.sent,
      suppressed: suppressed?.n ?? 0,
      pending_moderation: moderation?.n ?? 0,
      open_reports: reports?.n ?? 0,
      pending_privacy_requests: privacy?.n ?? 0,
      legacy_consent_supporters: legacy?.n ?? 0,
    };
  }

  async retentionCleanup() {
    const now = Date.now();
    const iso = (ms: number) => new Date(now - ms).toISOString();
    // 1. Unverified signups past retention — hard delete (they never joined).
    const removed = await this.db
      .prepare(
        "DELETE FROM supporters WHERE status = 'pending' AND email_verified_at IS NULL AND created_at < ?"
      )
      .bind(iso(RETENTION.unverifiedSignupMs))
      .run();
    // 1b. Flagged verified submissions left unresolved in the review queue
    //     past retention — anonymize (keeps the number retired, not reused).
    const staleFlagged = await this.db
      .prepare(
        `SELECT id FROM supporters
         WHERE status = 'pending' AND email_verified_at IS NOT NULL AND created_at < ?`
      )
      .bind(iso(RETENTION.flaggedReviewMs))
      .all<{ id: string }>();
    for (const row of staleFlagged.results) {
      await this.anonymizeSupporter(row.id);
    }
    // 2. Old used/expired token rows.
    const tokens = await this.db
      .prepare(
        "DELETE FROM security_tokens WHERE (used_at IS NOT NULL OR expires_at < ?) AND created_at < ?"
      )
      .bind(new Date(now).toISOString(), iso(RETENTION.tokenRowMs))
      .run();
    // 3. Redact bodies of old sent/failed emails; purge very old rows.
    const redacted = await this.db
      .prepare(
        `UPDATE email_outbox SET body_html = NULL, body_text = NULL, updated_at = ?
         WHERE status IN ('sent','failed','suppressed','cancelled')
           AND (body_html IS NOT NULL OR body_text IS NOT NULL)
           AND created_at < ?`
      )
      .bind(new Date(now).toISOString(), iso(RETENTION.outboxBodyMs))
      .run();
    await this.db
      .prepare(
        "DELETE FROM email_outbox WHERE status IN ('sent','failed','suppressed','cancelled') AND created_at < ?"
      )
      .bind(iso(RETENTION.outboxRowMs))
      .run();
    await this.db
      .prepare("DELETE FROM entry_reports WHERE status != 'open' AND created_at < ?")
      .bind(iso(RETENTION.reportRowMs))
      .run();
    await this.db
      .prepare(
        "DELETE FROM privacy_requests WHERE status IN ('completed','rejected') AND created_at < ?"
      )
      .bind(iso(RETENTION.privacyRequestMs))
      .run();
    // Expired rate-limit windows (hashed identifiers only) purge immediately.
    await this.db
      .prepare("DELETE FROM rate_limits WHERE reset_at <= ?")
      .bind(new Date(now).toISOString())
      .run();
    return {
      removedSupporters: removed.meta.changes ?? 0,
      removedTokens: tokens.meta.changes ?? 0,
      redactedEmails: redacted.meta.changes ?? 0,
    };
  }
}
