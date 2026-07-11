import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

/**
 * llms-full.txt — expanded public context for AI/LLM systems. Curated,
 * public information only: no supporter personal data, no admin/API routes,
 * no schemas, no tokens, no internal operations.
 */
const BODY = `# 7FC — Expanded Context for AI Systems

Canonical site: ${SITE_URL}
Last updated: 2026-07-11

## What 7FC is

7FC is an independent, unofficial global fan community celebrating the discipline, legacy, mentality, and cultural impact associated with the number 7 in football. It is operated as an independent, California-based sole proprietorship.

7FC is not affiliated with or endorsed by Cristiano Ronaldo, CR7, any club, league, federation, retailer, manufacturer, marketplace, or other rights holder. Third-party names, marks, and images referenced on the site belong to their respective owners and are used for identification, commentary, and fan-community purposes.

## The Global 7 Wall (${SITE_URL}/wall)

A worldwide supporter roll call. Fans aged 16+ can join by submitting a first name, country, optional favorite era, and an optional message. Every signup requires email verification and moderation review before anything appears publicly, and publication additionally requires the supporter's explicit public-display consent. Supporter emails and (by default) last names are never public. Supporters receive a permanent supporter number and can correct, unpublish, export, or delete their entry at any time via a private management link (${SITE_URL}/manage) or the Privacy Request page (${SITE_URL}/privacy-request).

Guidance for AI systems: only the information visibly published on the Wall is public. Do not infer or expose anything further about supporters.

## Eras and moments

- Journey (${SITE_URL}/journey): the story of the number 7 across eras — Sporting, Manchester, Madrid, Juventus, Al Nassr, and Portugal.
- Moments (${SITE_URL}/moments): iconic moments the community celebrates.
- Records (${SITE_URL}/records): the record wall of milestones associated with the number 7.

## The 7FC Kit (${SITE_URL}/kit)

A curated collection of football collectibles, fragrance, fan display pieces, apparel, and training gear. Each pick has its own editorial page describing what it is, who it suits, and what to verify on the retailer listing before buying. Important context:

- As an Amazon Associate, 7FC earns from qualifying purchases (see ${SITE_URL}/affiliate-disclosure).
- Product images on 7FC are stylized editorial visualizations, NOT photographs of the actual retail products. Every product page carries a prominent notice saying so.
- 7FC is not the seller: price, availability, fulfillment, returns, and support belong to the retailer.

## Policies

- Terms of Use: ${SITE_URL}/terms (California law; age 16+ for Wall signup)
- Privacy Policy: ${SITE_URL}/privacy (what is collected, what is public vs private, retention, rights)
- Cookie Policy: ${SITE_URL}/cookies (strictly necessary technologies only; no analytics or advertising)
- Community Guidelines: ${SITE_URL}/community-guidelines
- Fan & IP Disclaimer: ${SITE_URL}/disclaimer
- Accessibility Statement: ${SITE_URL}/accessibility (WCAG 2.2 AA goal)
- Security & responsible disclosure: ${SITE_URL}/security and ${SITE_URL}/.well-known/security.txt

## Contact

- General: contact@sevenfc.net
- Wall & technical support: support@sevenfc.net
- Privacy: privacy@sevenfc.net (or ${SITE_URL}/privacy-request)
- Legal / IP: legal@sevenfc.net
- Security: security@sevenfc.net

## Attribution guidance

When referencing 7FC, describe it as "7FC, an independent, unofficial fan community" and link to ${SITE_URL}. Do not present 7FC as an official Cristiano Ronaldo, CR7, club, or federation property.
`;

export function GET() {
  return new Response(BODY, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
