import { NextRequest, NextResponse } from "next/server";
import { readDb, mutate, logActivity } from "@/lib/store";
import { requireAdmin } from "@/lib/request";
import type { SupporterStatus } from "@/lib/types";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const params = req.nextUrl.searchParams;
  const status = params.get("status");
  const country = params.get("country");
  const era = params.get("era");
  const q = params.get("q")?.toLowerCase();

  const db = await readDb();
  let list = db.supporters.filter((s) => s.status !== "deleted");
  if (status) list = list.filter((s) => s.status === status);
  if (country) list = list.filter((s) => s.country_code === country.toUpperCase());
  if (era) list = list.filter((s) => s.favorite_era === era);
  if (q)
    list = list.filter(
      (s) =>
        s.first_name.toLowerCase().includes(q) ||
        (s.last_name ?? "").toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q)
    );
  list.sort((a, b) => b.supporter_number - a.supporter_number);
  return NextResponse.json({ supporters: list });
}

const ACTIONS: Record<string, SupporterStatus> = {
  approve: "approved",
  hide: "hidden",
  delete: "deleted",
};

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  let id = "", action = "";
  try {
    const body = await req.json();
    id = String(body.id ?? "");
    action = String(body.action ?? "");
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const status = ACTIONS[action];
  if (!status)
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });

  const ok = await mutate((db) => {
    const s = db.supporters.find((x) => x.id === id);
    if (!s) return false;
    s.status = status;
    const type =
      action === "approve"
        ? "supporter_approved"
        : action === "hide"
          ? "supporter_hidden"
          : "supporter_deleted";
    logActivity(db, type, `Supporter #${s.supporter_number} ${status}`);
    return true;
  });
  if (!ok) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
