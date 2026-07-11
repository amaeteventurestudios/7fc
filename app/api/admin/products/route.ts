import { NextRequest, NextResponse } from "next/server";
import { getStore, type ProductAction, type ProductFields } from "@/lib/data";
import { requireAdmin } from "@/lib/request";
import {
  slugify,
  parseGallery,
  parseFaqs,
  EMPTY_PRODUCT_FIELDS,
} from "@/lib/kit";

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const store = await getStore();
  return NextResponse.json({ products: await store.listProducts() });
}

/** [field, max length] for plain-string product fields. */
const STRING_FIELDS: Array<[keyof ProductFields & string, number]> = [
  ["title", 200],
  ["short_title", 120],
  ["brand", 80],
  ["category", 60],
  ["image_path", 300],
  ["image_alt", 300],
  ["description", 2000],
  ["affiliate_url", 500],
  ["button_text", 60],
  ["tags", 400],
  ["seo_title", 200],
  ["seo_description", 400],
  ["og_title", 200],
  ["og_description", 400],
  ["og_image", 300],
  ["primary_keyword", 160],
  ["secondary_keywords", 500],
  ["search_intent", 160],
  ["h1", 200],
  ["eyebrow", 120],
  ["image_disclaimer", 500],
  ["affiliate_disclosure", 500],
  ["legal_disclaimer", 1000],
  ["related_fallback_slugs", 500],
];

const CONTENT_KEYS = [
  "why_7fc",
  "overview",
  "interesting",
  "best_for",
  "how_to_use",
  "gift_occasions",
  "what_to_check",
  "verdict",
] as const;

/**
 * Builds a partial fields object from the request body. Only keys present in
 * the body are included, so PATCH updates never wipe untouched fields.
 */
function sanitize(body: Record<string, unknown>): Partial<ProductFields> {
  const out: Record<string, unknown> = {};
  for (const [key, max] of STRING_FIELDS) {
    if (key in body) out[key] = String(body[key] ?? "").trim().slice(0, max);
  }
  if ("slug" in body || "title" in body) {
    const raw = String(body.slug ?? "").trim();
    const title = String(body.title ?? "").trim();
    if (raw || title) out.slug = slugify(raw || title);
  }
  if ("gallery_images" in body)
    out.gallery_images = parseGallery(body.gallery_images).slice(0, 8);
  if ("faqs" in body) out.faqs = parseFaqs(body.faqs).slice(0, 12);
  if ("content" in body && body.content && typeof body.content === "object") {
    const src = body.content as Record<string, unknown>;
    const content: Record<string, unknown> = {};
    for (const k of CONTENT_KEYS) {
      if (k in src) content[k] = String(src[k] ?? "").trim().slice(0, 5000);
    }
    for (const k of ["verified_facts", "unverified_fields"] as const) {
      if (Array.isArray(src[k]))
        content[k] = (src[k] as unknown[])
          .map((v) => String(v).trim().slice(0, 300))
          .filter(Boolean)
          .slice(0, 20);
    }
    out.content = content;
  }
  if ("featured" in body) out.featured = body.featured === true;
  if ("indexable" in body) out.indexable = body.indexable !== false;
  return out as Partial<ProductFields>;
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
  const fields: ProductFields = { ...EMPTY_PRODUCT_FIELDS, ...sanitize(body) };
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
