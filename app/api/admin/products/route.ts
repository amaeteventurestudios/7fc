import { NextRequest, NextResponse } from "next/server";
import { getStore, type ProductAction } from "@/lib/data";
import { requireAdmin } from "@/lib/request";

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const store = await getStore();
  return NextResponse.json({ products: await store.listProducts() });
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
  const store = await getStore();
  const product = await store.createProduct(fields, body.active !== false);
  return NextResponse.json({ product }, { status: 201 });
}

const ACTIONS: ProductAction[] = ["update", "move_up", "move_down", "toggle_active"];

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
  const action = String(body.action ?? "update") as ProductAction;
  if (!ACTIONS.includes(action))
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });

  const store = await getStore();
  const fields = sanitize(body);
  const ok = await store.updateProduct(id, action, {
    ...fields,
    active: typeof body.active === "boolean" ? body.active : undefined,
  });
  if (!ok) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const id = req.nextUrl.searchParams.get("id") ?? "";
  const store = await getStore();
  const ok = await store.deleteProduct(id);
  if (!ok) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
