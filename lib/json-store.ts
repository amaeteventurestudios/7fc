/**
 * Local-development Store implementation backed by the JSON file store
 * in lib/store.ts (.data/db.json). Not used in production — see
 * lib/d1-store.ts for the Cloudflare D1 implementation.
 */
import crypto from "crypto";
import { readDb, mutate, logActivity } from "./store";
import type {
  Store,
  SupporterInput,
  SupporterFilters,
  SupporterAction,
  ProductAction,
  ProductFields,
  DashboardStats,
} from "./data";
import type {
  Supporter,
  SupporterStatus,
  AdminUser,
  GlobalWallSettings,
  AffiliateProduct,
  LegalDisclaimers,
  ActivityEntry,
} from "./types";

const STATUS_FOR_ACTION: Record<SupporterAction, SupporterStatus> = {
  approve: "approved",
  hide: "hidden",
  delete: "deleted",
};

export class JsonStore implements Store {
  async getPublicHome() {
    const db = await readDb();
    return {
      settings: db.global_wall_settings,
      legal: db.legal_disclaimers,
      products: db.affiliate_products
        .filter((p) => p.active)
        .sort((a, b) => a.sort_order - b.sort_order),
      approved: db.supporters.filter((s) => s.status === "approved"),
    };
  }

  async submitSupporter(input: SupporterInput) {
    return mutate((db) => {
      const settings = db.global_wall_settings;
      if (!settings.enable_submissions || settings.emergency_lock) {
        return { error: "Submissions are currently closed." };
      }
      const supporter: Supporter = {
        id: crypto.randomUUID(),
        supporter_number: db.next_supporter_number++,
        ...input,
        message: settings.allow_fan_messages ? input.message : null,
        show_full_name: settings.allow_full_names && input.show_full_name,
        status: settings.require_manual_approval ? "pending" : "approved",
        created_at: new Date().toISOString(),
      };
      db.supporters.push(supporter);
      logActivity(
        db,
        "supporter_submitted",
        `New supporter #${supporter.supporter_number} (${supporter.first_name}, ${supporter.country_name}) submitted`
      );
      return {
        supporter_number: supporter.supporter_number,
        status: supporter.status,
      };
    });
  }

  async listSupporters(filters: SupporterFilters): Promise<Supporter[]> {
    const db = await readDb();
    let list = db.supporters.filter((s) => s.status !== "deleted");
    if (filters.status) list = list.filter((s) => s.status === filters.status);
    if (filters.country)
      list = list.filter(
        (s) => s.country_code === filters.country!.toUpperCase()
      );
    if (filters.era) list = list.filter((s) => s.favorite_era === filters.era);
    if (filters.q) {
      const q = filters.q.toLowerCase();
      list = list.filter(
        (s) =>
          s.first_name.toLowerCase().includes(q) ||
          (s.last_name ?? "").toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => b.supporter_number - a.supporter_number);
  }

  async setSupporterStatus(id: string, action: SupporterAction) {
    return mutate((db) => {
      const s = db.supporters.find((x) => x.id === id);
      if (!s) return false;
      s.status = STATUS_FOR_ACTION[action];
      const type =
        action === "approve"
          ? "supporter_approved"
          : action === "hide"
            ? "supporter_hidden"
            : "supporter_deleted";
      logActivity(db, type, `Supporter #${s.supporter_number} ${s.status}`);
      return true;
    });
  }

  async getSettings(): Promise<GlobalWallSettings> {
    return (await readDb()).global_wall_settings;
  }

  async updateSettings(patch: Partial<GlobalWallSettings>) {
    return mutate((db) => {
      Object.assign(db.global_wall_settings, patch);
      logActivity(db, "settings_changed", "Global Wall settings updated");
      return db.global_wall_settings;
    });
  }

  async listProducts(): Promise<AffiliateProduct[]> {
    const db = await readDb();
    return [...db.affiliate_products].sort(
      (a, b) => a.sort_order - b.sort_order
    );
  }

  async listActiveProducts(): Promise<AffiliateProduct[]> {
    const db = await readDb();
    return db.affiliate_products
      .filter((p) => p.active)
      .sort((a, b) => a.sort_order - b.sort_order);
  }

  async createProduct(fields: ProductFields, active: boolean) {
    return mutate((db) => {
      const p: AffiliateProduct = {
        id: crypto.randomUUID(),
        ...fields,
        active,
        sort_order: db.affiliate_products.length,
        click_count: 0,
      };
      db.affiliate_products.push(p);
      return p;
    });
  }

  async updateProduct(
    id: string,
    action: ProductAction,
    fields?: Partial<ProductFields> & { active?: boolean }
  ) {
    return mutate((db) => {
      const list = db.affiliate_products.sort(
        (a, b) => a.sort_order - b.sort_order
      );
      const idx = list.findIndex((p) => p.id === id);
      if (idx === -1) return false;
      const product = list[idx];
      if (action === "move_up" && idx > 0) {
        [list[idx - 1].sort_order, list[idx].sort_order] = [
          list[idx].sort_order,
          list[idx - 1].sort_order,
        ];
      } else if (action === "move_down" && idx < list.length - 1) {
        [list[idx + 1].sort_order, list[idx].sort_order] = [
          list[idx].sort_order,
          list[idx + 1].sort_order,
        ];
      } else if (action === "toggle_active") {
        product.active = !product.active;
      } else if (action === "update" && fields) {
        if (fields.title) product.title = fields.title;
        if (fields.category) product.category = fields.category;
        if (fields.image_path) product.image_path = fields.image_path;
        if (fields.description) product.description = fields.description;
        if (fields.affiliate_url) product.affiliate_url = fields.affiliate_url;
        if (fields.button_text) product.button_text = fields.button_text;
        if (fields.slug !== undefined) product.slug = fields.slug;
        if (fields.tags !== undefined) product.tags = fields.tags;
        if (fields.gallery_images !== undefined)
          product.gallery_images = fields.gallery_images;
        if (fields.seo_title !== undefined) product.seo_title = fields.seo_title;
        if (fields.seo_description !== undefined)
          product.seo_description = fields.seo_description;
        if (typeof fields.active === "boolean") product.active = fields.active;
      }
      return true;
    });
  }

  async deleteProduct(id: string) {
    return mutate((db) => {
      const before = db.affiliate_products.length;
      db.affiliate_products = db.affiliate_products.filter((p) => p.id !== id);
      return db.affiliate_products.length < before;
    });
  }

  async recordAffiliateClick(productId: string) {
    await mutate((db) => {
      const product = db.affiliate_products.find((p) => p.id === productId);
      if (product) {
        product.click_count += 1;
        logActivity(
          db,
          "affiliate_click",
          `Affiliate product clicked: ${product.title}`
        );
      }
    });
  }

  async getLegal(): Promise<LegalDisclaimers> {
    return (await readDb()).legal_disclaimers;
  }

  async updateLegal(patch: Partial<LegalDisclaimers>) {
    return mutate((db) => {
      Object.assign(db.legal_disclaimers, patch);
      logActivity(db, "legal_edited", "Legal disclaimers updated");
      return db.legal_disclaimers;
    });
  }

  async getAdminById(id: string): Promise<AdminUser | null> {
    const db = await readDb();
    return db.admin_users.find((a) => a.id === id) ?? null;
  }

  async getAdminByEmail(email: string): Promise<AdminUser | null> {
    const db = await readDb();
    return (
      db.admin_users.find(
        (a) => a.email.toLowerCase() === email.toLowerCase()
      ) ?? null
    );
  }

  async isSetupMode(): Promise<boolean> {
    const db = await readDb();
    return db.admin_users.some((a) => a.is_temporary);
  }

  async updateAdminCredentials(
    id: string,
    opts: { email?: string; passwordHash?: string }
  ) {
    await mutate((db) => {
      const admin = db.admin_users.find((a) => a.id === id);
      if (!admin) return;
      if (opts.email) admin.email = opts.email;
      if (opts.passwordHash) {
        admin.password_hash = opts.passwordHash;
        // Changing the password permanently ends temporary setup mode.
        admin.is_temporary = false;
      }
      admin.updated_at = new Date().toISOString();
      logActivity(db, "credentials_changed", "Admin credentials updated");
    });
  }

  async getStats(): Promise<{
    stats: DashboardStats;
    activity: ActivityEntry[];
  }> {
    const db = await readDb();
    const live = db.supporters.filter((s) => s.status !== "deleted");
    const today = new Date().toISOString().slice(0, 10);
    const eraCounts = new Map<string, number>();
    for (const s of live) {
      if (s.favorite_era)
        eraCounts.set(s.favorite_era, (eraCounts.get(s.favorite_era) ?? 0) + 1);
    }
    const topEra =
      [...eraCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
    return {
      stats: {
        total_supporters: live.length,
        pending_approval: live.filter((s) => s.status === "pending").length,
        countries: new Set(live.map((s) => s.country_code)).size,
        email_signups: new Set(live.map((s) => s.email)).size,
        affiliate_clicks: db.affiliate_products.reduce(
          (sum, p) => sum + p.click_count,
          0
        ),
        top_era: topEra,
        today_signups: live.filter((s) => s.created_at.startsWith(today))
          .length,
      },
      activity: db.activity_log.slice(0, 20),
    };
  }
}
