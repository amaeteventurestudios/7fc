import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/data";
import { deliverDue } from "@/lib/email/outbox";

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
  await store.setOpsMeta("last_cron_at", started);
  console.log(
    `[outbox-cron] sent=${delivered.sent} failed=${delivered.failed} skipped=${delivered.skipped} retention=${JSON.stringify(retention)}`
  );
  return NextResponse.json({ ok: true, delivered, retention });
}
