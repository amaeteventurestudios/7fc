/**
 * One-time security tokens (email verification, supporter management,
 * privacy-request verification). Only SHA-256 hashes are persisted; the
 * raw token appears exclusively in the email link and is never logged.
 */
import crypto from "crypto";

export type TokenPurpose = "verify" | "manage" | "privacy";

/** 256-bit URL-safe random token. */
export function generateToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

/** Normalize an email for storage/duplicate checks (trim + lowercase). */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Privacy-safe hash for audit/dedupe (reporter IPs, recipients). */
export function privacyHash(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex").slice(0, 32);
}
