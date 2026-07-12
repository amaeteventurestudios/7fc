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
  SecurityToken,
  OutboxRow,
  PrivacyRequest,
  EntryReport,
} from "./types";
import type { D1Database } from "./d1-store";

export type ConsentSource = "signup_form" | "legacy_migration" | "reconfirmed";

export interface SupporterInput {
  first_name: string;
  last_name: string | null;
  email: string;
  country_name: string;
  country_code: string;
  favorite_era: string | null;
  message: string | null;
  show_full_name: boolean;
  /** Consent evidence captured at submit time (trust layer). */
  consents?: {
    terms_version: string;
    privacy_version: string;
    display_consent: boolean;
    marketing_consent: boolean;
    age_attested: boolean;
    /** When true the record starts unverified (pending email verification). */
    require_email_verification: boolean;
  };
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
    | { id: string; supporter_number: number; status: SupporterStatus }
    | { error: string }
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

  // ---------- trust layer ----------
  /** Full supporter row by id (includes private fields; admin/self-service only). */
  getSupporterById(id: string): Promise<Supporter | null>;
  /** Active (non-deleted) supporter with this normalized email, if any. */
  findSupporterByEmail(email: string): Promise<Supporter | null>;
  /** Mark email verified; moves pending->pending_moderation (or approved when
   *  moderation is off). Returns the updated supporter or null. */
  markSupporterVerified(id: string): Promise<Supporter | null>;
  /** Patch self-service/lifecycle fields (correction, consent changes, unpublish). */
  updateSupporterFields(
    id: string,
    patch: Partial<
      Pick<
        Supporter,
        | "first_name"
        | "last_name"
        | "favorite_era"
        | "message"
        | "show_full_name"
        | "display_consent"
        | "display_consent_at"
        | "display_consent_withdrawn_at"
        | "marketing_consent"
        | "marketing_consent_at"
        | "marketing_withdrawn_at"
        | "status"
        | "published_at"
        | "moderation_note"
        | "consent_source"
        | "terms_version"
        | "terms_accepted_at"
        | "privacy_version"
        | "privacy_ack_at"
        | "email_verified_at"
      >
    >
  ): Promise<boolean>;
  /** GDPR-style deletion: anonymize personal fields, keep the number reserved. */
  anonymizeSupporter(id: string): Promise<boolean>;

  createSecurityToken(t: {
    purpose: SecurityToken["purpose"];
    subject_id: string;
    token_hash: string;
    expires_at: string;
  }): Promise<void>;
  /** Atomically consume an unused, unexpired token (one-time use). */
  consumeSecurityToken(
    purpose: SecurityToken["purpose"],
    token_hash: string
  ): Promise<SecurityToken | null>;
  /** Peek without consuming (for GET rendering of manage pages). */
  peekSecurityToken(
    purpose: SecurityToken["purpose"],
    token_hash: string
  ): Promise<SecurityToken | null>;
  invalidateSecurityTokens(
    purpose: SecurityToken["purpose"],
    subject_id: string
  ): Promise<void>;

  enqueueOutbox(row: {
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
  }): Promise<void>;
  /** Claim due pending messages (marks them processing). */
  claimDueOutbox(limit: number): Promise<OutboxRow[]>;
  finishOutboxAttempt(
    id: string,
    result: {
      status: OutboxRow["status"];
      provider?: string;
      providerMessageId?: string;
      error?: string;
      nextAttemptAt?: string | null;
      /** false = park without consuming a retry attempt (provider unconfigured). */
      countAttempt?: boolean;
    }
  ): Promise<void>;
  outboxSummary(): Promise<{ pending: number; sent: number; failed: number }>;
  /** Single outbox row by idempotency key (admin diagnostics only). */
  getOutboxByEventKey(eventKey: string): Promise<OutboxRow | null>;

  /** Durable rate limiting: atomically increment the counter for key,
   *  starting a new window when the previous one expired. */
  incrementRateLimit(
    key: string,
    windowMs: number
  ): Promise<{ count: number; reset_at: string }>;
  /** Active (unexpired) rate-limit rows, for the readiness summary. */
  countActiveRateLimits(): Promise<number>;
  /** True when a permanent (non-temporary) admin credential exists. */
  hasPermanentAdmin(): Promise<boolean>;

  /** Small operational key/value metadata (last cron run, last delivery). */
  getOpsMeta(key: string): Promise<string | null>;
  setOpsMeta(key: string, value: string): Promise<void>;

  /** Aggregate counts for the admin readiness view (no personal data). */
  readinessCounts(): Promise<{
    outbox_pending: number;
    outbox_failed: number;
    outbox_sent: number;
    suppressed: number;
    pending_moderation: number;
    open_reports: number;
    pending_privacy_requests: number;
    legacy_consent_supporters: number;
  }>;

  isEmailSuppressed(email: string): Promise<boolean>;
  addEmailSuppression(email: string, reason: string): Promise<void>;

  createPrivacyRequest(r: {
    email: string;
    request_type: PrivacyRequest["request_type"];
    details: string | null;
  }): Promise<PrivacyRequest>;
  getPrivacyRequest(id: string): Promise<PrivacyRequest | null>;
  updatePrivacyRequest(
    id: string,
    patch: Partial<Pick<PrivacyRequest, "status" | "verified_at" | "completed_at" | "note">>
  ): Promise<boolean>;
  listPrivacyRequests(): Promise<PrivacyRequest[]>;

  createEntryReport(r: {
    supporter_id: string;
    reason: string;
    details: string | null;
    reporter_hash: string | null;
  }): Promise<{ created: boolean }>;
  listEntryReports(status?: EntryReport["status"]): Promise<EntryReport[]>;
  updateEntryReport(id: string, status: EntryReport["status"]): Promise<boolean>;

  /** Enforce the retention schedule (lib/policy.ts). Never touches active supporters. */
  retentionCleanup(): Promise<{
    removedSupporters: number;
    removedTokens: number;
    redactedEmails: number;
  }>;
}

/**
 * Temporary bootstrap admin credentials.
 * SECURITY: there is NO default in production — the previous hard-coded
 * fallback ("ChangeMe…") was treated as compromised and removed. In
 * production these are only active when explicitly provided via env/secret;
 * otherwise bootstrap is disabled and the owner provisions credentials with
 * scripts/rotate-admin-password.mjs. Local development keeps a convenience
 * default so `next dev` works out of the box.
 */
const DEV_ONLY = process.env.NODE_ENV !== "production";
export const ADMIN_TEMP_EMAIL =
  process.env.ADMIN_TEMP_EMAIL ||
  process.env.TEMP_ADMIN_EMAIL ||
  (DEV_ONLY ? "admin@7fc.net" : "");
export const ADMIN_TEMP_PASSWORD =
  process.env.ADMIN_TEMP_PASSWORD ||
  process.env.TEMP_ADMIN_PASSWORD ||
  (DEV_ONLY ? "ChangeMe-7FC-Now" : "");

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
