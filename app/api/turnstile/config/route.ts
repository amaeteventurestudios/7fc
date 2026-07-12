import { NextResponse } from "next/server";
import { turnstileSiteKey } from "@/lib/turnstile";

/** Public runtime config: the Turnstile SITE key only (public by design).
 *  Lets the key be configured via Worker vars without a client rebuild.
 *  The secret key is never exposed by any endpoint. */
export function GET() {
  return NextResponse.json({ siteKey: turnstileSiteKey() });
}
