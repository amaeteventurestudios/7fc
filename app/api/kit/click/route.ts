import { NextRequest, NextResponse } from "next/server";
import { mutate, logActivity } from "@/lib/store";
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
  await mutate((db) => {
    const product = db.affiliate_products.find((p) => p.id === productId);
    if (product) {
      product.click_count += 1;
      logActivity(db, "affiliate_click", `Affiliate product clicked: ${product.title}`);
    }
  });
  return NextResponse.json({ ok: true });
}
