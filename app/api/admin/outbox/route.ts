import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/request";
import { getStore } from "@/lib/data";
import { deliverDue } from "@/lib/email/outbox";

/** GET — outbox summary (admin only). */
export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const store = await getStore();
  return NextResponse.json(await store.outboxSummary());
}

/**
 * POST — process due outbox messages and run retention cleanup (admin only).
 * This is the manual/dashboard-triggered retry path; delivery is also
 * attempted automatically right after each enqueue. There is deliberately
 * no unauthenticated retry endpoint.
 */
export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  void req;
  const store = await getStore();
  const delivered = await deliverDue(store, 25);
  const retention = await store.retentionCleanup();
  return NextResponse.json({ delivered, retention });
}
