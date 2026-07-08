import { NextRequest, NextResponse } from "next/server";
import { readDb, mutate, logActivity } from "@/lib/store";
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
  const db = await readDb();
  return NextResponse.json({ settings: db.global_wall_settings });
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
  const settings = await mutate((db) => {
    for (const key of KEYS) {
      if (typeof body[key] === "boolean") {
        db.global_wall_settings[key] = body[key] as boolean;
      }
    }
    logActivity(db, "settings_changed", "Global Wall settings updated");
    return db.global_wall_settings;
  });
  return NextResponse.json({ settings });
}
