export type SupporterStatus = "pending" | "approved" | "hidden" | "deleted";

/**
 * Lifecycle mapping (kept compatible with the original status enum):
 *   pending  + !email_verified_at -> pending email verification
 *   pending  + email_verified_at  -> pending moderation
 *   approved                      -> approved/published
 *   hidden                        -> removed/unpublished
 *   deleted                       -> deleted (soft; anonymized)
 */
export interface Supporter {
  id: string;
  supporter_number: number;
  first_name: string;
  last_name: string | null;
  email: string;
  country_name: string;
  country_code: string;
  favorite_era: string | null;
  message: string | null;
  show_full_name: boolean;
  status: SupporterStatus;
  created_at: string;
  // Trust-layer lifecycle + consent evidence (nullable for legacy rows).
  email_verified_at: string | null;
  terms_version: string | null;
  terms_accepted_at: string | null;
  privacy_version: string | null;
  privacy_ack_at: string | null;
  display_consent: boolean;
  display_consent_at: string | null;
  display_consent_withdrawn_at: string | null;
  marketing_consent: boolean;
  marketing_consent_at: string | null;
  marketing_withdrawn_at: string | null;
  age_attested_at: string | null;
  published_at: string | null;
  deleted_at: string | null;
  moderation_note: string | null;
  /** How the consent evidence was captured: affirmative signup form,
   *  legacy_migration (pre-trust-layer record; no manufactured consent
   *  events), or reconfirmed via self-service. */
  consent_source: string | null;
}

/** Defaults for trust-layer fields when reading legacy rows. */
export const SUPPORTER_TRUST_DEFAULTS = {
  email_verified_at: null,
  terms_version: null,
  terms_accepted_at: null,
  privacy_version: null,
  privacy_ack_at: null,
  display_consent: false,
  display_consent_at: null,
  display_consent_withdrawn_at: null,
  marketing_consent: false,
  marketing_consent_at: null,
  marketing_withdrawn_at: null,
  age_attested_at: null,
  published_at: null,
  deleted_at: null,
  moderation_note: null,
  consent_source: null,
} satisfies Partial<Supporter>;

export interface SecurityToken {
  id: string;
  purpose: "verify" | "manage" | "privacy";
  subject_id: string;
  token_hash: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
}

export interface OutboxRow {
  id: string;
  event_key: string;
  notification_type: string;
  related_id: string | null;
  recipient: string;
  from_addr: string;
  reply_to: string | null;
  subject: string;
  body_html: string | null;
  body_text: string | null;
  status: "pending" | "processing" | "sent" | "failed" | "suppressed" | "cancelled";
  attempt_count: number;
  next_attempt_at: string | null;
  last_attempt_at: string | null;
  sent_at: string | null;
  provider: string | null;
  provider_message_id: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

export type PrivacyRequestType =
  | "access"
  | "correction"
  | "export"
  | "deletion"
  | "wall_removal"
  | "consent_withdrawal"
  | "marketing_opt_out"
  | "other";

export interface PrivacyRequest {
  id: string;
  email: string;
  request_type: PrivacyRequestType;
  details: string | null;
  status: "pending_verification" | "verified" | "completed" | "rejected";
  verified_at: string | null;
  completed_at: string | null;
  note: string | null;
  created_at: string;
}

export interface EntryReport {
  id: string;
  supporter_id: string;
  reason: string;
  details: string | null;
  reporter_hash: string | null;
  status: "open" | "resolved" | "dismissed";
  created_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  password_hash: string;
  is_temporary: boolean;
  created_at: string;
  updated_at: string;
}

export interface GlobalWallSettings {
  enable_submissions: boolean;
  require_manual_approval: boolean;
  show_supporter_count: boolean;
  show_country_count: boolean;
  show_latest_supporters: boolean;
  show_country_flags: boolean;
  allow_fan_messages: boolean;
  allow_full_names: boolean;
  show_favorite_era: boolean;
  emergency_lock: boolean;
  founding_slots_enabled: boolean;
  founding_slot_target: number;
  homepage_preview_count: number;
  wall_page_size: number;
}

/** Numeric (non-boolean) settings keys, stored as integers in D1. */
export const NUMERIC_SETTINGS = [
  "founding_slot_target",
  "homepage_preview_count",
  "wall_page_size",
] as const satisfies ReadonlyArray<keyof GlobalWallSettings>;

/** Editorial page-content sections for a Kit product page. */
export interface ProductContent {
  why_7fc?: string;
  overview?: string;
  interesting?: string;
  best_for?: string;
  how_to_use?: string;
  gift_occasions?: string;
  what_to_check?: string;
  verdict?: string;
  verified_facts?: string[];
  unverified_fields?: string[];
}

export interface ProductFaq {
  question: string;
  answer: string;
}

export interface AffiliateProduct {
  id: string;
  title: string;
  short_title: string;
  brand: string;
  category: string;
  /** Main product image. The only required image for a product page. */
  image_path: string;
  image_alt: string;
  description: string;
  affiliate_url: string;
  button_text: string;
  /** URL slug for /kit/[slug]. Falls back to slugified title when empty. */
  slug: string;
  /** Pipe- or comma-separated tags used for related-product matching. */
  tags: string;
  /** Optional extra gallery images. Empty array hides the thumbnail gallery. */
  gallery_images: string[];
  seo_title: string;
  seo_description: string;
  og_title: string;
  og_description: string;
  og_image: string;
  primary_keyword: string;
  secondary_keywords: string;
  search_intent: string;
  /** Product-page H1 override; falls back to title. */
  h1: string;
  eyebrow: string;
  image_disclaimer: string;
  affiliate_disclosure: string;
  legal_disclaimer: string;
  content: ProductContent;
  faqs: ProductFaq[];
  /** Pipe-separated fallback slugs for the related-picks section. */
  related_fallback_slugs: string;
  featured: boolean;
  indexable: boolean;
  active: boolean;
  sort_order: number;
  click_count: number;
  updated_at: string;
}

export interface LegalDisclaimers {
  top_disclaimer: string;
  footer_disclaimer: string;
  affiliate_disclosure: string;
  privacy_note: string;
  product_note: string;
}

export interface ActivityEntry {
  id: string;
  type:
    | "supporter_submitted"
    | "supporter_approved"
    | "supporter_hidden"
    | "supporter_deleted"
    | "affiliate_click"
    | "legal_edited"
    | "settings_changed"
    | "credentials_changed";
  detail: string;
  created_at: string;
}

export interface Database {
  admin_users: AdminUser[];
  supporters: Supporter[];
  global_wall_settings: GlobalWallSettings;
  affiliate_products: AffiliateProduct[];
  legal_disclaimers: LegalDisclaimers;
  activity_log: ActivityEntry[];
  next_supporter_number: number;
  // Trust layer (optional so legacy .data/db.json files still load).
  security_tokens?: SecurityToken[];
  email_outbox?: OutboxRow[];
  privacy_requests?: PrivacyRequest[];
  entry_reports?: EntryReport[];
  email_suppressions?: { email: string; reason: string; created_at: string }[];
}

export const ERAS = [
  "Sporting Era",
  "Manchester Era",
  "Madrid Era",
  "Juventus Era",
  "Al Nassr Era",
  "Portugal Era",
  "All Eras",
] as const;
export type Era = (typeof ERAS)[number];
