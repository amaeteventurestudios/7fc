import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

/**
 * RFC 9116 security.txt.
 * NOTE: Expires must be renewed before it lapses (docs/operations/
 * incident-response.md documents the annual renewal step).
 */
const BODY = `Contact: mailto:security@sevenfc.net
Expires: 2027-07-11T00:00:00.000Z
Preferred-Languages: en
Canonical: ${SITE_URL}/.well-known/security.txt
Policy: ${SITE_URL}/security
`;

export function GET() {
  return new Response(BODY, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
