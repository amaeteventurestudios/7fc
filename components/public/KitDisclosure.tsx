/**
 * Product-image disclosure system for the 7FC Kit.
 *
 * The cinematic 7FC product images are stylized editorial visualizations,
 * not photographs of the third-party products sold on Amazon. These
 * components make that unmistakable everywhere a product image appears.
 */

/** Standard affiliate disclosure shown near the first Amazon CTA. */
export const AFFILIATE_DISCLOSURE_TEXT =
  "As an Amazon Associate, 7FC may earn from qualifying purchases at no additional cost to you.";

/**
 * Persistent badge overlaid on every cinematic product-card image.
 * Always visible — never hover-only.
 */
export function EditorialImageBadge() {
  return (
    <span
      className="absolute bottom-2 left-2 right-2 z-10 block rounded bg-black/80 border border-amber-400/70 px-2 py-1.5 text-center leading-tight pointer-events-none"
      role="note"
    >
      <span className="block text-[9px] font-bold tracking-[0.15em] uppercase text-amber-300">
        Editorial Visualization
      </span>
      <span className="block text-[8px] font-semibold tracking-[0.1em] uppercase text-amber-100/90">
        Not the Actual Product Image
      </span>
    </span>
  );
}

/**
 * High-contrast warning panel shown on every /kit/[slug] page,
 * directly below the hero image and before the first Amazon CTA.
 */
export function ProductImageWarning() {
  return (
    <section
      aria-label="Product image warning"
      className="mt-4 rounded-lg border-2 border-amber-400 bg-amber-950/70 p-5 md:p-6"
    >
      <h2 className="font-display text-lg md:text-xl font-bold uppercase tracking-wide text-amber-300 leading-snug">
        Important: This Is Not the Actual Product Image
      </h2>
      <p className="mt-3 text-sm text-amber-50 leading-relaxed">
        This 7FC image is a stylized editorial visualization created for
        presentation purposes. It may not accurately represent the
        product&rsquo;s appearance, packaging, colors, dimensions, branding,
        quantity, materials, included accessories, or current retail listing.
        Do not rely on this artwork to determine what you will receive. Review
        the actual product photographs, specifications, seller information,
        and current listing on Amazon before purchasing.
      </p>
    </section>
  );
}

/** Prominent notice above the /kit product grid. */
export function CollectionImageNotice() {
  return (
    <section
      aria-label="Product image notice"
      className="mt-10 max-w-3xl mx-auto rounded-lg border-2 border-amber-400 bg-amber-950/70 p-5 md:p-6 text-center"
    >
      <h2 className="font-display text-base md:text-lg font-bold uppercase tracking-wide text-amber-300">
        Product Image Notice
      </h2>
      <p className="mt-3 text-sm text-amber-50 leading-relaxed">
        The images in the 7FC Kit collection are stylized editorial
        presentations, not photographs of the exact products sold by
        third-party retailers. Actual products, packaging, colors, features,
        quantities, and included items may differ. Always review the current
        Amazon listing before purchasing.
      </p>
    </section>
  );
}

/** Affiliate disclosure line, rendered near the first Amazon CTA. */
export function AffiliateDisclosure({ text }: { text?: string }) {
  return (
    <p className="text-center text-[11px] text-gray-400 mt-4 leading-relaxed">
      <strong className="font-bold text-gray-300">Affiliate disclosure:</strong>{" "}
      {text?.trim() || AFFILIATE_DISCLOSURE_TEXT}
    </p>
  );
}
