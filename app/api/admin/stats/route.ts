import { NextResponse } from "next/server";
import { getStore } from "@/lib/data";
import { requireAdmin } from "@/lib/request";

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const store = await getStore();
  const { stats, activity } = await store.getStats();
  return NextResponse.json({ stats, activity });
}
