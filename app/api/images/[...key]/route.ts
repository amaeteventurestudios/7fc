/** Serves admin-uploaded images from the R2 bucket (IMAGES binding). */
import { NextRequest, NextResponse } from "next/server";

interface R2ObjectBody {
  body: ReadableStream;
  httpMetadata?: { contentType?: string };
}
interface R2Bucket {
  get(key: string): Promise<R2ObjectBody | null>;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string[] }> }
) {
  const { key } = await params;
  const objectKey = key.join("/");
  // Only serve the dedicated uploads prefix; no path traversal.
  if (!/^uploads\/[a-zA-Z0-9._-]+$/.test(objectKey)) {
    return new NextResponse("Not found", { status: 404 });
  }
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const ctx = await getCloudflareContext({ async: true });
    const bucket = (ctx.env as Record<string, unknown>).IMAGES as R2Bucket | undefined;
    if (!bucket) return new NextResponse("Not found", { status: 404 });
    const obj = await bucket.get(objectKey);
    if (!obj) return new NextResponse("Not found", { status: 404 });
    return new NextResponse(obj.body, {
      headers: {
        "Content-Type": obj.httpMetadata?.contentType ?? "image/webp",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
