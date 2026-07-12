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
  SecurityToken,
  OutboxRow,
  PrivacyRequest,
  EntryReport,
} from "./types";
import { SUPPORTER_TRUST_DEFAULTS } from "./types";
import { RETENTION } from "./policy";

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
      approved: db.supporters.filter(
        (s) => s.status === "approved" && s.display_consent
      ),
    };
  }

  async submitSupporter(input: SupporterInput) {
    return mutate((db) => {
      const settings = db.global_wall_settings;
      if (!settings.enable_submissions || settings.emergency_lock) {
        return { error: "Submissions are currently closed." };
      }
      const { consents: c, ...fields } = input;
      const requireVerification = c?.require_email_verification ?? false;
      const now = new Date().toISOString();
      const status: SupporterStatus =
        requireVerification || settings.require_manual_approval
          ? "pending"
          : "approved";
      const supporter: Supporter = {
        id: crypto.randomUUID(),
        supporter_number: db.next_supporter_number++,
        ...SUPPORTER_TRUST_DEFAULTS,
        ...fields,
        message: settings.allow_fan_messages ? input.message : null,
        show_full_name: settings.allow_full_names && input.show_full_name,
        status,
        created_at: now,
        email_verified_at: requireVerification ? null : now,
        terms_version: c?.terms_version ?? null,
        terms_accepted_at: c ? now : null,
        privacy_version: c?.privacy_version ?? null,
        privacy_ack_at: c ? now : null,
        display_consent: c ? c.display_consent : true,
        display_consent_at: c?.display_consent ? now : null,
        marketing_consent: c?.marketing_consent ?? false,
        marketing_consent_at: c?.marketing_consent ? now : null,
        age_attested_at: c?.age_attested ? now : null,
        published_at: status === "approved" ? now : null,
        consent_source: c ? "signup_form" : "legacy_migration",
      };
      db.supporters.push(supporter);
      logActivity(
        db,
        "supporter_submitted",
        `New supporter #${supporter.supporter_number} (${supporter.first_name}, ${supporter.country_name}) submitted`
      );
      return {
        id: supporter.id,
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
      if (action === "approve" && !s.published_at)
        s.published_at = new Date().toISOString();
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
        sort_order:
          db.affiliate_products.reduce((m, x) => Math.max(m, x.sort_order), -1) +
          1,
        click_count: 0,
        updated_at: new Date().toISOString(),
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
        for (const [key, value] of Object.entries(fields)) {
          if (value === undefined) continue;
          (product as unknown as Record<string, unknown>)[key] = value;
        }
        product.updated_at = new Date().toISOString();
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
        flagged_review: live.filter(
          (s) => s.status === "pending" && !!s.email_verified_at
        ).length,
        auto_approved: live.filter((s) => s.status === "approved").length,
        unpublished: live.filter((s) => s.status === "hidden").length,
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

  // ---------- trust layer ----------

  async getSupporterById(id: string): Promise<Supporter | null> {
    const db = await readDb();
    return db.supporters.find((s) => s.id === id) ?? null;
  }

  async findSupporterByEmail(email: string): Promise<Supporter | null> {
    const db = await readDb();
    return (
      db.supporters
        .filter(
          (s) =>
            s.email.toLowerCase() === email.toLowerCase() &&
            s.status !== "deleted"
        )
        .sort((a, b) => b.created_at.localeCompare(a.created_at))[0] ?? null
    );
  }

  async markSupporterVerified(id: string): Promise<Supporter | null> {
    return mutate((db) => {
      const s = db.supporters.find((x) => x.id === id);
      if (!s || s.email_verified_at || s.status !== "pending") return null;
      // Verified but still pending + nonpublic; approval is decided by the
      // verify route (clean → autoApproveVerified; flagged → stays pending).
      s.email_verified_at = new Date().toISOString();
      return { ...s };
    });
  }

  async autoApproveVerified(id: string): Promise<Supporter | null> {
    return mutate((db) => {
      const s = db.supporters.find((x) => x.id === id);
      // Guarded exactly-once transition.
      if (
        !s ||
        s.status !== "pending" ||
        !s.email_verified_at ||
        !s.display_consent
      )
        return null;
      const now = new Date().toISOString();
      s.status = "approved";
      s.published_at = s.published_at ?? now;
      logActivity(
        db,
        "supporter_approved",
        `Supporter #${s.supporter_number} auto-approved after verification`
      );
      return { ...s };
    });
  }

  async hasDuplicateMessage(
    normalizedMessage: string,
    excludeId: string
  ): Promise<boolean> {
    if (!normalizedMessage) return false;
    const db = await readDb();
    return db.supporters.some(
      (s) =>
        s.id !== excludeId &&
        s.status !== "deleted" &&
        !!s.message &&
        s.message.toLowerCase().trim() === normalizedMessage
    );
  }

  async updateSupporterFields(
    id: string,
    patch: Record<string, unknown>
  ): Promise<boolean> {
    return mutate((db) => {
      const s = db.supporters.find((x) => x.id === id && x.status !== "deleted");
      if (!s) return false;
      Object.assign(s as unknown as Record<string, unknown>, patch);
      return true;
    });
  }

  async anonymizeSupporter(id: string): Promise<boolean> {
    return mutate((db) => {
      const s = db.supporters.find((x) => x.id === id);
      if (!s) return false;
      s.first_name = "Deleted";
      s.last_name = null;
      s.email = `deleted-${s.id}@invalid.sevenfc.net`;
      s.favorite_era = null;
      s.message = null;
      s.show_full_name = false;
      s.display_consent = false;
      s.marketing_consent = false;
      s.status = "deleted";
      s.deleted_at = new Date().toISOString();
      s.moderation_note = null;
      db.security_tokens = (db.security_tokens ?? []).filter(
        (t) => t.subject_id !== id
      );
      logActivity(
        db,
        "supporter_deleted",
        `Supporter record ${id} anonymized (privacy request)`
      );
      return true;
    });
  }

  async createSecurityToken(t: {
    purpose: SecurityToken["purpose"];
    subject_id: string;
    token_hash: string;
    expires_at: string;
  }): Promise<void> {
    await mutate((db) => {
      (db.security_tokens ??= []).push({
        id: crypto.randomUUID(),
        ...t,
        used_at: null,
        created_at: new Date().toISOString(),
      });
    });
  }

  async consumeSecurityToken(
    purpose: SecurityToken["purpose"],
    token_hash: string
  ): Promise<SecurityToken | null> {
    return mutate((db) => {
      const now = new Date().toISOString();
      const t = (db.security_tokens ?? []).find(
        (x) =>
          x.purpose === purpose &&
          x.token_hash === token_hash &&
          !x.used_at &&
          x.expires_at > now
      );
      if (!t) return null;
      t.used_at = now;
      return { ...t };
    });
  }

  async peekSecurityToken(
    purpose: SecurityToken["purpose"],
    token_hash: string
  ): Promise<SecurityToken | null> {
    const db = await readDb();
    const now = new Date().toISOString();
    return (
      (db.security_tokens ?? []).find(
        (x) =>
          x.purpose === purpose &&
          x.token_hash === token_hash &&
          !x.used_at &&
          x.expires_at > now
      ) ?? null
    );
  }

  async invalidateSecurityTokens(
    purpose: SecurityToken["purpose"],
    subject_id: string
  ): Promise<void> {
    await mutate((db) => {
      const now = new Date().toISOString();
      for (const t of db.security_tokens ?? []) {
        if (t.purpose === purpose && t.subject_id === subject_id && !t.used_at)
          t.used_at = now;
      }
    });
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
    await mutate((db) => {
      db.email_outbox ??= [];
      if (db.email_outbox.some((m) => m.event_key === row.event_key)) return;
      const now = new Date().toISOString();
      db.email_outbox.push({
        id: crypto.randomUUID(),
        ...row,
        attempt_count: 0,
        next_attempt_at: row.status === "pending" ? now : null,
        last_attempt_at: null,
        sent_at: null,
        provider: null,
        provider_message_id: null,
        last_error: null,
        created_at: now,
        updated_at: now,
      });
    });
  }

  async claimDueOutbox(limit: number): Promise<OutboxRow[]> {
    return mutate((db) => {
      const now = new Date().toISOString();
      // Recover rows stuck in `processing` after 10 minutes (crashed run).
      const stale = new Date(Date.now() - 10 * 60_000).toISOString();
      for (const m of db.email_outbox ?? []) {
        if (m.status === "processing" && m.updated_at < stale) {
          m.status = "pending";
          m.updated_at = now;
        }
      }
      // mutate() serializes writers, so pending->processing here is an
      // atomic claim: a second processor never sees these rows as pending.
      const due = (db.email_outbox ?? [])
        .filter(
          (m) =>
            m.status === "pending" &&
            (!m.next_attempt_at || m.next_attempt_at <= now)
        )
        .slice(0, limit);
      for (const m of due) {
        m.status = "processing";
        m.updated_at = now;
      }
      return due.map((m) => ({ ...m }));
    });
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
    await mutate((db) => {
      const m = (db.email_outbox ?? []).find((x) => x.id === id);
      if (!m) return;
      const now = new Date().toISOString();
      m.status = result.status;
      if (result.countAttempt !== false) m.attempt_count += 1;
      m.last_attempt_at = now;
      if (result.status === "sent") {
        m.sent_at = now;
        m.body_html = null;
        m.body_text = null;
      }
      if (result.provider) m.provider = result.provider;
      if (result.providerMessageId)
        m.provider_message_id = result.providerMessageId;
      m.last_error = result.error ?? null;
      m.next_attempt_at = result.nextAttemptAt ?? null;
      m.updated_at = now;
    });
  }

  async outboxSummary() {
    const db = await readDb();
    const list = db.email_outbox ?? [];
    return {
      pending: list.filter((m) => m.status === "pending" || m.status === "processing").length,
      sent: list.filter((m) => m.status === "sent").length,
      failed: list.filter((m) => m.status === "failed").length,
    };
  }

  async getOutboxByEventKey(eventKey: string): Promise<OutboxRow | null> {
    const db = await readDb();
    return (db.email_outbox ?? []).find((m) => m.event_key === eventKey) ?? null;
  }

  async isEmailSuppressed(email: string): Promise<boolean> {
    const db = await readDb();
    return (db.email_suppressions ?? []).some(
      (s) => s.email === email.toLowerCase()
    );
  }

  async addEmailSuppression(email: string, reason: string): Promise<void> {
    await mutate((db) => {
      db.email_suppressions ??= [];
      if (!db.email_suppressions.some((s) => s.email === email.toLowerCase()))
        db.email_suppressions.push({
          email: email.toLowerCase(),
          reason,
          created_at: new Date().toISOString(),
        });
    });
  }

  async createPrivacyRequest(r: {
    email: string;
    request_type: PrivacyRequest["request_type"];
    details: string | null;
  }): Promise<PrivacyRequest> {
    return mutate((db) => {
      const req: PrivacyRequest = {
        id: crypto.randomUUID(),
        ...r,
        status: "pending_verification",
        verified_at: null,
        completed_at: null,
        note: null,
        created_at: new Date().toISOString(),
      };
      (db.privacy_requests ??= []).push(req);
      return { ...req };
    });
  }

  async getPrivacyRequest(id: string): Promise<PrivacyRequest | null> {
    const db = await readDb();
    return (db.privacy_requests ?? []).find((r) => r.id === id) ?? null;
  }

  async updatePrivacyRequest(
    id: string,
    patch: Partial<
      Pick<PrivacyRequest, "status" | "verified_at" | "completed_at" | "note">
    >
  ): Promise<boolean> {
    return mutate((db) => {
      const r = (db.privacy_requests ?? []).find((x) => x.id === id);
      if (!r) return false;
      Object.assign(r, patch);
      return true;
    });
  }

  async listPrivacyRequests(): Promise<PrivacyRequest[]> {
    const db = await readDb();
    return [...(db.privacy_requests ?? [])].sort((a, b) =>
      b.created_at.localeCompare(a.created_at)
    );
  }

  async createEntryReport(r: {
    supporter_id: string;
    reason: string;
    details: string | null;
    reporter_hash: string | null;
  }): Promise<{ created: boolean }> {
    return mutate((db) => {
      db.entry_reports ??= [];
      if (
        r.reporter_hash &&
        db.entry_reports.some(
          (x) =>
            x.supporter_id === r.supporter_id &&
            x.reporter_hash === r.reporter_hash &&
            x.status === "open"
        )
      )
        return { created: false };
      db.entry_reports.push({
        id: crypto.randomUUID(),
        ...r,
        status: "open",
        created_at: new Date().toISOString(),
      });
      return { created: true };
    });
  }

  async listEntryReports(
    status?: EntryReport["status"]
  ): Promise<EntryReport[]> {
    const db = await readDb();
    const list = db.entry_reports ?? [];
    return (status ? list.filter((r) => r.status === status) : list).sort(
      (a, b) => b.created_at.localeCompare(a.created_at)
    );
  }

  async updateEntryReport(
    id: string,
    status: EntryReport["status"]
  ): Promise<boolean> {
    return mutate((db) => {
      const r = (db.entry_reports ?? []).find((x) => x.id === id);
      if (!r) return false;
      r.status = status;
      return true;
    });
  }

  async incrementRateLimit(key: string, windowMs: number) {
    return mutate((db) => {
      const d = db as unknown as {
        rate_limits?: Record<string, { count: number; reset_at: string }>;
      };
      d.rate_limits ??= {};
      const now = Date.now();
      const row = d.rate_limits[key];
      if (!row || new Date(row.reset_at).getTime() <= now) {
        d.rate_limits[key] = {
          count: 1,
          reset_at: new Date(now + windowMs).toISOString(),
        };
      } else {
        row.count += 1;
      }
      return { ...d.rate_limits[key] };
    });
  }

  async hasPermanentAdmin(): Promise<boolean> {
    const db = await readDb();
    return db.admin_users.some((a) => !a.is_temporary);
  }

  async countActiveRateLimits(): Promise<number> {
    const db = (await readDb()) as unknown as {
      rate_limits?: Record<string, { count: number; reset_at: string }>;
    };
    const now = new Date().toISOString();
    return Object.values(db.rate_limits ?? {}).filter((r) => r.reset_at > now)
      .length;
  }

  async getOpsMeta(key: string): Promise<string | null> {
    const db = await readDb();
    return (
      (db as unknown as { ops_meta?: Record<string, string> }).ops_meta?.[key] ??
      null
    );
  }

  async setOpsMeta(key: string, value: string): Promise<void> {
    await mutate((db) => {
      const d = db as unknown as { ops_meta?: Record<string, string> };
      (d.ops_meta ??= {})[key] = value;
    });
  }

  async readinessCounts() {
    const db = await readDb();
    const outbox = await this.outboxSummary();
    return {
      outbox_pending: outbox.pending,
      outbox_failed: outbox.failed,
      outbox_sent: outbox.sent,
      suppressed: (db.email_suppressions ?? []).length,
      pending_moderation: db.supporters.filter(
        (s) => s.status === "pending" && !!s.email_verified_at
      ).length,
      open_reports: (db.entry_reports ?? []).filter((r) => r.status === "open")
        .length,
      pending_privacy_requests: (db.privacy_requests ?? []).filter(
        (r) => r.status === "pending_verification" || r.status === "verified"
      ).length,
      legacy_consent_supporters: db.supporters.filter(
        (s) => s.consent_source === "legacy_migration" && s.status !== "deleted"
      ).length,
    };
  }

  async retentionCleanup() {
    return mutate((db) => {
      const now = Date.now();
      const iso = (ms: number) => new Date(now - ms).toISOString();
      const beforeSupporters = db.supporters.length;
      db.supporters = db.supporters.filter(
        (s) =>
          !(
            s.status === "pending" &&
            !s.email_verified_at &&
            s.created_at < iso(RETENTION.unverifiedSignupMs)
          )
      );
      // Flagged verified submissions left unresolved past retention →
      // anonymize (number stays retired, personal data cleared).
      for (const s of db.supporters) {
        if (
          s.status === "pending" &&
          s.email_verified_at &&
          s.created_at < iso(RETENTION.flaggedReviewMs)
        ) {
          s.first_name = "Deleted";
          s.last_name = null;
          s.email = `deleted-${s.id}@invalid.sevenfc.net`;
          s.favorite_era = null;
          s.message = null;
          s.show_full_name = false;
          s.display_consent = false;
          s.marketing_consent = false;
          s.status = "deleted";
          s.deleted_at = new Date().toISOString();
          s.moderation_note = null;
        }
      }
      const beforeTokens = (db.security_tokens ?? []).length;
      const nowIso = new Date(now).toISOString();
      db.security_tokens = (db.security_tokens ?? []).filter(
        (t) =>
          !(
            (t.used_at || t.expires_at < nowIso) &&
            t.created_at < iso(RETENTION.tokenRowMs)
          )
      );
      let redacted = 0;
      for (const m of db.email_outbox ?? []) {
        if (
          m.status !== "pending" &&
          m.status !== "processing" &&
          (m.body_html || m.body_text) &&
          m.created_at < iso(RETENTION.outboxBodyMs)
        ) {
          m.body_html = null;
          m.body_text = null;
          redacted++;
        }
      }
      db.email_outbox = (db.email_outbox ?? []).filter(
        (m) =>
          m.status === "pending" ||
          m.status === "processing" ||
          m.created_at >= iso(RETENTION.outboxRowMs)
      );
      db.entry_reports = (db.entry_reports ?? []).filter(
        (r) => r.status === "open" || r.created_at >= iso(RETENTION.reportRowMs)
      );
      db.privacy_requests = (db.privacy_requests ?? []).filter(
        (r) =>
          (r.status !== "completed" && r.status !== "rejected") ||
          r.created_at >= iso(RETENTION.privacyRequestMs)
      );
      const d = db as unknown as {
        rate_limits?: Record<string, { count: number; reset_at: string }>;
      };
      const nowIso2 = new Date(now).toISOString();
      for (const [k, v] of Object.entries(d.rate_limits ?? {})) {
        if (v.reset_at <= nowIso2) delete d.rate_limits![k];
      }
      return {
        removedSupporters: beforeSupporters - db.supporters.length,
        removedTokens: beforeTokens - (db.security_tokens ?? []).length,
        redactedEmails: redacted,
      };
    });
  }
}
