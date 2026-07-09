"use client";

import { Reveal, SectionTitle, PlaceholderImg, CONTAINER } from "./ui";
import type { AffiliateProduct, LegalDisclaimers } from "@/lib/types";

export function KitSection({
  products,
  disclosure,
}: {
  products: AffiliateProduct[];
  disclosure: string;
}) {
  function trackClick(id: string) {
    // fire-and-forget click counter
    fetch("/api/kit/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: id }),
      keepalive: true,
    }).catch(() => {});
  }
  return (
    <section id="kit" className="py-16 md:py-28 border-t border-gold/15">
      <div className={CONTAINER}>
        <SectionTitle>The 7FC Kit</SectionTitle>
        <p className="text-center text-sm md:text-lg text-gray-300 max-w-2xl mx-auto">
          Books, training tools, recovery gear, and football essentials for
          fans of greatness.
        </p>
        <p className="text-center text-[11px] md:text-xs text-gray-500 mt-3">{disclosure}</p>
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-5">
          {products.map((p, i) => (
            <Reveal key={p.id} delay={i * 60}>
              <div className="glass-card h-full overflow-hidden text-center flex flex-col hover:border-gold/50 transition-colors">
                <PlaceholderImg
                  src={p.image_path}
                  alt={`${p.title} — product category placeholder`}
                  className="w-full aspect-[3/2] object-cover"
                  label={p.title}
                />
                <div className="p-5 flex flex-col flex-1">
                  <p className="text-[10px] tracking-[0.25em] uppercase text-electric">
                    {p.category}
                  </p>
                  <h3 className="font-display text-sm font-bold text-gold-2 mt-1">
                    {p.title}
                  </h3>
                  <p className="text-xs text-gray-400 mt-2 flex-1">{p.description}</p>
                  <a
                    href={p.affiliate_url}
                    target="_blank"
                    rel="nofollow sponsored noopener"
                    onClick={() => trackClick(p.id)}
                    className="cta-gold-glow mt-4 inline-block border border-gold/60 text-gold-2 text-xs font-bold tracking-widest uppercase px-6 py-2.5 rounded mx-auto"
                  >
                    {p.button_text}
                  </a>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const FAQ = [
  {
    q: "Is 7FC official?",
    a: "No. 7FC is an independent, unofficial fan tribute and football culture site.",
  },
  {
    q: "Is this site affiliated with Cristiano Ronaldo?",
    a: "No. This site is not affiliated with, endorsed by, sponsored by, or connected to Cristiano Ronaldo, CR7, any club, federation, sponsor, or official brand.",
  },
  { q: "Is my email public?", a: "No. Your email stays private." },
  {
    q: "Can I hide my full name?",
    a: "Yes. You can appear as first name and country only.",
  },
  {
    q: "What is the Global 7 Wall?",
    a: "A fan roll call for supporters who believe the number 7 legacy deserves to be remembered.",
  },
];

export function SiteFooter({ legal }: { legal: LegalDisclaimers }) {
  return (
    <footer className="border-t border-gold/15 py-10 px-4 text-center">
      <p className="font-display text-2xl font-black gold-text">7FC</p>
      <p className="text-[10px] tracking-[0.35em] uppercase text-gold/60 mt-1">Seven FC</p>
      <p className="text-xs text-gray-400 mt-4">
        This is for the fans. This is for the legacy.
      </p>
      {/* Social: X only — no Instagram/Facebook/YouTube/TikTok.
          TODO: replace href="#" with the real 7FC X profile URL when available. */}
      <a
        href="#"
        aria-label="7FC on X"
        className="inline-flex items-center justify-center mt-5 w-9 h-9 rounded-full border border-gold/40 text-gold-2 text-sm hover:border-gold transition-colors"
      >
        𝕏
      </a>
      <p className="text-[10px] text-gray-600 mt-4 max-w-3xl mx-auto leading-relaxed">
        {legal.footer_disclaimer}
      </p>
      <p className="text-[10px] text-gray-600 mt-3">
        © {new Date().getFullYear()} SevenFC.net · All rights reserved.
      </p>
    </footer>
  );
}

export function AboutFaqFooter({ legal }: { legal: LegalDisclaimers }) {
  return (
    <>
      <section id="about" className="section-glow py-16 md:py-28 border-t border-gold/15">
        <div className={`${CONTAINER} grid md:grid-cols-3 gap-6 lg:gap-8`}>
          <Reveal>
            <div className="glass-card h-full p-6 text-center md:text-left">
              <h3 className="font-display text-lg font-bold gold-text text-center">About 7FC</h3>
              <p className="text-sm text-gray-300 mt-4 leading-relaxed">
                7FC (Seven FC) is an independent, unofficial fan tribute and
                football culture site celebrating the legacy, records, and
                moments of Cristiano Ronaldo.
              </p>
              <p className="text-sm text-gold-2 mt-4 font-semibold text-center">
                This is for the fans. This is for the legacy.
              </p>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <div className="glass-card h-full p-6">
              <h3 className="font-display text-lg font-bold gold-text text-center">FAQ</h3>
              <dl className="mt-4 space-y-4">
                {FAQ.map((f) => (
                  <div key={f.q} className="text-center md:text-left">
                    <dt className="text-xs font-bold text-gold-2">Q: {f.q}</dt>
                    <dd className="text-xs text-gray-400 mt-1 leading-relaxed">A: {f.a}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </Reveal>
          <Reveal delay={200}>
            <div className="glass-card h-full p-6 text-center md:text-left">
              <h3 className="font-display text-lg font-bold gold-text text-center">Disclaimer</h3>
              <p className="text-xs text-gray-400 mt-4 leading-relaxed">{legal.footer_disclaimer}</p>
              <p className="text-xs text-gray-500 mt-4 leading-relaxed">{legal.privacy_note}</p>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">{legal.product_note}</p>
            </div>
          </Reveal>
        </div>
      </section>
      <SiteFooter legal={legal} />
    </>
  );
}
