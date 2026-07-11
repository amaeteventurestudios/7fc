/**
 * Admin image upload.
 *
 * - On Cloudflare: stores the file in the R2 bucket bound as `IMAGES`
 *   (wrangler.toml) and returns a public URL served by /api/images/[...key].
 * - In local dev (no R2 binding): writes into public/images/uploads/ so the
 *   file is served statically by `next dev`.
 * - Returns a clear error when deployed without the R2 binding configured.
 */
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { requireAdmin } from "@/lib/request";

const MAX_BYTES = 4 * 1024 * 1024; // 4 MB
const TYPES: Record<string, string> = {
  "image/webp": "webp",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/avif": "avif",
};

interface R2Bucket {
  put(
    key: string,
    value: ArrayBuffer,
    options?: { httpMetadata?: { contentType?: string } }
  ): Promise<unknown>;
}

async function getR2(): Promise<{ bucket: R2Bucket | null; onCloudflare: boolean }> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const ctx = await getCloudflareContext({ async: true });
    const env = ctx.env as Record<string, unknown>;
    return { bucket: (env.IMAGES as R2Bucket) ?? null, onCloudflare: true };
  } catch {
    return { bucket: null, onCloudflare: false };
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload request." }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File))
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  const ext = TYPES[file.type];
  if (!ext)
    return NextResponse.json(
      { error: "Unsupported file type. Use WebP, JPEG, PNG, or AVIF." },
      { status: 400 }
    );
  if (file.size > MAX_BYTES)
    return NextResponse.json(
      { error: "File too large. Maximum size is 4 MB." },
      { status: 400 }
    );

  const key = `uploads/${crypto.randomUUID()}.${ext}`;
  const buf = await file.arrayBuffer();
  const { bucket, onCloudflare } = await getR2();

  if (bucket) {
    await bucket.put(key, buf, { httpMetadata: { contentType: file.type } });
    return NextResponse.json({ url: `/api/images/${key}` }, { status: 201 });
  }
  if (onCloudflare) {
    return NextResponse.json(
      {
        error:
          "Upload storage is not configured. Add the IMAGES R2 bucket binding in wrangler.toml and redeploy.",
      },
      { status: 503 }
    );
  }
  // Local dev fallback: write into public/ so next dev serves it.
  const { promises: fs } = await import("fs");
  const path = await import("path");
  const dir = path.join(process.cwd(), "public", "images", "uploads");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, path.basename(key)), Buffer.from(buf));
  return NextResponse.json(
    { url: `/images/uploads/${path.basename(key)}` },
    { status: 201 }
  );
}
