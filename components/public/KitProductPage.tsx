"use client";

import { useState } from "react";
import Link from "next/link";
import { CONTAINER, Reveal } from "./ui";
import { KIT_FALLBACK_IMAGE, productImage, productSlug } from "@/lib/kit";
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
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={failed ? KIT_FALLBACK_IMAGE : src}
      alt={alt}
      loading="lazy"
      className={className}
      onError={() => setFailed(true)}
    />
  );
}

function Check() {
  return <span className="text-gold-2 mr-2 shrink-0">✓</span>;
}

const BENEFITS = [
  { icon: "🎁", title: "Perfect Gift", text: "For football fans of all ages" },
  { icon: "🏠", title: "Display Ready", text: "Looks great on shelves or desks" },
  { icon: "📦", title: "Collectible", text: "A must-have for football lovers" },
];

const FAQ = [
  {
    q: "Is this an official football product?",
    a: "No. This is an unofficial fan-favorite pick inspired by the legacy of No.7. It is not affiliated with any player, club, or official brand.",
  },
  {
    q: "Where does this pick ship from?",
    a: "This pick is fulfilled through Amazon. Shipping times and availability depend on the Amazon listing.",
  },
  {
    q: "Why is it in the 7FC Kit?",
    a: "Every pick in the 7FC Kit earns its place by supporting the standard: work, discipline, recovery, and the No.7 mindset.",
  },
  {
    q: "How do I check the current price?",
    a: "Prices change on Amazon. Tap the View on Amazon button to see the latest price, reviews, and availability.",
  },
];

function RelatedCard({ p }: { p: AffiliateProduct }) {
  return (
    <div className="glass-card overflow-hidden text-center flex flex-col hover:border-gold/50 transition-colors h-full">
      <KitImage
        src={productImage(p)}
        alt={p.title}
        className="w-full aspect-[3/2] object-cover"
      />
      <div className="p-4 flex flex-col flex-1">
        <p className="text-[10px] tracking-[0.25em] uppercase text-electric">
          {p.category}
        </p>
        <h3 className="font-display text-sm font-bold text-gold-2 mt-1 flex-1">
          {p.title}
        </h3>
        <Link
          href={`/kit/${productSlug(p)}`}
          className="mt-4 inline-block border border-gold/60 text-gold-2 text-[11px] font-bold tracking-widest uppercase px-5 py-2 rounded mx-auto hover:bg-gold/10 transition-colors"
        >
          View Pick
        </Link>
      </div>
    </div>
  );
}

export default function KitProductPage({
  product,
  related,
  disclosure,
}: {
  product: AffiliateProduct;
  related: AffiliateProduct[];
  disclosure: string;
}) {
  const gallery = [productImage(product), ...product.gallery_images];
  const [activeImage, setActiveImage] = useState(0);
  const hasGallery = product.gallery_images.length > 0;

  return (
    <div className={`${CONTAINER} py-8 md:py-14`}>
      {/* Breadcrumb */}
      <nav className="text-xs text-gray-500 mb-8" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-gold-2">Home</Link>
        <span className="mx-2">›</span>
        <Link href="/#kit" className="hover:text-gold-2">7FC Kit</Link>
        <span className="mx-2">›</span>
        <span className="text-gray-300">{product.title}</span>
      </nav>

      {/* Top: image + summary */}
      <div className="grid md:grid-cols-2 gap-10 lg:gap-16">
        <div>
          <div className="glass-card overflow-hidden">
            <KitImage
              src={gallery[activeImage] ?? productImage(product)}
              alt={product.title}
              className="w-full aspect-square object-cover"
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
        </div>

        <div>
          <p className="text-xs tracking-[0.3em] uppercase text-electric">
            {product.category}
          </p>
          <h1 className="font-display text-3xl md:text-4xl font-bold gold-text mt-3">
            {product.title}
          </h1>
          <p className="text-gray-300 mt-5 leading-relaxed">{product.description}</p>

          <div className="grid grid-cols-3 gap-4 border-y border-gold/15 mt-8 py-6 text-center">
            {BENEFITS.map((b) => (
              <div key={b.title}>
                <div className="text-2xl" aria-hidden>{b.icon}</div>
                <p className="text-xs font-bold text-white mt-2">{b.title}</p>
                <p className="text-[11px] text-gray-400 mt-1">{b.text}</p>
              </div>
            ))}
          </div>

          <a
            href={product.affiliate_url}
            target="_blank"
            rel="nofollow sponsored noopener"
            onClick={() => trackClick(product.id)}
            className="cta-gold-glow mt-8 block w-full text-center bg-gradient-to-b from-gold to-gold/70 text-navy font-bold tracking-[0.2em] uppercase text-sm px-8 py-4 rounded"
          >
            {product.button_text || "View on Amazon"} ↗
          </a>
          <p className="text-center text-[11px] text-gray-500 mt-4">{disclosure}</p>
        </div>
      </div>

      {/* Why it's in the 7FC Kit */}
      <Reveal className="mt-14">
        <div className="glass-card p-6 md:p-8">
          <h2 className="font-display text-lg md:text-xl font-bold text-gold-2 tracking-wide uppercase">
            Why it&apos;s in the 7FC Kit
          </h2>
          <p className="text-sm text-gray-300 mt-3 max-w-4xl leading-relaxed">
            The number 7 represents more than goals. It&apos;s about responsibility,
            pressure, leadership, and delivering when it matters most. This pick is in
            the 7FC Kit because it supports the standard we all chase — on the pitch,
            in training, and in the mindset.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
            {[
              {
                h: "Who it's for",
                items: [
                  "Football fans and players",
                  "Kids, teens, and adults",
                  "Anyone chasing the standard",
                  "Anyone who lives the No.7 mindset",
                ],
              },
              {
                h: "Why you'll love it",
                items: [
                  `A quality ${product.category.toLowerCase()} pick`,
                  "Chosen for fans of greatness",
                  "Supports the daily work",
                  "Built for repeat use",
                ],
              },
              {
                h: "What to check",
                items: [
                  "Sizing and product options",
                  "Latest reviews on Amazon",
                  "Contents of the listing",
                  "Unofficial fan-favorite pick",
                ],
              },
              {
                h: "7FC buying notes",
                items: [
                  "Ships from Amazon",
                  "Easy returns where eligible",
                  "Check latest price on Amazon",
                  "Limited availability at times",
                ],
              },
            ].map((col) => (
              <div key={col.h} className="border border-gold/10 rounded p-4 bg-navy-2/40">
                <h3 className="text-[11px] tracking-[0.25em] uppercase text-electric font-bold">
                  {col.h}
                </h3>
                <ul className="mt-3 space-y-2 text-xs text-gray-300">
                  {col.items.map((item) => (
                    <li key={item} className="flex">
                      <Check />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      {/* FAQ */}
      <Reveal className="mt-10">
        <div className="glass-card p-6 md:p-8">
          <h2 className="font-display text-lg md:text-xl font-bold text-gold-2 tracking-wide uppercase">
            FAQ
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
            {FAQ.map((f) => (
              <div key={f.q}>
                <p className="text-xs font-bold text-white">{f.q}</p>
                <p className="text-xs text-gray-400 mt-2 leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      {/* Related picks — hidden entirely when no other active products exist */}
      {related.length > 0 && (
        <Reveal className="mt-10">
          <div className="glass-card p-6 md:p-8">
            <h2 className="font-display text-lg md:text-xl font-bold text-gold-2 tracking-wide uppercase">
              Related 7FC Kit Picks
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-6">
              {related.map((p) => (
                <RelatedCard key={p.id} p={p} />
              ))}
            </div>
          </div>
        </Reveal>
      )}
    </div>
  );
}
