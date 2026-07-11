/**
 * Storage abstraction for 7FC.
 *
 * - Production (Cloudflare Workers/Pages via OpenNext): Cloudflare D1
 *   through the `DB` binding (see wrangler.toml + lib/d1-store.ts).
 * - Local development (`next dev` / plain Node): JSON file store
 *   (lib/json-store.ts backed by lib/store.ts).
 *
 * Detection is runtime: if a D1 `DB` binding is available in the
 * Cloudflare context, D1 is used; otherwise the JSON fallback.
 */
import type {
  Supporter,
  SupporterStatus,
  AdminUser,
  GlobalWallSettings,
  AffiliateProduct,
  LegalDisclaimers,
  ActivityEntry,
} from "./types";
import type { D1Database } from "./d1-store";

export interface SupporterInput {
  first_name: string;
  last_name: string | null;
  email: string;
  country_name: string;
  country_code: string;
  favorite_era: string | null;
  message: string | null;
  show_full_name: boolean;
}

export interface SupporterFilters {
  status?: string | null;
  country?: string | null;
  era?: string | null;
  q?: string | null;
}

/** All admin-editable product fields (everything except identity/analytics). */
export type ProductFields = Omit<
  AffiliateProduct,
  "id" | "sort_order" | "click_count" | "active" | "updated_at"
>;

export interface DashboardStats {
  total_supporters: number;
  pending_approval: number;
  countries: number;
  email_signups: number;
  affiliate_clicks: number;
  top_era: string;
  today_signups: number;
}

export type SupporterAction = "approve" | "hide" | "delete";
export type ProductAction = "update" | "move_up" | "move_down" | "toggle_active";

export interface Store {
  getPublicHome(): Promise<{
    settings: GlobalWallSettings;
    legal: LegalDisclaimers;
    products: AffiliateProduct[];
    approved: Supporter[];
  }>;
  submitSupporter(
    input: SupporterInput
  ): Promise<
    { supporter_number: number; status: SupporterStatus } | { error: string }
  >;
  listSupporters(filters: SupporterFilters): Promise<Supporter[]>;
  setSupporterStatus(id: string, action: SupporterAction): Promise<boolean>;
  getSettings(): Promise<GlobalWallSettings>;
  updateSettings(
    patch: Partial<GlobalWallSettings>
  ): Promise<GlobalWallSettings>;
  listProducts(): Promise<AffiliateProduct[]>;
  /** Active products sorted by display order (public Kit pages). */
  listActiveProducts(): Promise<AffiliateProduct[]>;
  createProduct(
    fields: ProductFields,
    active: boolean
  ): Promise<AffiliateProduct>;
  updateProduct(
    id: string,
    action: ProductAction,
    fields?: Partial<ProductFields> & { active?: boolean }
  ): Promise<boolean>;
  deleteProduct(id: string): Promise<boolean>;
  recordAffiliateClick(productId: string): Promise<void>;
  getLegal(): Promise<LegalDisclaimers>;
  updateLegal(patch: Partial<LegalDisclaimers>): Promise<LegalDisclaimers>;
  getAdminById(id: string): Promise<AdminUser | null>;
  getAdminByEmail(email: string): Promise<AdminUser | null>;
  isSetupMode(): Promise<boolean>;
  updateAdminCredentials(
    id: string,
    opts: { email?: string; passwordHash?: string }
  ): Promise<void>;
  getStats(): Promise<{ stats: DashboardStats; activity: ActivityEntry[] }>;
}

/** Temporary bootstrap admin credentials (overridable via env, never committed). */
export const ADMIN_TEMP_EMAIL =
  process.env.ADMIN_TEMP_EMAIL ||
  process.env.TEMP_ADMIN_EMAIL ||
  "admin@7fc.net";
export const ADMIN_TEMP_PASSWORD =
  process.env.ADMIN_TEMP_PASSWORD ||
  process.env.TEMP_ADMIN_PASSWORD ||
  "ChangeMe-7FC-Now";

/**
 * ADMIN_SETUP_MODE=false force-disables the temporary-login button even if a
 * temporary admin record still exists. Setup mode also ends permanently once
 * the admin password is changed (is_temporary flag cleared in the database).
 */
export function setupModeEnvEnabled(): boolean {
  return process.env.ADMIN_SETUP_MODE !== "false";
}

/** Returns the D1 binding when running on Cloudflare, else null. */
async function getD1(): Promise<D1Database | null> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const ctx = await getCloudflareContext({ async: true });
    const db = (ctx.env as Record<string, unknown>).DB;
    return (db as D1Database) ?? null;
  } catch {
    return null;
  }
}

export async function getStore(): Promise<Store> {
  const d1 = await getD1();
  if (d1) {
    const { D1Store } = await import("./d1-store");
    return new D1Store(d1);
  }
  const { JsonStore } = await import("./json-store");
  return new JsonStore();
}
