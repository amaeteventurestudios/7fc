# 7FC Search & AI Discovery Operations

Internal document. Last updated: 2026-07-11.

## Canonical origin

`https://sevenfc.net` (set `NEXT_PUBLIC_SITE_URL` in production vars).
Cloudflare should redirect `www.sevenfc.net` → apex 301 (Rules →
Redirect). The workers.dev preview URL must not be indexed — canonical tags
on every page already point at sevenfc.net, which handles duplicate-domain
consolidation.

## Files

- `/robots.txt` — app/robots.ts. Disallows /admin, /api/, /verify, /manage,
  /privacy-request/verify (auth + noindex remain the real protection).
- `/sitemap.xml` — app/sitemap.ts. Public canonical URLs only: home, wall,
  journey, moments, records, kit + active indexable products, about,
  contact, privacy-request, all policy pages. Products carry real
  `updated_at` lastmod; policy pages carry the policy date (no fake
  "changed today" values). Private/token routes are excluded by design.
- `/llms.txt`, `/llms-full.txt` — curated AI guides; update the
  "Last updated" line when site structure changes. Never add personal data.
- `/.well-known/security.txt` — renew Expires annually.

## Crawler policy

Legitimate crawlers (search + AI) may access all public content; nothing
blocks CSS/JS/images. llms.txt is an emerging convention, not a guarantee of
LLM indexing.

## Search Console / Bing (MANUAL — not yet done)

Google Search Console:
1. https://search.google.com/search-console → Add property → Domain
   `sevenfc.net` → add the shown TXT record in Cloudflare DNS (does not
   affect MX), or use URL-prefix + HTML-tag method by setting the
   verification content into a `google-site-verification` meta tag.
2. Submit sitemap: `https://sevenfc.net/sitemap.xml`.

Bing Webmaster Tools:
1. https://www.bing.com/webmasters → Add site → easiest: "Import from
   Google Search Console"; otherwise add the CNAME/meta they show.
2. Submit the same sitemap URL.

Verification values must come from the dashboard at setup time — none are
hardcoded in the repo. Do not claim verification until actually completed.

## Structured data

WebSite + Organization (layout), CollectionPage/Breadcrumb (kit, wall via
page files), WebPage/Product-without-offers on kit products (deliberately no
Offer/price/rating markup — concept imagery must not masquerade as retail
listings), ContactPage on /contact. Validate after significant changes with
https://validator.schema.org and Google's Rich Results test.
