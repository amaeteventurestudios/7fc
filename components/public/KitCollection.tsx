"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CONTAINER, Reveal } from "./ui";
import { KitImage } from "./KitProductPage";
import { CollectionImageNotice, EditorialImageBadge } from "./KitDisclosure";
import { productImage, productSlug } from "@/lib/kit";
import type { AffiliateProduct } from "@/lib/types";

export default function KitCollection({
  products,
  disclosure,
}: {
  products: AffiliateProduct[];
  disclosure: string;
}) {
  const categories = useMemo(
    () => [...new Set(products.map((p) => p.category).filter(Boolean))],
    [products]
  );
  const [filter, setFilter] = useState<string>("All");
  const shown =
    filter === "All" ? products : products.filter((p) => p.category === filter);

  return (
    <div className={`${CONTAINER} py-10 md:py-16`}>
      {/* Hero */}
      <div className="text-center max-w-3xl mx-auto">
        <p className="text-xs md:text-sm tracking-[0.3em] uppercase text-electric/80">
          Collectibles · Training · Fan Culture
        </p>
        <h1 className="font-display text-3xl md:text-6xl font-bold tracking-wide gold-text mt-4">
          The 7FC Kit
        </h1>
        <div className="mx-auto mt-6 h-px w-32 md:w-48 bg-gradient-to-r from-transparent via-gold to-transparent" />
        <p className="text-sm md:text-base text-gray-300 mt-6 leading-relaxed">
          A curated collection of football collectibles, fragrance, fan display
          pieces, apparel, and training gear inspired by the standard behind the
          number 7. Every pick links to its own 7FC page with an honest
          editorial breakdown — what it is, who it suits, and what to verify on
          the retailer listing before you buy.
        </p>
        <p className="text-[11px] md:text-xs text-gray-500 mt-4">{disclosure}</p>
      </div>

      {/* Category filters */}
      <div
        className="flex flex-wrap justify-center gap-2 mt-10"
        role="group"
        aria-label="Filter products by category"
      >
        {["All", ...categories].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            aria-pressed={filter === cat}
            className={`text-[11px] tracking-[0.15em] uppercase px-4 py-2 rounded-full border transition-colors ${
              filter === cat
                ? "border-gold bg-gold/15 text-gold-2"
                : "border-gold/25 text-gray-400 hover:border-gold/60 hover:text-gold-2"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <CollectionImageNotice />

      {/* Product grid */}
      <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {shown.map((p, i) => (
          <Reveal key={p.id} delay={Math.min(i, 5) * 60}>
            <div className="glass-card h-full overflow-hidden text-center flex flex-col hover:border-gold/50 transition-colors">
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
              <div className="p-5 flex flex-col flex-1">
                <p className="text-[10px] tracking-[0.25em] uppercase text-electric">
                  {p.category}
                </p>
                <h2 className="font-display text-base font-bold text-gold-2 mt-1">
                  {p.short_title || p.title}
                </h2>
                <p className="text-xs text-gray-400 mt-2 flex-1 leading-relaxed">
                  {p.description}
                </p>
                <Link
                  href={`/kit/${productSlug(p)}`}
                  className="cta-gold-glow mt-5 inline-block border border-gold/60 text-gold-2 text-xs font-bold tracking-widest uppercase px-6 py-2.5 rounded mx-auto"
                >
                  View Product
                </Link>
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      {/* Internal links to major sections */}
      <div className="text-center mt-14 space-y-3">
        <p className="text-sm text-gray-400">
          More from 7FC:{" "}
          <Link href="/wall" className="text-gold-2 hover:text-gold underline underline-offset-4">
            Visit the Global Supporter Wall
          </Link>
          {" · "}
          <Link href="/journey" className="text-gold-2 hover:text-gold underline underline-offset-4">
            Explore the Journey
          </Link>
          {" · "}
          <Link href="/records" className="text-gold-2 hover:text-gold underline underline-offset-4">
            View the Record Wall
          </Link>
        </p>
      </div>
    </div>
  );
}
