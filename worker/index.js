/**
 * Custom Worker entrypoint: wraps the OpenNext-generated handler and adds a
 * Cloudflare `scheduled` handler for automatic email-outbox processing.
 *
 * The cron (wrangler.toml [triggers], every 5 minutes) self-invokes the
 * Next.js route POST /api/cron/outbox through the in-process fetch handler
 * using the synthetic host `cron.internal`, which public traffic can never
 * present (Cloudflare only routes the zone/workers.dev hostnames here).
 * Outbox processing is idempotent with atomic per-row claims, so even
 * overlapping executions cannot double-send.
 */
import handler, {
  DOQueueHandler,
  DOShardedTagCache,
  BucketCachePurge,
} from "../.open-next/worker.js";

export { DOQueueHandler, DOShardedTagCache, BucketCachePurge };

const worker = {
  fetch: handler.fetch,

  async scheduled(controller, env, ctx) {
    const request = new Request("https://cron.internal/api/cron/outbox", {
      method: "POST",
      headers: { host: "cron.internal" },
    });
    ctx.waitUntil(
      handler
        .fetch(request, env, ctx)
        .then((res) => console.log(`[scheduled] outbox cron status=${res.status}`))
        .catch((err) => console.error("[scheduled] outbox cron failed", err?.message))
    );
  },
};

export default worker;
