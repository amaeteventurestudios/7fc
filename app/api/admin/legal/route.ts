import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/data";
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
  const store = await getStore();
  return NextResponse.json({ legal: await store.getLegal() });
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
  const patch: Partial<LegalDisclaimers> = {};
  for (const key of KEYS) {
    if (typeof body[key] === "string") {
      patch[key] = (body[key] as string).slice(0, 2000);
    }
  }
  const store = await getStore();
  const legal = await store.updateLegal(patch);
  return NextResponse.json({ legal });
}
