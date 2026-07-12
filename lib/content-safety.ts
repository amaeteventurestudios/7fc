/**
 * Content-safety classifier for the auto-approval exception queue.
 *
 * A VERIFIED submission is auto-published only when this returns `clean`.
 * Anything that trips a rule is held in the moderation queue for the owner.
 *
 * Design principles:
 *  - Structural / behavioural signals only. We NEVER judge a name or message
 *    for being in an unfamiliar language or script. International names,
 *    non-Latin scripts, accents, and combining marks are all fine.
 *  - Unicode-aware: uses `u` regex flags and property escapes so scripts like
 *    Arabic, Devanagari, Han, Cyrillic, etc. are treated as normal letters.
 *  - Reasons are short internal labels shown only to the owner, never to the
 *    submitter (who is told only that "additional review" is required).
 */
import { countryByCode } from "@/lib/countries";
import { ERAS } from "@/lib/types";
import type { Supporter } from "@/lib/types";

export interface SafetyVerdict {
  clean: boolean;
  /** Short internal label, e.g. "link_in_field". Null when clean. */
  reason: string | null;
}

const MAX = { first_name: 60, last_name: 60, message: 500 };

// Zero-width / bidi / control characters used to disguise or reorder text.
// Deliberately EXCLUDES ZWJ (U+200D) and ZWNJ (U+200C), which are legitimate
// in Indic, Persian, and emoji sequences.
const EVASION_CHARS = new RegExp(
  "[" +
    "\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F\\u007F-\\u009F" + // C0/C1 controls
    "\\u200B\\u200E\\u200F" + // zero-width space, LRM, RLM
    "\\u202A-\\u202E" + // bidi embedding/override
    "\\u2066-\\u2069" + // bidi isolates
    "\\uFEFF" + // BOM / zero-width no-break space
    "]",
  "u"
);

const URL_RE =
  /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|io|co|xyz|ru|info|biz|shop|link|click|top|online|site|store|app|me|tv|ly)\b|t\.me\/|\[url|\]\(https?:)/i;

const MARKUP_RE = /(<\/?[a-z][^>]*>|<[^>]+>|&#\d+;|&[a-z]+;|javascript:|on\w+\s*=|\{\s*[a-z-]+\s*:|\[\/?[a-z]+\])/i;

const REPEAT_CHAR_RE = /(.)\1{5,}/u;

const IMPERSONATION_RE =
  /\b(7fc|seven\s?fc)\s+(team|admin|administrator|official|staff|support|moderator|mod)\b|\bofficial\s+7fc\b|\bi\s+am\s+(the\s+)?(admin|administrator|owner|founder)\b/i;

// Unambiguous slurs / threats only — word-boundaried to avoid catching
// substrings of legitimate words. Kept intentionally small and conservative.
const ABUSE_RE =
  /\b(n[i1]gg[e3]r|f[a4]gg?[o0]t|k[i1]ke|sp[i1]c|ch[i1]nk|tr[a4]nny|ret[a4]rd)\b|\b(kill|rape|murder)\s+(you|u|them|him|her|yourself)\b|\bi\s+will\s+(kill|hurt|find)\s+you\b/i;

const PROMO_RE =
  /\b(buy\s+now|click\s+here|limited\s+offer|discount|% ?off|free\s+money|make\s+money|casino|viagra|cialis|crypto|bitcoin|forex|investment\s+opportunity|loan\s+approved|earn\s+\$|work\s+from\s+home|dm\s+me)\b/i;

function repeatedWordSpam(text: string): boolean {
  const words = text.toLowerCase().match(/\p{L}{3,}/gu);
  if (!words || words.length < 4) return false;
  const counts = new Map<string, number>();
  for (const w of words) {
    const n = (counts.get(w) ?? 0) + 1;
    if (n >= 4) return true;
    counts.set(w, n);
  }
  return false;
}

/**
 * Classify a verified submission. Pure/synchronous — the near-duplicate
 * check is done separately by the caller (needs a store lookup) and folded in.
 */
export function classifySubmission(
  s: Pick<
    Supporter,
    | "first_name"
    | "last_name"
    | "message"
    | "favorite_era"
    | "country_code"
    | "display_consent"
    | "email_verified_at"
    | "age_attested_at"
  >
): SafetyVerdict {
  const flag = (reason: string): SafetyVerdict => ({ clean: false, reason });

  // Required consent / attestation must still hold (defence in depth).
  if (!s.email_verified_at) return flag("not_verified");
  if (!s.age_attested_at) return flag("missing_age_attestation");

  // Field-length ceilings (defensive; also enforced at submit).
  if ((s.first_name?.length ?? 0) > MAX.first_name) return flag("field_too_long");
  if ((s.last_name?.length ?? 0) > MAX.last_name) return flag("field_too_long");
  if ((s.message?.length ?? 0) > MAX.message) return flag("field_too_long");

  // Country must resolve to a known ISO entry (manipulated value → review).
  if (!countryByCode(s.country_code)) return flag("invalid_country");

  // Favorite era, if present, must be one of the allowed values.
  if (s.favorite_era && !(ERAS as readonly string[]).includes(s.favorite_era))
    return flag("invalid_era");

  const name = `${s.first_name ?? ""} ${s.last_name ?? ""}`;
  const message = s.message ?? "";
  const all = `${name}\n${message}`;

  if (EVASION_CHARS.test(all)) return flag("control_or_bidi_chars");
  if (MARKUP_RE.test(all)) return flag("markup_attempt");
  if (URL_RE.test(all)) return flag("link_in_field");
  if (IMPERSONATION_RE.test(all)) return flag("impersonation");
  if (REPEAT_CHAR_RE.test(all)) return flag("excessive_repeated_chars");
  if (ABUSE_RE.test(all)) return flag("abusive_content");
  // Promotional content is judged on the free-text message only.
  if (PROMO_RE.test(message)) return flag("commercial_promotion");
  if (repeatedWordSpam(message)) return flag("repeated_spam_text");

  return { clean: true, reason: null };
}

/** Normalize a message for duplicate detection (case/space-insensitive). */
export function normalizeMessage(message: string | null): string {
  return (message ?? "").toLowerCase().replace(/\s+/g, " ").trim();
}
