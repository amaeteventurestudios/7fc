"use client";

import { useState } from "react";
import Link from "next/link";
import { CONTAINER, Reveal } from "./ui";
import { KIT_FALLBACK_IMAGE, productImage, productSlug, parseTags } from "@/lib/kit";
import {
  AffiliateDisclosure,
  EditorialImageBadge,
  ProductImageWarning,
} from "./KitDisclosure";
import type { AffiliateProduct } from "@/lib/types";

function trackClick(id: string) {
  fetch("/api/kit/click", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ product_id: id }),
    keepalive: true,
  }).catch(() => {});
}

/** Product image that falls back to the local 7FC kit image — never broken. */
export function KitImage({
  src,
  alt,
  className = "",
  eager = false,
}: {
  src: string;
  alt: string;
  className?: string;
  eager?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={failed ? KIT_FALLBACK_IMAGE : src}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}

export function RelatedCard({ p }: { p: AffiliateProduct }) {
  return (
    <div className="glass-card overflow-hidden text-center flex flex-col hover:border-gold/50 transition-colors h-full">
      <Link
        href={`/kit/${productSlug(p)}`}
        aria-label={p.short_title || p.title}
        className="relative block"
      >
        <KitImage
          src={productImage(p)}
          alt={p.image_alt || p.title}
          className="w-full aspect-[3/2] object-cover"
        />
        <EditorialImageBadge />
      </Link>
      <div className="p-4 flex flex-col flex-1">
        <p className="text-[10px] tracking-[0.25em] uppercase text-electric">
          {p.category}
        </p>
        <h3 className="font-display text-sm font-bold text-gold-2 mt-1 flex-1">
          {p.short_title || p.title}
        </h3>
        <Link
          href={`/kit/${productSlug(p)}`}
          className="mt-4 inline-block border border-gold/60 text-gold-2 text-[11px] font-bold tracking-widest uppercase px-5 py-2 rounded mx-auto hover:bg-gold/10 transition-colors"
        >
          View Product
        </Link>
      </div>
    </div>
  );
}

function EditorialSection({
  title,
  body,
  delay = 0,
}: {
  title: string;
  body?: string;
  delay?: number;
}) {
  if (!body?.trim()) return null;
  return (
    <Reveal delay={delay}>
      <div className="glass-card p-6 md:p-8 h-full">
        <h2 className="font-display text-base md:text-lg font-bold text-gold-2 tracking-wide uppercase">
          {title}
        </h2>
        <p className="text-sm text-gray-300 mt-3 leading-relaxed whitespace-pre-line">
          {body}
        </p>
      </div>
    </Reveal>
  );
}

export default function KitProductPage({
  product,
  related,
}: {
  product: AffiliateProduct;
  related: AffiliateProduct[];
}) {
  const gallery = [productImage(product), ...product.gallery_images];
  const [activeImage, setActiveImage] = useState(0);
  const hasGallery = product.gallery_images.length > 0;
  const c = product.content;
  const tags = parseTags(product.tags).slice(0, 6);

  return (
    <div className={`${CONTAINER} py-8 md:py-14`}>
      {/* Breadcrumbs */}
      <nav className="text-xs text-gray-500 mb-8" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-gold-2">Home</Link>
        <span className="mx-2">›</span>
        <Link href="/kit" className="hover:text-gold-2">7FC Kit</Link>
        <span className="mx-2">›</span>
        <span className="text-gray-300">{product.short_title || product.title}</span>
      </nav>

      {/* Hero */}
      <div className="grid md:grid-cols-2 gap-10 lg:gap-16">
        <div>
          <div className="glass-card overflow-hidden">
            <KitImage
              src={gallery[activeImage] ?? productImage(product)}
              alt={product.image_alt || product.title}
              className="w-full aspect-[3/2] object-cover"
              eager
            />
          </div>
          {hasGallery && (
            <div className="flex gap-3 mt-4">
              {gallery.map((src, i) => (
                <button
                  key={`${src}-${i}`}
                  onClick={() => setActiveImage(i)}
                  aria-label={`View image ${i + 1} of ${product.title}`}
                  className={`w-16 h-16 rounded overflow-hidden border transition-colors ${
                    i === activeImage ? "border-gold" : "border-gold/20 hover:border-gold/50"
                  }`}
                >
                  <KitImage src={src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
          <ProductImageWarning />
          {product.image_disclaimer && (
            <p className="text-[11px] text-gray-500 mt-3 leading-relaxed">
              {product.image_disclaimer}
            </p>
          )}
        </div>

        <div>
          {product.eyebrow && (
            <p className="text-xs tracking-[0.3em] uppercase text-electric">
              {product.eyebrow}
            </p>
          )}
          <h1 className="font-display text-2xl md:text-4xl font-bold gold-text mt-3 leading-tight">
            {product.h1 || product.title}
          </h1>
          <p className="text-gray-300 mt-5 leading-relaxed">{product.description}</p>

          {tags.length > 0 && (
            <ul className="flex flex-wrap gap-2 mt-5" aria-label="Product tags">
              {tags.map((t) => (
                <li
                  key={t}
                  className="text-[10px] tracking-[0.15em] uppercase text-gold-2/80 border border-gold/25 rounded-full px-3 py-1"
                >
                  {t}
                </li>
              ))}
            </ul>
          )}

          <a
            href={product.affiliate_url}
            target="_blank"
            rel="sponsored nofollow noopener"
            onClick={() => trackClick(product.id)}
            className="cta-gold-glow mt-8 block w-full text-center bg-gradient-to-b from-gold to-gold/70 text-navy font-bold tracking-[0.15em] uppercase text-sm px-6 py-4 rounded"
          >
            {product.button_text || "Check Current Price on Amazon"} ↗
          </a>
          <AffiliateDisclosure text={product.affiliate_disclosure} />
        </div>
      </div>

      {/* Editorial sections */}
      <div className="mt-14 space-y-6">
        <EditorialSection title="Why It Made the 7FC Kit" body={c.why_7fc} />
        <EditorialSection title="Product Overview" body={c.overview} />
        <EditorialSection title="What Makes It Interesting" body={c.interesting} />
        <div className="grid md:grid-cols-2 gap-6">
          <EditorialSection title="Best For" body={c.best_for} />
          <EditorialSection title="How to Use or Display" body={c.how_to_use} delay={80} />
        </div>
        <EditorialSection title="Gift Occasions" body={c.gift_occasions} />
        <EditorialSection title="What to Check Before Buying" body={c.what_to_check} />
        <EditorialSection title="7FC Editorial Verdict" body={c.verdict} />
      </div>

      {/* FAQ */}
      {product.faqs.length > 0 && (
        <Reveal className="mt-10">
          <div className="glass-card p-6 md:p-8">
            <h2 className="font-display text-base md:text-lg font-bold text-gold-2 tracking-wide uppercase">
              FAQ
            </h2>
            <div className="grid sm:grid-cols-2 gap-6 mt-6">
              {product.faqs.map((f) => (
                <div key={f.question}>
                  <h3 className="text-sm font-bold text-white">{f.question}</h3>
                  <p className="text-xs text-gray-400 mt-2 leading-relaxed">{f.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      )}

      {/* Related picks — hidden entirely when no other active products exist */}
      {related.length > 0 && (
        <Reveal className="mt-10">
          <div className="glass-card p-6 md:p-8">
            <h2 className="font-display text-base md:text-lg font-bold text-gold-2 tracking-wide uppercase">
              Related 7FC Kit Picks
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-6">
              {related.map((p) => (
                <RelatedCard key={p.id} p={p} />
              ))}
            </div>
            <p className="text-center mt-8">
              <Link
                href="/kit"
                className="text-xs tracking-[0.2em] uppercase text-gold-2 hover:text-gold underline underline-offset-4"
              >
                Explore the Full 7FC Kit
              </Link>
            </p>
          </div>
        </Reveal>
      )}

      {/* Legal disclaimer */}
      {product.legal_disclaimer && (
        <p className="text-[11px] text-gray-600 mt-10 max-w-4xl mx-auto text-center leading-relaxed">
          {product.legal_disclaimer}
        </p>
      )}
    </div>
  );
}
