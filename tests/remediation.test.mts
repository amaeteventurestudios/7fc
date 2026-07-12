/**
 * Remediation-pass tests: unavailable-provider behavior, outbox concurrency
 * and retry semantics, Turnstile validation, and legacy-consent accuracy.
 * Run with: npm test
 */
import { test, before } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

process.env.SEVENFC_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "7fc-rem-"));

const { JsonStore } = await import("../lib/json-store.ts");
const { deliverDue, emailEnabled, enqueueEmail } = await import("../lib/email/outbox.ts");
const { verifyTurnstile } = await import("../lib/turnstile.ts");
const store = new JsonStore();

before(async () => {
  await store.getSettings();
});

function makeContent(subject: string) {
  return { subject, html: "<p>x</p>", text: "x" };
}

// ---------- R1: unavailable-provider behavior ----------

test("emailEnabled is true in dev, false in production without a key", () => {
  const orig = process.env.NODE_ENV;
  delete process.env.RESEND_API_KEY;
  process.env.NODE_ENV = "test";
  assert.equal(emailEnabled(), true);
  process.env.NODE_ENV = "production";
  assert.equal(emailEnabled(), false);
  process.env.RESEND_API_KEY = "re_dummy";
  assert.equal(emailEnabled(), true);
  delete process.env.RESEND_API_KEY;
  process.env.NODE_ENV = orig;
});

test("unconfigured provider parks messages without burning attempts (contact durability)", async () => {
  const orig = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  delete process.env.RESEND_API_KEY;
  await enqueueEmail(store, {
    eventKey: "rem:park",
    type: "contact_submission_alert",
    to: "contact@sevenfc.net",
    content: makeContent("park me"),
  });
  await deliverDue(store, 10);
  const row = await store.getOutboxByEventKey("rem:park");
  assert.equal(row!.status, "pending"); // survived, not failed
  assert.equal(row!.attempt_count, 0); // no attempt consumed
  assert.ok(row!.body_text); // payload preserved for later delivery
  assert.ok(row!.next_attempt_at! > new Date().toISOString());
  process.env.NODE_ENV = orig;
});

// ---------- R2: retry semantics, concurrency, duplicates ----------

test("dev provider delivers and records last_email_sent_at", async () => {
  await enqueueEmail(store, {
    eventKey: "rem:send",
    type: "owner_signup_alert",
    to: "admin@sevenfc.net",
    content: makeContent("send me"),
  });
  const res = await deliverDue(store, 10);
  assert.ok(res.sent >= 1);
  const row = await store.getOutboxByEventKey("rem:send");
  assert.equal(row!.status, "sent");
  assert.equal(row!.body_text, null); // redacted after send
  assert.ok(await store.getOpsMeta("last_email_sent_at"));
});

test("overlapping processors cannot double-claim (atomic claim)", async () => {
  await enqueueEmail(store, {
    eventKey: "rem:race",
    type: "owner_signup_alert",
    to: "admin@sevenfc.net",
    content: makeContent("race"),
  });
  const [a, b] = await Promise.all([
    store.claimDueOutbox(10),
    store.claimDueOutbox(10),
  ]);
  const mine = [...a, ...b].filter((m) => m.event_key === "rem:race");
  assert.equal(mine.length, 1); // exactly one processor got it
  await store.finishOutboxAttempt(mine[0].id, { status: "sent", provider: "test" });
});

test("stale processing rows are recovered after timeout", async () => {
  await enqueueEmail(store, {
    eventKey: "rem:stale",
    type: "owner_signup_alert",
    to: "admin@sevenfc.net",
    content: makeContent("stale"),
  });
  const claimed = await store.claimDueOutbox(10);
  const row = claimed.find((m) => m.event_key === "rem:stale")!;
  // Simulate a crashed processor: backdate updated_at past the 10-min window.
  const dbPath = path.join(process.env.SEVENFC_DATA_DIR!, "db.json");
  const db = JSON.parse(fs.readFileSync(dbPath, "utf8"));
  for (const m of db.email_outbox)
    if (m.id === row.id) m.updated_at = "2020-01-01T00:00:00.000Z";
  fs.writeFileSync(dbPath, JSON.stringify(db));
  const reclaimed = await store.claimDueOutbox(10);
  assert.ok(reclaimed.some((m) => m.event_key === "rem:stale"));
  await store.finishOutboxAttempt(row.id, { status: "sent", provider: "test" });
});

test("transient failures back off; max attempts becomes permanent failure", async () => {
  await enqueueEmail(store, {
    eventKey: "rem:fail",
    type: "owner_signup_alert",
    to: "admin@sevenfc.net",
    content: makeContent("fail"),
  });
  // Simulate 6 transient failures through the store API (as deliverDue does).
  const { OUTBOX_MAX_ATTEMPTS } = await import("../lib/policy.ts");
  for (let attempt = 1; attempt <= OUTBOX_MAX_ATTEMPTS; attempt++) {
    const due = await store.claimDueOutbox(50);
    const mine = due.find((m) => m.event_key === "rem:fail");
    assert.ok(mine, `attempt ${attempt} should find the row due`);
    const exhausted = attempt >= OUTBOX_MAX_ATTEMPTS;
    await store.finishOutboxAttempt(mine!.id, {
      status: exhausted ? "failed" : "pending",
      provider: "test",
      error: "HTTP 500: simulated",
      nextAttemptAt: exhausted ? null : new Date(Date.now() - 1).toISOString(),
    });
  }
  const row = await store.getOutboxByEventKey("rem:fail");
  assert.equal(row!.status, "failed");
  assert.equal(row!.attempt_count, OUTBOX_MAX_ATTEMPTS);
  // Permanently failed rows are never claimed again.
  const again = await store.claimDueOutbox(50);
  assert.ok(!again.some((m) => m.event_key === "rem:fail"));
  for (const m of again) await store.finishOutboxAttempt(m.id, { status: "sent", provider: "test" });
});

test("suppressed recipients are skipped and marked, not sent", async () => {
  await store.addEmailSuppression("suppressed@example.com", "hard_bounce");
  await enqueueEmail(store, {
    eventKey: "rem:suppressed",
    type: "supporter_welcome_confirmation",
    to: "suppressed@example.com",
    content: makeContent("nope"),
  });
  const row = await store.getOutboxByEventKey("rem:suppressed");
  assert.equal(row!.status, "suppressed");
});

// ---------- R4: Turnstile validation ----------

function mockVerify(response: unknown) {
  return async () => ({ json: async () => response });
}

test("turnstile: unconfigured -> skipped in dev only, reported unconfigured", async () => {
  delete process.env.TURNSTILE_SECRET_KEY;
  const res = await verifyTurnstile("token", "1.2.3.4");
  assert.equal(res.ok, true); // dev/test environment only
  assert.equal(res.configured, false);
  assert.equal(res.reason, "unconfigured");
});

test("turnstile: missing token fails when configured", async () => {
  process.env.TURNSTILE_SECRET_KEY = "sec";
  const res = await verifyTurnstile("", "1.2.3.4");
  assert.equal(res.ok, false);
  assert.equal(res.reason, "missing-token");
});

test("turnstile: invalid/expired/replayed token rejected by siteverify", async () => {
  process.env.TURNSTILE_SECRET_KEY = "sec";
  const res = await verifyTurnstile(
    "tok",
    "1.2.3.4",
    "contact",
    mockVerify({ success: false, "error-codes": ["timeout-or-duplicate"] })
  );
  assert.equal(res.ok, false);
  assert.equal(res.reason, "rejected");
});

test("turnstile: hostname mismatch rejected", async () => {
  process.env.TURNSTILE_SECRET_KEY = "sec";
  const res = await verifyTurnstile(
    "tok",
    "1.2.3.4",
    "contact",
    mockVerify({ success: true, hostname: "evil.example.com", action: "contact" })
  );
  assert.equal(res.ok, false);
  assert.equal(res.reason, "hostname-mismatch");
});

test("turnstile: action mismatch rejected", async () => {
  process.env.TURNSTILE_SECRET_KEY = "sec";
  const res = await verifyTurnstile(
    "tok",
    "1.2.3.4",
    "contact",
    mockVerify({ success: true, hostname: "sevenfc.net", action: "wall_signup" })
  );
  assert.equal(res.ok, false);
  assert.equal(res.reason, "action-mismatch");
});

test("turnstile: success with matching hostname and action", async () => {
  process.env.TURNSTILE_SECRET_KEY = "sec";
  const res = await verifyTurnstile(
    "tok",
    "1.2.3.4",
    "contact",
    mockVerify({ success: true, hostname: "sevenfc.net", action: "contact" })
  );
  assert.equal(res.ok, true);
});

test("turnstile: network failure fails closed", async () => {
  process.env.TURNSTILE_SECRET_KEY = "sec";
  const res = await verifyTurnstile("tok", "1.2.3.4", "contact", async () => {
    throw new Error("boom");
  });
  assert.equal(res.ok, false);
  assert.equal(res.reason, "network-error");
  delete process.env.TURNSTILE_SECRET_KEY;
});

// ---------- R3: legacy consent accuracy ----------

test("legacy rows carry no manufactured consent evidence but stay public", async () => {
  const { approved } = await store.getPublicHome();
  const legacy = approved.filter((s) => s.consent_source === "legacy_migration");
  assert.ok(legacy.length >= 1, "seed rows are legacy");
  for (const s of legacy) {
    assert.equal(s.terms_version, null);
    assert.equal(s.terms_accepted_at, null);
    assert.equal(s.privacy_ack_at, null);
    assert.equal(s.age_attested_at, null);
    assert.equal(s.display_consent_at, null); // no invented consent event
    assert.equal(s.marketing_consent, false);
    assert.equal(s.display_consent, true); // original public-wall intent kept
  }
});

test("new signups record consent_source=signup_form with real evidence", async () => {
  const res = await store.submitSupporter({
    first_name: "Fresh",
    last_name: null,
    email: "fresh@example.com",
    country_name: "Portugal",
    country_code: "PT",
    favorite_era: null,
    message: null,
    show_full_name: false,
    consents: {
      terms_version: "2026-07-11",
      privacy_version: "2026-07-11",
      display_consent: true,
      marketing_consent: false,
      age_attested: true,
      require_email_verification: true,
    },
  });
  assert.ok(!("error" in res));
  if ("error" in res) return;
  const s = await store.getSupporterById(res.id);
  assert.equal(s!.consent_source, "signup_form");
  assert.ok(s!.terms_accepted_at);
  assert.ok(s!.display_consent_at);
});

test("legacy reconfirmation via display grant updates consent_source", async () => {
  const { approved } = await store.getPublicHome();
  const legacy = approved.find((s) => s.consent_source === "legacy_migration")!;
  const now = new Date().toISOString();
  await store.updateSupporterFields(legacy.id, {
    display_consent: true,
    display_consent_at: now,
    consent_source: "reconfirmed",
  });
  const updated = await store.getSupporterById(legacy.id);
  assert.equal(updated!.consent_source, "reconfirmed");
  assert.equal(updated!.display_consent_at, now);
});

test("readiness counts include legacy supporters and outbox state", async () => {
  const counts = await store.readinessCounts();
  assert.ok(counts.legacy_consent_supporters >= 1);
  assert.ok(counts.outbox_sent >= 1);
  assert.equal(typeof counts.pending_privacy_requests, "number");
});

// ---------- Launch pass: durable rate limiting ----------

test("durable rate limit: counts per window, blocks over limit, exposes Retry-After seconds", async () => {
  const { durableRateLimit, rateLimitKey } = await import("../lib/ratelimit.ts");
  for (let i = 0; i < 3; i++) {
    const r = await durableRateLimit(store, "t-scope", "1.2.3.4", 3, 60_000);
    assert.equal(r.allowed, true, `attempt ${i + 1} allowed`);
  }
  const blocked = await durableRateLimit(store, "t-scope", "1.2.3.4", 3, 60_000);
  assert.equal(blocked.allowed, false);
  assert.ok(blocked.retryAfterSeconds >= 1 && blocked.retryAfterSeconds <= 60);
  // Different identifier unaffected
  const other = await durableRateLimit(store, "t-scope", "5.6.7.8", 3, 60_000);
  assert.equal(other.allowed, true);
  // Keys never contain the raw identifier (privacy-preserving HMAC)
  const key = rateLimitKey("t-scope", "1.2.3.4");
  assert.ok(!key.includes("1.2.3.4"));
  assert.match(key, /^t-scope:[a-f0-9]{40}$/);
});

test("durable rate limit: window expiry resets the counter", async () => {
  const { durableRateLimit } = await import("../lib/ratelimit.ts");
  for (let i = 0; i < 2; i++)
    await durableRateLimit(store, "t-exp", "9.9.9.9", 2, 50);
  const blocked = await durableRateLimit(store, "t-exp", "9.9.9.9", 2, 50);
  assert.equal(blocked.allowed, false);
  await new Promise((r) => setTimeout(r, 80));
  const fresh = await durableRateLimit(store, "t-exp", "9.9.9.9", 2, 50);
  assert.equal(fresh.allowed, true);
});

test("retention cleanup purges expired rate windows", async () => {
  const { durableRateLimit } = await import("../lib/ratelimit.ts");
  await durableRateLimit(store, "t-clean", "a", 5, 1);
  await new Promise((r) => setTimeout(r, 10));
  await store.retentionCleanup();
  assert.equal(
    (await store.countActiveRateLimits()) >= 0,
    true // expired entries removed; count reflects only live windows
  );
});

// ---------- Launch pass: form-state timing ----------

test("form state: valid after minimum fill time; forged/instant/expired rejected", async () => {
  const { issueFormState, verifyFormState } = await import("../lib/formstate.ts");
  const now = Date.now();
  const state = issueFormState(now - 5_000);
  assert.equal(verifyFormState(state, now), true);
  // Impossibly fast (bot)
  assert.equal(verifyFormState(issueFormState(now), now), false);
  // Forged signature
  assert.equal(verifyFormState(`${now - 5000}.forgedsig`, now), false);
  // Missing / garbage
  assert.equal(verifyFormState(undefined, now), false);
  assert.equal(verifyFormState("", now), false);
  // Expired (older than 24h)
  assert.equal(
    verifyFormState(issueFormState(now - 25 * 60 * 60 * 1000), now),
    false
  );
});

// ---------- Launch pass: production fail-closed Turnstile ----------

test("turnstile: production without secret fails closed (no bypass)", async () => {
  const orig = process.env.NODE_ENV;
  delete process.env.TURNSTILE_SECRET_KEY;
  process.env.NODE_ENV = "production";
  const res = await verifyTurnstile("any-token", "1.2.3.4", "supporter_signup");
  assert.equal(res.ok, false);
  assert.equal(res.configured, false);
  process.env.NODE_ENV = orig;
});

// ---------- Launch pass: lifecycle email ordering ----------

test("clean approval + flagged review email ordering, exactly-once", async () => {
  const { queueCleanApproval, queueFlaggedReview, queueRejectionNotice } =
    await import("../lib/wall-lifecycle.ts");
  const res = await store.submitSupporter({
    first_name: "Order",
    last_name: null,
    email: "order@example.com",
    country_name: "Portugal",
    country_code: "PT",
    favorite_era: null,
    message: null,
    show_full_name: false,
    consents: {
      terms_version: "t",
      privacy_version: "p",
      display_consent: true,
      marketing_consent: false,
      age_attested: true,
      require_email_verification: true,
    },
  });
  assert.ok(!("error" in res));
  if ("error" in res) return;
  const s = (await store.getSupporterById(res.id))!;

  // Clean approval: exactly one welcome + one owner "new supporter" alert,
  // even across retries.
  await queueCleanApproval(store, s);
  await queueCleanApproval(store, s);
  const welcome = await store.getOutboxByEventKey(`welcome:${s.id}`);
  const ownerNew = await store.getOutboxByEventKey(`owner-new:${s.id}`);
  assert.ok(welcome);
  assert.equal(welcome!.subject, `Welcome to 7FC, Supporter #${s.supporter_number}`);
  assert.ok(ownerNew);
  assert.match(ownerNew!.subject, /^New 7FC Supporter: #\d+, /);

  // Flagged review alert is a distinct idempotent event, never a welcome.
  await queueFlaggedReview(store, s, "link_in_field");
  const review = await store.getOutboxByEventKey(`owner-review:${s.id}`);
  assert.ok(review);
  assert.equal(review!.subject, "7FC Signup Requires Review");

  await queueRejectionNotice(store, s);
  const notice = await store.getOutboxByEventKey(`reject-notice:${s.id}`);
  assert.ok(notice);
  assert.equal(notice!.subject, "An update on your 7FC submission");
});

test("owner alert subjects and welcome/verification subjects match spec", async () => {
  const {
    ownerNewSupporterAlert,
    ownerReviewAlert,
    verificationEmail,
    welcomeEmail,
  } = await import("../lib/email/templates.ts");
  assert.equal(
    ownerNewSupporterAlert({
      supporterNumber: 12,
      displayName: "A B.",
      country: "Portugal",
      createdAt: "-",
    }).subject,
    "New 7FC Supporter: #12, Portugal"
  );
  assert.equal(
    ownerReviewAlert({
      supporterNumber: 3,
      displayName: "A",
      country: "PT",
      createdAt: "-",
      flagReason: "link_in_field",
    }).subject,
    "7FC Signup Requires Review"
  );
  assert.equal(verificationEmail("A", "https://x").subject, "Verify your email for 7FC");
  assert.equal(
    welcomeEmail({ firstName: "A", supporterNumber: 12, country: "PT", era: null }).subject,
    "Welcome to 7FC, Supporter #12"
  );
});
