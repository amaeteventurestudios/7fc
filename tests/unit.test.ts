/**
 * Unit tests for pure trust-layer logic. Run with: npm test
 * (Node's built-in test runner with native TypeScript stripping.)
 * Store/route integration is exercised against the dev server (see
 * docs/operations/email-delivery.md test plan).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  generateToken,
  hashToken,
  normalizeEmail,
  privacyHash,
} from "../lib/tokens.ts";
import {
  RETENTION,
  OUTBOX_BACKOFF_MINUTES,
  OUTBOX_MAX_ATTEMPTS,
  TERMS_VERSION,
  PRIVACY_VERSION,
} from "../lib/policy.ts";

test("tokens are long, URL-safe, and unique", () => {
  const a = generateToken();
  const b = generateToken();
  assert.notEqual(a, b);
  assert.ok(a.length >= 40);
  assert.match(a, /^[A-Za-z0-9_-]+$/);
});

test("token hashing is deterministic and never stores the raw value", () => {
  const raw = generateToken();
  assert.equal(hashToken(raw), hashToken(raw));
  assert.notEqual(hashToken(raw), raw);
  assert.match(hashToken(raw), /^[a-f0-9]{64}$/);
});

test("altered tokens produce different hashes", () => {
  const raw = generateToken();
  assert.notEqual(hashToken(raw), hashToken(raw.slice(0, -1) + "x"));
});

test("email normalization trims and lowercases", () => {
  assert.equal(normalizeEmail("  Fan@Example.COM "), "fan@example.com");
});

test("privacyHash is stable, short, and non-reversible-looking", () => {
  assert.equal(privacyHash("a"), privacyHash("a"));
  assert.notEqual(privacyHash("a"), privacyHash("b"));
  assert.equal(privacyHash("a").length, 32);
});

test("verification tokens expire in exactly 24 hours (fixed requirement)", () => {
  assert.equal(RETENTION.verificationTokenMs, 24 * 60 * 60 * 1000);
});

test("retention values are conservative", () => {
  assert.ok(RETENTION.unverifiedSignupMs <= 30 * 24 * 60 * 60 * 1000);
  assert.ok(RETENTION.outboxBodyMs <= RETENTION.outboxRowMs);
  assert.ok(RETENTION.managementTokenMs <= RETENTION.verificationTokenMs);
});

test("outbox retries are bounded with growing backoff", () => {
  assert.equal(OUTBOX_MAX_ATTEMPTS, OUTBOX_BACKOFF_MINUTES.length + 1);
  for (let i = 1; i < OUTBOX_BACKOFF_MINUTES.length; i++) {
    assert.ok(OUTBOX_BACKOFF_MINUTES[i] > OUTBOX_BACKOFF_MINUTES[i - 1]);
  }
});

test("policy versions are dated", () => {
  assert.match(TERMS_VERSION, /^\d{4}-\d{2}-\d{2}$/);
  assert.match(PRIVACY_VERSION, /^\d{4}-\d{2}-\d{2}$/);
});
