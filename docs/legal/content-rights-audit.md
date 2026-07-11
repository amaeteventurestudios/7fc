# 7FC Content-Rights Audit (Copyright, Trademark, Image, Likeness)

Internal document — flags for owner review. **No content was deleted or
replaced during this audit.** Last updated: 2026-07-11.

Where a license cannot be confirmed the status is **UNKNOWN** — no licenses
are invented here. Complaint intake: legal@sevenfc.net (process published in
/terms and /disclaimer).

## 1. Generated cinematic imagery (public/images/*.webp, public/images/amazon/*.webp)

All site imagery appears to be AI-generated/stylized editorial artwork
produced for 7FC (per IMAGE_MANIFEST.md and repo history). 7FC owns the files
it generated, **but** several depict protected subject matter:

| Asset group | Pages | Depicts | Known owner of underlying rights | License basis | Risk | Recommended action | Status |
|---|---|---|---|---|---|---|---|
| Hero/era/moment/quote images (7fc-hero-*, 7fc-era-*, 7fc-moment-*, 7fc-choice-*, 7fc-quote-*) | Home, Journey, Moments, Records, Wall | Stylized player likeness evoking Cristiano Ronaldo; stadium scenes | Likeness/publicity rights: C. Ronaldo; any club marks incidentally evoked | UNKNOWN (no license; fan-art/editorial posture + prominent unofficial disclaimers) | **Medium** — publicity-rights exposure rises because the site earns affiliate revenue | Keep unofficial disclaimers prominent (done); avoid imagery implying endorsement; owner may seek counsel on CA right-of-publicity (Civ. Code §3344) | FLAGGED for owner review |
| Kit product visualizations (public/images/amazon/*) | /kit, /kit/[slug], homepage | Branded products: LEGO sets (incl. LEGO logo in artwork), CR7 fragrances, adidas socks, Med Spec brace, FIFA trophy shape, Portugal kit, Ronaldo likeness/"signature" motifs | LEGO Group, adidas, FIFA, CR7/Nike-adjacent brands, Medical Specialties, retail sellers | UNKNOWN (not retailer-provided images; Amazon Associates program expects accurate product representation — see §5) | **Medium-High** — brand logos rendered inside generated artwork; mitigated by the mandatory "not the actual product image" disclosure system already live on every card/page | Owner review; consider replacing artwork containing legible third-party logos (LEGO box art, CR7 packaging) with logo-free compositions or official Associates SiteStripe images | FLAGGED for owner review |
| 7FC logo/signature/favicon | Site-wide | Original 7FC marks | 7FC | Owned | Low | None | OK |

## 2. Names and text references

| Item | Pages | Basis | Risk | Status |
|---|---|---|---|---|
| "Cristiano Ronaldo", "CR7", club/era names (Sporting, Manchester, Madrid, Juventus, Al Nassr, Portugal) | Site-wide | Nominative/editorial use for identification and commentary; unofficial status stated in the top bar, footer, disclaimer page, emails, llms files | Low-Medium | OK with disclaimers (kept) |
| "CR7" in product titles (fragrances) | /kit pages | Retailer listing titles reproduced for identification | Low | OK |
| "LEGO", "FIFA", "adidas", "Med Spec/ASO" in product titles | /kit pages | Retailer listing titles; page copy already cautions that licensing claims must be confirmed on the listing | Low | OK |
| Quotations | Records/Moments pages contain short editorial text; no verbatim song lyrics or long third-party quotations found | — | Low | OK |
| Videos | None hosted or embedded | — | — | N/A |

## 3. User-submitted content

Wall messages are user-owned; the Terms grant 7FC a limited display
permission; moderation + report flow handle infringing submissions.
Status: OK (process in place).

## 4. Domain/identity

Public identity is "7FC" only; no owner personal name, no Umanah Systems
Group references in public content, metadata, JSON-LD, llms files, or email
templates (verified by grep during this audit). Status: OK.

## 5. Amazon Associates program compliance notes

- Required statement published: "As an Amazon Associate I earn from
  qualifying purchases" (/affiliate-disclosure + near CTAs).
- Links use rel="sponsored nofollow noopener".
- The Associates agreement expects participants not to misrepresent
  products; the site's prominent image-disclosure system addresses the
  stylized imagery, but using non-Amazon product imagery for linked ASINs
  remains a program-compliance gray area → **owner review recommended**
  (same remediation as §1 row 2).

## 6. Summary of flagged items for owner decision

1. Player-likeness artwork used on a revenue-generating fan site (medium).
2. Generated Kit artwork containing legible third-party logos (medium-high).
3. Optional: adopt official Associates-provided imagery for Kit pages.

No takedown-worthy third-party photographs, crests used as site branding, or
unlicensed media files were found. Nothing here grants or implies permission
to use protected material.
