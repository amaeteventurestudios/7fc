import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/data";
import { rateLimit, clientIp } from "@/lib/request";

export async function POST(req: NextRequest) {
  if (!rateLimit(`click:${clientIp(req)}`, 30, 60_000)) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }
  let productId: string;
  try {
    const body = await req.json();
    productId = String(body.product_id ?? "");
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const store = await getStore();
  await store.recordAffiliateClick(productId);
  return NextResponse.json({ ok: true });
}
