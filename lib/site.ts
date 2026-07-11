/** Canonical site URL (configure NEXT_PUBLIC_SITE_URL in production). */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://sevenfc.net";

/** Default social preview image. The `v` query busts stale platform caches
 *  (WhatsApp, X, LinkedIn, etc.) — bump it whenever the artwork changes. */
export const OG_PREVIEW_IMAGE = "/images/7fc-og-preview.webp?v=2";

/** Primary public navigation — keep labels consistent everywhere. */
export const PRIMARY_NAV = [
  ["Home", "/"],
  ["Journey", "/journey"],
  ["Moments", "/moments"],
  ["Records", "/records"],
  ["Supporter Wall", "/wall"],
  ["7FC Kit", "/kit"],
  ["About", "/about"],
] as const;
