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
import { hashPassword } from "./auth";
import type {
  Supporter,
  SupporterStatus,
  AdminUser,
  GlobalWallSettings,
  AffiliateProduct,
  LegalDisclaimers,
  ActivityEntry,
} from "./types";

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

type SupporterRow = Omit<Supporter, "show_full_name"> & {
  show_full_name: number;
};
type ProductRow = Omit<AffiliateProduct, "active"> & { active: number };
type AdminRow = Omit<AdminUser, "is_temporary"> & { is_temporary: number };

const STATUS_FOR_ACTION: Record<SupporterAction, SupporterStatus> = {
  approve: "approved",
  hide: "hidden",
  delete: "deleted",
};

function toSupporter(r: SupporterRow): Supporter {
  return { ...r, show_full_name: !!r.show_full_name };
}
function toProduct(r: ProductRow): AffiliateProduct {
  return { ...r, active: !!r.active };
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
        .prepare("SELECT * FROM supporters WHERE status = 'approved'")
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
    const status: SupporterStatus = settings.require_manual_approval
      ? "pending"
      : "approved";
    const id = crypto.randomUUID();
    // supporter_number assigned atomically in the INSERT (numbers start at 7)
    await this.db
      .prepare(
        `INSERT INTO supporters
           (id, supporter_number, first_name, last_name, email, country_name,
            country_code, favorite_era, message, show_full_name, status, created_at)
         SELECT ?, COALESCE(MAX(supporter_number), 6) + 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
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
        new Date().toISOString()
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
    return { supporter_number, status };
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
      .prepare("UPDATE supporters SET status = ? WHERE id = ?")
      .bind(status, id)
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

  async createProduct(fields: ProductFields, active: boolean) {
    const id = crypto.randomUUID();
    await this.db
      .prepare(
        `INSERT INTO affiliate_products
           (id, title, category, image_path, description, affiliate_url,
            button_text, active, sort_order, click_count)
         SELECT ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(MAX(sort_order), -1) + 1, 0
         FROM affiliate_products`
      )
      .bind(
        id,
        fields.title,
        fields.category,
        fields.image_path,
        fields.description,
        fields.affiliate_url,
        fields.button_text,
        active ? 1 : 0
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
      const next = {
        title: fields.title || product.title,
        category: fields.category || product.category,
        image_path: fields.image_path || product.image_path,
        description: fields.description || product.description,
        affiliate_url: fields.affiliate_url || product.affiliate_url,
        button_text: fields.button_text || product.button_text,
        active:
          typeof fields.active === "boolean" ? fields.active : product.active,
      };
      await this.db
        .prepare(
          `UPDATE affiliate_products SET title = ?, category = ?, image_path = ?,
             description = ?, affiliate_url = ?, button_text = ?, active = ?
           WHERE id = ?`
        )
        .bind(
          next.title,
          next.category,
          next.image_path,
          next.description,
          next.affiliate_url,
          next.button_text,
          next.active ? 1 : 0,
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
                  COUNT(DISTINCT country_code) AS countries,
                  COUNT(DISTINCT email) AS emails,
                  SUM(CASE WHEN created_at LIKE ? THEN 1 ELSE 0 END) AS today
           FROM supporters WHERE status != 'deleted'`
        )
        .bind(`${today}%`)
        .first<{
          total: number;
          pending: number | null;
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
        countries: totals?.countries ?? 0,
        email_signups: totals?.emails ?? 0,
        affiliate_clicks: clicks?.n ?? 0,
        top_era: topEra?.favorite_era ?? "—",
        today_signups: totals?.today ?? 0,
      },
      activity: activity.results,
    };
  }
}
