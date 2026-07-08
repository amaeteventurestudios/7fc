import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/data";
import { requireAdmin } from "@/lib/request";
import type { GlobalWallSettings } from "@/lib/types";

const KEYS: Array<keyof GlobalWallSettings> = [
  "enable_submissions",
  "require_manual_approval",
  "show_supporter_count",
  "show_country_count",
  "show_latest_supporters",
  "show_country_flags",
  "allow_fan_messages",
  "allow_full_names",
  "show_favorite_era",
  "emergency_lock",
];

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const store = await getStore();
  return NextResponse.json({ settings: await store.getSettings() });
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const patch: Partial<GlobalWallSettings> = {};
  for (const key of KEYS) {
    if (typeof body[key] === "boolean") patch[key] = body[key] as boolean;
  }
  const store = await getStore();
  const settings = await store.updateSettings(patch);
  return NextResponse.json({ settings });
}
