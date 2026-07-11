export type SupporterStatus = "pending" | "approved" | "hidden" | "deleted";

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
