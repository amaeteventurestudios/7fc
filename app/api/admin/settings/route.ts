import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/data";
import { requireAdmin } from "@/lib/request";
import { NUMERIC_SETTINGS, type GlobalWallSettings } from "@/lib/types";

const BOOL_KEYS: Array<keyof GlobalWallSettings> = [
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
  "founding_slots_enabled",
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
  const patch: Record<string, boolean | number> = {};
  for (const key of BOOL_KEYS) {
    if (typeof body[key] === "boolean") patch[key] = body[key] as boolean;
  }
  for (const key of NUMERIC_SETTINGS) {
    const v = Number(body[key]);
    if (Number.isFinite(v)) patch[key] = Math.min(Math.max(Math.round(v), 0), 10000);
  }
  const store = await getStore();
  const settings = await store.updateSettings(
    patch as Partial<GlobalWallSettings>
  );
  return NextResponse.json({ settings });
}
