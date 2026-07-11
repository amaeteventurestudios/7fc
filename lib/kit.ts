/**
 * Shared helpers for the 7FC Kit (affiliate product) pages.
 */
import type { AffiliateProduct, ProductContent, ProductFaq } from "./types";

/** Default values for every product field added after the original schema.
 *  Spread under an existing record to normalize rows from older data. */
export const PRODUCT_FIELD_DEFAULTS = {
  short_title: "",
  brand: "",
  image_alt: "",
  slug: "",
  tags: "",
  gallery_images: [] as string[],
  seo_title: "",
  seo_description: "",
  og_title: "",
  og_description: "",
  og_image: "",
  primary_keyword: "",
  secondary_keywords: "",
  search_intent: "",
  h1: "",
  eyebrow: "",
  image_disclaimer: "",
  affiliate_disclosure: "",
  legal_disclaimer: "",
  content: {} as ProductContent,
  faqs: [] as ProductFaq[],
  related_fallback_slugs: "",
  featured: false,
  indexable: true,
  updated_at: "",
};

/** A complete empty ProductFields object (for creating new products). */
export const EMPTY_PRODUCT_FIELDS = {
  ...PRODUCT_FIELD_DEFAULTS,
  title: "",
  category: "",
  image_path: "",
  description: "",
  affiliate_url: "",
  button_text: "View on Amazon",
};

export function parseContent(value: unknown): ProductContent {
  if (value && typeof value === "object") return value as ProductContent;
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object") return parsed as ProductContent;
    } catch {
      // ignore malformed stored content
    }
  }
  return {};
}

export function parseFaqs(value: unknown): ProductFaq[] {
  let list: unknown = value;
  if (typeof value === "string") {
    if (!value.trim()) return [];
    try {
      list = JSON.parse(value);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(list)) return [];
  return list
    .filter(
      (f): f is ProductFaq =>
        !!f &&
        typeof f === "object" &&
        typeof (f as ProductFaq).question === "string" &&
        typeof (f as ProductFaq).answer === "string"
    )
    .map((f) => ({
      question: f.question.trim(),
      answer: f.answer.trim(),
    }))
    .filter((f) => f.question && f.answer);
}

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
    .split(/[|,]/)
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

/** Complementary-category mapping across the approved Kit categories. */
const COMPLEMENTARY: Record<string, string[]> = {
  collectibles: ["fan display", "gifts and fun"],
  fragrance: ["gifts and fun", "apparel"],
  "fan gear": ["gifts and fun", "fan display"],
  "fan display": ["collectibles", "fan gear"],
  apparel: ["training", "performance"],
  training: ["performance", "apparel"],
  performance: ["training", "apparel"],
  "gifts and fun": ["collectibles", "fan gear"],
};

/** FNV-1a hash → deterministic 32-bit seed. */
function hashSeed(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Small deterministic PRNG (mulberry32). */
function seededRandom(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Related 7FC Kit picks: weighted dynamic selection.
 *
 * Scoring: same category +4, each shared tag +2, complementary category +1.
 * Deterministic daily rotation via a seed of `slug + UTC date` (stable within
 * a UTC day, rotates the next day, no hydration mismatch). Greedy diversity
 * pass avoids an all-one-category result when alternatives exist. Fallback
 * slugs, then display order, backfill when the pool is short.
 */
export function pickRelated(
  current: AffiliateProduct,
  activeProducts: AffiliateProduct[],
  limit = RELATED_LIMIT,
  date: string = new Date().toISOString().slice(0, 10)
): AffiliateProduct[] {
  const eligible = activeProducts.filter(
    (p) => p.id !== current.id && p.active && productSlug(p)
  );
  const rand = seededRandom(hashSeed(`${productSlug(current)}:${date}`));
  const tags = new Set(parseTags(current.tags));
  const cat = current.category.trim().toLowerCase();
  const complements = new Set(COMPLEMENTARY[cat] ?? []);

  const scored = eligible
    .map((p) => {
      const pCat = p.category.trim().toLowerCase();
      let score = 0;
      if (cat && pCat === cat) score += 4;
      score += 2 * parseTags(p.tags).filter((t) => tags.has(t)).length;
      if (complements.has(pCat)) score += 1;
      return { p, score, jitter: rand() };
    })
    .sort((a, b) => b.score - a.score || a.jitter - b.jitter);

  // Greedy diversity: cap two per category while better-mixed options remain.
  const picked: AffiliateProduct[] = [];
  const catCount = new Map<string, number>();
  const skipped: AffiliateProduct[] = [];
  for (const { p } of scored) {
    if (picked.length >= limit) break;
    const pCat = p.category.trim().toLowerCase();
    if ((catCount.get(pCat) ?? 0) >= 2 && scored.length > limit) {
      skipped.push(p);
      continue;
    }
    picked.push(p);
    catCount.set(pCat, (catCount.get(pCat) ?? 0) + 1);
  }
  for (const p of skipped) {
    if (picked.length >= limit) break;
    picked.push(p);
  }

  // Backfill: configured fallback slugs, then remaining actives by order.
  if (picked.length < limit) {
    const have = new Set(picked.map((p) => p.id));
    const fallbacks = (current.related_fallback_slugs || "")
      .split(/[|,]/)
      .map((s) => s.trim())
      .filter(Boolean);
    for (const slug of fallbacks) {
      if (picked.length >= limit) break;
      const p = eligible.find(
        (x) => productSlug(x) === slug && !have.has(x.id)
      );
      if (p) {
        picked.push(p);
        have.add(p.id);
      }
    }
    for (const p of [...eligible].sort((a, b) => a.sort_order - b.sort_order)) {
      if (picked.length >= limit) break;
      if (!have.has(p.id)) {
        picked.push(p);
        have.add(p.id);
      }
    }
  }
  return picked.slice(0, limit);
}
