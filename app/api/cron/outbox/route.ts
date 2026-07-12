import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/data";
import { deliverDue, enqueueEmail } from "@/lib/email/outbox";
import { reviewDigest, OWNER_ALERTS_TO } from "@/lib/email/templates";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Send an owner digest at most once per 7 days, and ONLY when there are
 *  unresolved flagged submissions or open reports. Never sends when empty. */
async function maybeSendDigest(store: Awaited<ReturnType<typeof getStore>>) {
  const counts = await store.readinessCounts();
  const pending = counts.pending_moderation + counts.open_reports;
  if (pending === 0) return; // nothing to review → no email
  const last = await store.getOpsMeta("last_digest_at");
  if (last && Date.now() - new Date(last).getTime() < WEEK_MS) return;
  const now = new Date();
  const eventKey = `digest:${now.toISOString().slice(0, 10)}`;
  await enqueueEmail(store, {
    eventKey,
    type: "owner_signup_alert",
    relatedId: null,
    to: OWNER_ALERTS_TO,
    replyTo: null,
    content: reviewDigest({
      flaggedCount: counts.pending_moderation,
      openReports: counts.open_reports,
    }),
  });
  await store.setOpsMeta("last_digest_at", now.toISOString());
}

/**
 * Internal target of the Cloudflare cron trigger (see worker/index.js and
 * the [triggers] block in wrangler.toml; runs every 5 minutes).
 *
 * Reachability: the scheduled handler invokes the worker's own fetch handler
 * in-process with the synthetic origin https://cron.internal — that hostname
 * can never arrive from the public internet because Cloudflare only routes
 * sevenfc.net / workers.dev hosts to this Worker. Any other host is
 * rejected. Even so, the operation is deliberately harmless: it only
 * processes the durable outbox (idempotent, atomic row claims) and runs
 * retention cleanup. Logs contain counts only — never bodies or tokens.
 */
export async function POST(req: NextRequest) {
  const host = req.headers.get("host");
  if (host !== "cron.internal") {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  const store = await getStore();
  const started = new Date().toISOString();
  const delivered = await deliverDue(store, 25);
  const retention = await store.retentionCleanup();
  await maybeSendDigest(store);
  // Deliver any digest just enqueued so it doesn't wait a full cycle.
  await deliverDue(store, 5);
  await store.setOpsMeta("last_cron_at", started);
  console.log(
    `[outbox-cron] sent=${delivered.sent} failed=${delivered.failed} skipped=${delivered.skipped} retention=${JSON.stringify(retention)}`
  );
  return NextResponse.json({ ok: true, delivered, retention });
}
