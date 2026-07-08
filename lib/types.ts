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
}

export interface AffiliateProduct {
  id: string;
  title: string;
  category: string;
  image_path: string;
  description: string;
  affiliate_url: string;
  button_text: string;
  active: boolean;
  sort_order: number;
  click_count: number;
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
