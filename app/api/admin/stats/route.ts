import { NextResponse } from "next/server";
import { readDb } from "@/lib/store";
import { requireAdmin } from "@/lib/request";

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const db = await readDb();

  const live = db.supporters.filter((s) => s.status !== "deleted");
  const today = new Date().toISOString().slice(0, 10);
  const eraCounts = new Map<string, number>();
  for (const s of live) {
    if (s.favorite_era)
      eraCounts.set(s.favorite_era, (eraCounts.get(s.favorite_era) ?? 0) + 1);
  }
  const topEra =
    [...eraCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

  return NextResponse.json({
    stats: {
      total_supporters: live.length,
      pending_approval: live.filter((s) => s.status === "pending").length,
      countries: new Set(live.map((s) => s.country_code)).size,
      email_signups: new Set(live.map((s) => s.email)).size,
      affiliate_clicks: db.affiliate_products.reduce(
        (sum, p) => sum + p.click_count,
        0
      ),
      top_era: topEra,
      today_signups: live.filter((s) => s.created_at.startsWith(today)).length,
    },
    activity: db.activity_log.slice(0, 20),
  });
}
