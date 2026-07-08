import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { readDb, mutate } from "@/lib/store";
import { requireAdmin } from "@/lib/request";
import type { AffiliateProduct } from "@/lib/types";

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const db = await readDb();
  const products = [...db.affiliate_products].sort(
    (a, b) => a.sort_order - b.sort_order
  );
  return NextResponse.json({ products });
}

function sanitize(body: Record<string, unknown>) {
  return {
    title: String(body.title ?? "").trim().slice(0, 120),
    category: String(body.category ?? "").trim().slice(0, 60),
    image_path: String(body.image_path ?? "").trim().slice(0, 200),
    description: String(body.description ?? "").trim().slice(0, 400),
    affiliate_url: String(body.affiliate_url ?? "").trim().slice(0, 500),
    button_text: String(body.button_text ?? "View on Amazon").trim().slice(0, 60),
  };
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const fields = sanitize(body);
  if (!fields.title || !fields.affiliate_url)
    return NextResponse.json(
      { error: "Title and affiliate URL are required." },
      { status: 400 }
    );
  const product = await mutate((db) => {
    const p: AffiliateProduct = {
      id: crypto.randomUUID(),
      ...fields,
      active: body.active !== false,
      sort_order: db.affiliate_products.length,
      click_count: 0,
    };
    db.affiliate_products.push(p);
    return p;
  });
  return NextResponse.json({ product }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const id = String(body.id ?? "");
  const action = String(body.action ?? "update");

  const ok = await mutate((db) => {
    const list = db.affiliate_products.sort((a, b) => a.sort_order - b.sort_order);
    const idx = list.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    const product = list[idx];

    if (action === "move_up" && idx > 0) {
      [list[idx - 1].sort_order, list[idx].sort_order] = [
        list[idx].sort_order,
        list[idx - 1].sort_order,
      ];
    } else if (action === "move_down" && idx < list.length - 1) {
      [list[idx + 1].sort_order, list[idx].sort_order] = [
        list[idx].sort_order,
        list[idx + 1].sort_order,
      ];
    } else if (action === "toggle_active") {
      product.active = !product.active;
    } else if (action === "update") {
      const fields = sanitize(body);
      if (fields.title) product.title = fields.title;
      if (fields.category) product.category = fields.category;
      if (fields.image_path) product.image_path = fields.image_path;
      if (fields.description) product.description = fields.description;
      if (fields.affiliate_url) product.affiliate_url = fields.affiliate_url;
      if (fields.button_text) product.button_text = fields.button_text;
      if (typeof body.active === "boolean") product.active = body.active;
    }
    return true;
  });
  if (!ok) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const id = req.nextUrl.searchParams.get("id") ?? "";
  const ok = await mutate((db) => {
    const before = db.affiliate_products.length;
    db.affiliate_products = db.affiliate_products.filter((p) => p.id !== id);
    return db.affiliate_products.length < before;
  });
  if (!ok) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
