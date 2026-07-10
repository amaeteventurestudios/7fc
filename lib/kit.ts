/**
 * Shared helpers for the 7FC Kit (affiliate product) pages.
 */
import type { AffiliateProduct } from "./types";

/** Local fallback shown when a product has no main_image (never broken images). */
export const KIT_FALLBACK_IMAGE = "/images/amazon/7fc-kit-fallback.webp";

/** Max products shown on the homepage Kit section. */
export const HOME_KIT_LIMIT = 15;

/** Max cards in the Related 7FC Kit Picks section. */
export const RELATED_LIMIT = 4;

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Effective slug for a product: stored slug, else slugified title. */
export function productSlug(p: Pick<AffiliateProduct, "slug" | "title">): string {
  return p.slug || slugify(p.title);
}

/** Main image with local fallback — never returns an empty src. */
export function productImage(p: Pick<AffiliateProduct, "image_path">): string {
  const src = (p.image_path || "").trim();
  return src && src !== "/images/" ? src : KIT_FALLBACK_IMAGE;
}

export function parseTags(tags: string): string[] {
  return tags
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
}

/** Parse a stored gallery value (JSON array or newline/comma list) into paths. */
export function parseGallery(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v) => typeof v === "string" && v.trim());
  if (typeof value !== "string" || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed))
      return parsed.filter((v): v is string => typeof v === "string" && !!v.trim());
  } catch {
    // fall through: treat as newline/comma separated list
  }
  return value
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Related picks: active products excluding the current one, preferring
 * matching category or shared tags, backfilled by display order.
 */
export function pickRelated(
  current: AffiliateProduct,
  activeProducts: AffiliateProduct[],
  limit = RELATED_LIMIT
): AffiliateProduct[] {
  const others = activeProducts
    .filter((p) => p.id !== current.id)
    .sort((a, b) => a.sort_order - b.sort_order);
  const tags = new Set(parseTags(current.tags));
  const matches = others.filter(
    (p) =>
      (current.category &&
        p.category.toLowerCase() === current.category.toLowerCase()) ||
      parseTags(p.tags).some((t) => tags.has(t))
  );
  const rest = others.filter((p) => !matches.includes(p));
  return [...matches, ...rest].slice(0, limit);
}
