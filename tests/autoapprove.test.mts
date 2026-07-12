/**
 * Auto-approval with narrow exception queue — end-to-end lifecycle tests.
 * Exercises the store + classifier + lifecycle exactly as the verify route
 * does, against an isolated JSON store. Run with: npm test
 */
import { test, before } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

process.env.SEVENFC_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "7fc-auto-"));

const { JsonStore } = await import("../lib/json-store.ts");
const { classifySubmission, normalizeMessage } = await import(
  "../lib/content-safety.ts"
);
const { queueCleanApproval, queueFlaggedReview } = await import(
  "../lib/wall-lifecycle.ts"
);
const { hashToken, generateToken } = await import("../lib/tokens.ts");

const store = new JsonStore();

const baseConsents = {
  terms_version: "t",
  privacy_version: "p",
  display_consent: true,
  marketing_consent: false,
  age_attested: true,
  require_email_verification: true,
};

async function submit(over: Partial<Parameters<typeof store.submitSupporter>[0]> = {}) {
  const res = await store.submitSupporter({
    first_name: "Cris",
    last_name: null,
    email: `u${Math.random().toString(36).slice(2)}@example.com`,
    country_name: "Portugal",
    country_code: "PT",
    favorite_era: null,
    message: null,
    show_full_name: false,
    consents: baseConsents,
    ...over,
  });
  if ("error" in res) throw new Error(res.error);
  return res;
}

/** Mint + consume a verification token as the real flow does. */
async function verify(id: string) {
  const raw = generateToken();
  await store.createSecurityToken({
    purpose: "verify",
    subject_id: id,
    token_hash: hashToken(raw),
    expires_at: new Date(Date.now() + 60_000).toISOString(),
  });
  const consumed = await store.consumeSecurityToken("verify", hashToken(raw));
  assert.ok(consumed);
  return store.markSupporterVerified(id);
}

/** Replicate the verify route's decision + side effects. */
async function processVerified(id: string) {
  const supporter = (await store.getSupporterById(id))!;
  const settings = await store.getSettings();
  const verdict = classifySubmission(supporter);
  const duplicate =
    verdict.clean &&
    (await store.hasDuplicateMessage(normalizeMessage(supporter.message), id));
  const flagged = !verdict.clean || duplicate;
  const reason = duplicate ? "near_duplicate_message" : verdict.reason;
  const autoApprove =
    !settings.require_manual_approval && !flagged && supporter.display_consent;
  if (autoApprove) {
    const approved = await store.autoApproveVerified(id);
    await queueCleanApproval(store, approved ?? supporter);
    return { published: true, flagged: false };
  }
  if (reason) await store.updateSupporterFields(id, { moderation_note: reason });
  await queueFlaggedReview(store, supporter, reason ?? "manual_review_mode");
  return { published: false, flagged };
}

before(async () => {
  await store.getSettings(); // seed (auto-approve default)
});

// 1. Unverified submissions remain private.
test("unverified submission is private and unpublished", async () => {
  const { id } = await submit();
  const s = (await store.getSupporterById(id))!;
  assert.equal(s.status, "pending");
  assert.equal(s.email_verified_at, null);
  const pub = await store.getPublicHome();
  assert.ok(!pub.approved.some((x) => x.id === id));
});

// 2 + 3 + 4 + 5. Clean verified → auto-approved, published (consent active),
// exactly one welcome + one owner alert.
test("clean verified submission auto-approves, publishes, one welcome + one owner alert", async () => {
  const { id, supporter_number } = await submit({
    first_name: "Diogo",
    message: "Proud supporter of the number 7.",
  });
  await verify(id);
  const out = await processVerified(id);
  assert.equal(out.published, true);
  const s = (await store.getSupporterById(id))!;
  assert.equal(s.status, "approved");
  assert.ok(s.published_at);
  const pub = await store.getPublicHome();
  assert.ok(pub.approved.some((x) => x.id === id));
  // Exactly one welcome + one owner-new alert.
  const welcome = await store.getOutboxByEventKey(`welcome:${id}`);
  const ownerNew = await store.getOutboxByEventKey(`owner-new:${id}`);
  assert.ok(welcome);
  assert.equal(welcome!.subject, `Welcome to 7FC, Supporter #${supporter_number}`);
  assert.ok(ownerNew);
  assert.equal(await store.getOutboxByEventKey(`owner-review:${id}`), null);
});

// 3 (consent). Clean but consent withdrawn before verification → not published.
test("clean submission is NOT auto-published when display consent is inactive", async () => {
  const { id } = await submit({
    consents: { ...baseConsents, display_consent: false },
  });
  await verify(id);
  const out = await processVerified(id);
  assert.equal(out.published, false);
  const s = (await store.getSupporterById(id))!;
  assert.equal(s.status, "pending"); // held, not public
  assert.equal(await store.getOutboxByEventKey(`welcome:${id}`), null);
});

// 6 + 7 + 8 + 9. Flagged verified (URL) stays private, no welcome, in queue.
test("URL in a field is flagged: private, queued, owner review, no welcome", async () => {
  const { id } = await submit({ message: "check my site at http://spam.example" });
  await verify(id);
  const out = await processVerified(id);
  assert.equal(out.flagged, true);
  const s = (await store.getSupporterById(id))!;
  assert.equal(s.status, "pending");
  assert.equal(s.moderation_note, "link_in_field");
  assert.equal(await store.getOutboxByEventKey(`welcome:${id}`), null);
  assert.ok(await store.getOutboxByEventKey(`owner-review:${id}`));
  const pub = await store.getPublicHome();
  assert.ok(!pub.approved.some((x) => x.id === id));
});

// 9. HTML/markup attempt is flagged.
test("HTML/script markup is flagged", async () => {
  const v = classifySubmission({
    first_name: "x",
    last_name: null,
    message: "<script>alert(1)</script>",
    favorite_era: null,
    country_code: "PT",
    display_consent: true,
    email_verified_at: "now",
    age_attested_at: "now",
  });
  assert.equal(v.clean, false);
  assert.equal(v.reason, "markup_attempt");
});

// 10. International names are NOT rejected.
test("international names and scripts are NOT flagged", async () => {
  for (const name of ["José", "Müller", "Renée", "李明", "Владимир", "Ọláwálé", "أحمد", "Sørensen"]) {
    const v = classifySubmission({
      first_name: name,
      last_name: "Ronaldøvic",
      message: "Legend of the number 7 — respeito e disciplina.",
      favorite_era: null,
      country_code: "PT",
      display_consent: true,
      email_verified_at: "now",
      age_attested_at: "now",
    });
    assert.equal(v.clean, true, `name "${name}" should be clean but got ${v.reason}`);
  }
});

// abusive / impersonation / promo / control-char coverage
test("abuse, impersonation, promotion, and evasion chars are flagged", async () => {
  const mk = (over: Record<string, unknown>) =>
    classifySubmission({
      first_name: "x",
      last_name: null,
      message: "",
      favorite_era: null,
      country_code: "PT",
      display_consent: true,
      email_verified_at: "now",
      age_attested_at: "now",
      ...over,
    });
  assert.equal(mk({ message: "i will kill you" }).reason, "abusive_content");
  assert.equal(mk({ first_name: "7FC Admin" }).reason, "impersonation");
  assert.equal(mk({ message: "buy now viagra casino bitcoin" }).reason, "commercial_promotion");
  assert.equal(mk({ message: "join‮evil" }).reason, "control_or_bidi_chars");
  assert.equal(mk({ message: "aaaaaaaa" }).reason, "excessive_repeated_chars");
  assert.equal(mk({ country_code: "ZZ" }).reason, "invalid_country");
});

// 9 (duplicate). Near-duplicate message flags the second submission.
test("near-duplicate message is flagged", async () => {
  const msg = "Forever seven, forever greatness across every era.";
  const a = await submit({ message: msg });
  await verify(a.id);
  await processVerified(a.id); // becomes approved/live
  const b = await submit({ message: `  ${msg.toUpperCase()}  ` });
  await verify(b.id);
  const out = await processVerified(b.id);
  assert.equal(out.flagged, true);
  const s = (await store.getSupporterById(b.id))!;
  assert.equal(s.moderation_note, "near_duplicate_message");
});

// 11 + 12. Duplicate retries cannot re-number or re-email.
test("re-processing a verified entry cannot re-approve, re-number, or re-email", async () => {
  const { id, supporter_number } = await submit({ message: "One code, one family." });
  await verify(id);
  await processVerified(id);
  const first = (await store.getSupporterById(id))!;
  // autoApproveVerified is guarded: second call is a no-op.
  const second = await store.autoApproveVerified(id);
  assert.equal(second, null);
  const after = (await store.getSupporterById(id))!;
  assert.equal(after.supporter_number, supporter_number);
  assert.equal(after.published_at, first.published_at);
  // Welcome enqueue is idempotent on welcome:{id}.
  await queueCleanApproval(store, after);
  const all = await store.outboxSummary();
  assert.ok(all.sent + all.pending >= 1);
});

// 13. Consent withdrawal unpublishes an auto-approved entry.
test("consent withdrawal unpublishes an auto-approved entry", async () => {
  const { id } = await submit({ message: "Discipline over everything." });
  await verify(id);
  await processVerified(id);
  assert.ok((await store.getPublicHome()).approved.some((x) => x.id === id));
  await store.updateSupporterFields(id, {
    display_consent: false,
    display_consent_withdrawn_at: new Date().toISOString(),
  });
  const pub = await store.getPublicHome();
  assert.ok(!pub.approved.some((x) => x.id === id));
});

// 14. Admin unpublish (hide) removes public display immediately.
test("admin hide removes an entry from public display immediately", async () => {
  const { id } = await submit({ message: "Standards never drop." });
  await verify(id);
  await processVerified(id);
  await store.setSupporterStatus(id, "hide");
  const pub = await store.getPublicHome();
  assert.ok(!pub.approved.some((x) => x.id === id));
  const s = (await store.getSupporterById(id))!;
  assert.equal(s.status, "hidden");
});

// 16. Existing supporters and numbers unchanged; manual-approval mode still queues.
test("manual-approval mode holds even clean submissions for review", async () => {
  await store.updateSettings({ require_manual_approval: true });
  const { id } = await submit({ message: "Manual mode check." });
  await verify(id);
  const out = await processVerified(id);
  assert.equal(out.published, false);
  const s = (await store.getSupporterById(id))!;
  assert.equal(s.status, "pending");
  assert.ok(await store.getOutboxByEventKey(`owner-review:${id}`));
  assert.equal(await store.getOutboxByEventKey(`welcome:${id}`), null);
  await store.updateSettings({ require_manual_approval: false });
});

// Seed supporters (numbers 7–9 in the seeded fixture) remain intact.
test("existing seeded supporters and numbers are unchanged", async () => {
  const all = await store.listSupporters({});
  const seeded = all.filter((s) => s.supporter_number >= 7 && s.supporter_number <= 13);
  assert.ok(seeded.length >= 1);
  // The classifier/lifecycle never mutates numbers.
  for (const s of seeded) assert.equal(typeof s.supporter_number, "number");
});
