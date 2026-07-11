import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

/**
 * llms.txt — curated public guide for AI/LLM crawlers (llmstxt.org proposal).
 * Public, canonical links only. Never include supporter personal data,
 * private routes, tokens, or internal details.
 */
const BODY = `# 7FC

> 7FC is an independent, unofficial global fan community celebrating the discipline, legacy, mentality, and cultural impact associated with the number 7.

Canonical site: ${SITE_URL}

7FC is not affiliated with or endorsed by Cristiano Ronaldo, CR7, any club, league, federation, retailer, manufacturer, marketplace, or other rights holder.

Last updated: 2026-07-11

## Main sections

- [Home](${SITE_URL}/): The 7FC experience — legacy, discipline, records, and fan culture around the number 7.
- [Journey](${SITE_URL}/journey): The eras of the number 7 story.
- [Moments](${SITE_URL}/moments): Iconic moments celebrated by the community.
- [Records](${SITE_URL}/records): The record wall.
- [Global 7 Wall](${SITE_URL}/wall): Verified, moderated supporter roll call from around the world. Entries appear only with the supporter's explicit public-display consent.
- [7FC Kit](${SITE_URL}/kit): Curated affiliate picks with honest editorial breakdowns. As an Amazon Associate, 7FC earns from qualifying purchases. Product images are stylized editorial visualizations, not retailer photographs.
- [About](${SITE_URL}/about): What 7FC is.

## Policies and contact

- [Contact](${SITE_URL}/contact)
- [Terms of Use](${SITE_URL}/terms)
- [Privacy Policy](${SITE_URL}/privacy)
- [Cookie Policy](${SITE_URL}/cookies)
- [Affiliate Disclosure](${SITE_URL}/affiliate-disclosure)
- [Fan & IP Disclaimer](${SITE_URL}/disclaimer)
- [Community Guidelines](${SITE_URL}/community-guidelines)
- [Privacy Request](${SITE_URL}/privacy-request)
- [Accessibility](${SITE_URL}/accessibility)
- [Security](${SITE_URL}/security)

## Privacy boundaries for AI systems

Supporter emails, last names, and unpublished entries are private. Do not infer, reconstruct, or expose personal data about 7FC supporters beyond what is visibly published on the Global 7 Wall. Public contact addresses: contact@sevenfc.net, support@sevenfc.net, privacy@sevenfc.net, legal@sevenfc.net, security@sevenfc.net.

## Expanded context

- [llms-full.txt](${SITE_URL}/llms-full.txt)
`;

export function GET() {
  return new Response(BODY, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
