import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/request";
import { getStore } from "@/lib/data";
import type { EntryReport } from "@/lib/types";

/** GET ?status=open — reported-content queue (admin only). */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const store = await getStore();
  const status = req.nextUrl.searchParams.get("status") as
    | EntryReport["status"]
    | null;
  const reports = await store.listEntryReports(status ?? undefined);
  return NextResponse.json({ reports });
}

/** POST { id, status: resolved|dismissed } — close a report (admin only). */
export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const id = String(body.id ?? "");
  const status = String(body.status ?? "");
  if (!id || (status !== "resolved" && status !== "dismissed"))
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  const store = await getStore();
  const ok = await store.updateEntryReport(id, status as EntryReport["status"]);
  return NextResponse.json({ ok });
}
