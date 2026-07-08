import { NextRequest, NextResponse } from "next/server";
import { readDb, mutate, logActivity } from "@/lib/store";
import { requireAdmin } from "@/lib/request";
import type { LegalDisclaimers } from "@/lib/types";

const KEYS: Array<keyof LegalDisclaimers> = [
  "top_disclaimer",
  "footer_disclaimer",
  "affiliate_disclosure",
  "privacy_note",
  "product_note",
];

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const db = await readDb();
  return NextResponse.json({ legal: db.legal_disclaimers });
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
  const legal = await mutate((db) => {
    for (const key of KEYS) {
      if (typeof body[key] === "string") {
        db.legal_disclaimers[key] = (body[key] as string).slice(0, 2000);
      }
    }
    logActivity(db, "legal_edited", "Legal disclaimers updated");
    return db.legal_disclaimers;
  });
  return NextResponse.json({ legal });
}
