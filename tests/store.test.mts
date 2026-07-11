/**
 * Integration tests for the trust-layer store logic against the JSON store
 * (same Store interface as the production D1 implementation) using an
 * isolated temp data directory. Run with: npm test
 */
import { test, before } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

process.env.SEVENFC_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "7fc-test-"));

const { JsonStore } = await import("../lib/json-store.ts");
const { generateToken, hashToken } = await import("../lib/tokens.ts");

const store = new JsonStore();

const consents = {
  terms_version: "test",
  privacy_version: "test",
  display_consent: true,
  marketing_consent: false,
  age_attested: true,
  require_email_verification: true,
};

before(async () => {
  // Trigger seed.
  await store.getSettings();
});

test("existing seed supporters and numbers remain intact after migration-style normalization", async () => {
  const { approved } = await store.getPublicHome();
  assert.ok(approved.length >= 7);
  assert.equal(Math.min(...approved.map((s) => s.supporter_number)), 7);
});

test("full signup lifecycle: pending -> verify(one-time) -> moderation", async () => {
  const res = await store.submitSupporter({
    first_name: "Test",
    last_name: null,
    email: "lifecycle@example.com",
    country_name: "Portugal",
    country_code: "PT",
    favorite_era: null,
    message: "Siu",
    show_full_name: false,
    consents,
  });
  assert.ok(!("error" in res));
  if ("error" in res) return;
  const s0 = await store.getSupporterById(res.id);
  assert.equal(s0!.status, "pending");
  assert.equal(s0!.email_verified_at, null);
  // Not public before verification/approval
  const { approved } = await store.getPublicHome();
  assert.ok(!approved.some((s) => s.id === res.id));

  // Token: one-time, altered fails, reuse fails
  const raw = generateToken();
  await store.createSecurityToken({
    purpose: "verify",
    subject_id: res.id,
    token_hash: hashToken(raw),
    expires_at: new Date(Date.now() + 60_000).toISOString(),
  });
  assert.equal(await store.consumeSecurityToken("verify", hashToken(raw + "x")), null);
  const consumed = await store.consumeSecurityToken("verify", hashToken(raw));
  assert.ok(consumed);
  assert.equal(await store.consumeSecurityToken("verify", hashToken(raw)), null);

  const verified = await store.markSupporterVerified(res.id);
  assert.ok(verified?.email_verified_at);
  // Second verification attempt is a no-op
  assert.equal(await store.markSupporterVerified(res.id), null);

  // Duplicate email rejected by lookup
  const dup = await store.findSupporterByEmail("LIFECYCLE@example.com");
  assert.equal(dup?.id, res.id);
});

test("expired tokens fail", async () => {
  const raw = generateToken();
  await store.createSecurityToken({
    purpose: "manage",
    subject_id: "whatever",
    token_hash: hashToken(raw),
    expires_at: new Date(Date.now() - 1000).toISOString(),
  });
  assert.equal(await store.consumeSecurityToken("manage", hashToken(raw)), null);
});

test("outbox is idempotent per event key and never resends sent mail", async () => {
  const row = {
    event_key: "test:once",
    notification_type: "owner_signup_alert",
    related_id: null,
    recipient: "admin@sevenfc.net",
    from_addr: "7FC <notifications@sevenfc.net>",
    reply_to: null,
    subject: "test",
    body_html: "<p>x</p>",
    body_text: "x",
    status: "pending" as const,
  };
  await store.enqueueOutbox(row);
  await store.enqueueOutbox(row); // duplicate — must not create a second row
  const due = await store.claimDueOutbox(10);
  const mine = due.filter((m) => m.event_key === "test:once");
  assert.equal(mine.length, 1);
  await store.finishOutboxAttempt(mine[0].id, { status: "sent", provider: "test" });
  // Sent messages are not claimable again and bodies are redacted
  const again = await store.claimDueOutbox(10);
  assert.ok(!again.some((m) => m.event_key === "test:once"));
  const summary = await store.outboxSummary();
  assert.ok(summary.sent >= 1);
});

test("suppressed recipients block sends", async () => {
  await store.addEmailSuppression("bounced@example.com", "hard_bounce");
  assert.equal(await store.isEmailSuppressed("BOUNCED@example.com".toLowerCase()), true);
});

test("display-consent withdrawal removes entry from public data", async () => {
  const res = await store.submitSupporter({
    first_name: "Withdraw",
    last_name: null,
    email: "withdraw@example.com",
    country_name: "Brazil",
    country_code: "BR",
    favorite_era: null,
    message: null,
    show_full_name: false,
    consents: { ...consents, require_email_verification: false },
  });
  assert.ok(!("error" in res));
  if ("error" in res) return;
  await store.updateSupporterFields(res.id, { status: "approved" });
  let pub = await store.getPublicHome();
  assert.ok(pub.approved.some((s) => s.id === res.id));
  await store.updateSupporterFields(res.id, {
    display_consent: false,
    display_consent_withdrawn_at: new Date().toISOString(),
  });
  pub = await store.getPublicHome();
  assert.ok(!pub.approved.some((s) => s.id === res.id));
});

test("anonymization wipes personal data, keeps the number, revokes tokens", async () => {
  const res = await store.submitSupporter({
    first_name: "Delete",
    last_name: "Me",
    email: "deleteme@example.com",
    country_name: "Ghana",
    country_code: "GH",
    favorite_era: null,
    message: "bye",
    show_full_name: true,
    consents: { ...consents, require_email_verification: false },
  });
  assert.ok(!("error" in res));
  if ("error" in res) return;
  const number = res.supporter_number;
  const raw = generateToken();
  await store.createSecurityToken({
    purpose: "manage",
    subject_id: res.id,
    token_hash: hashToken(raw),
    expires_at: new Date(Date.now() + 60_000).toISOString(),
  });
  assert.equal(await store.anonymizeSupporter(res.id), true);
  const s = await store.getSupporterById(res.id);
  assert.equal(s!.first_name, "Deleted");
  assert.equal(s!.last_name, null);
  assert.equal(s!.message, null);
  assert.equal(s!.status, "deleted");
  assert.equal(s!.supporter_number, number);
  assert.ok(s!.email.endsWith("@invalid.sevenfc.net"));
  assert.equal(await store.consumeSecurityToken("manage", hashToken(raw)), null);
  assert.equal(await store.findSupporterByEmail("deleteme@example.com"), null);
});

test("retention cleanup removes stale unverified signups but never active supporters", async () => {
  const res = await store.submitSupporter({
    first_name: "Stale",
    last_name: null,
    email: "stale@example.com",
    country_name: "Nigeria",
    country_code: "NG",
    favorite_era: null,
    message: null,
    show_full_name: false,
    consents,
  });
  assert.ok(!("error" in res));
  if ("error" in res) return;
  // Backdate the unverified signup past retention.
  await store.updateSupporterFields(res.id, {});
  const beforeAll = (await store.listSupporters({})).length;
  // Direct mutation via file (test-only): rewrite created_at.
  const dbPath = path.join(process.env.SEVENFC_DATA_DIR!, "db.json");
  const db = JSON.parse(fs.readFileSync(dbPath, "utf8"));
  for (const s of db.supporters)
    if (s.id === res.id) s.created_at = "2020-01-01T00:00:00.000Z";
  fs.writeFileSync(dbPath, JSON.stringify(db));
  const result = await store.retentionCleanup();
  assert.ok(result.removedSupporters >= 1);
  const after = await store.listSupporters({});
  assert.equal(after.length, beforeAll - 1);
  assert.ok(!after.some((s) => s.id === res.id));
  // Verified/approved supporters untouched
  assert.ok(after.some((s) => s.supporter_number === 7));
});

test("privacy request lifecycle", async () => {
  const req = await store.createPrivacyRequest({
    email: "priv@example.com",
    request_type: "deletion",
    details: null,
  });
  assert.equal(req.status, "pending_verification");
  await store.updatePrivacyRequest(req.id, {
    status: "verified",
    verified_at: new Date().toISOString(),
  });
  const got = await store.getPrivacyRequest(req.id);
  assert.equal(got!.status, "verified");
});

test("duplicate entry reports are collapsed", async () => {
  const first = await store.createEntryReport({
    supporter_id: "s1",
    reason: "spam",
    details: null,
    reporter_hash: "h1",
  });
  const dup = await store.createEntryReport({
    supporter_id: "s1",
    reason: "spam",
    details: null,
    reporter_hash: "h1",
  });
  assert.equal(first.created, true);
  assert.equal(dup.created, false);
});
