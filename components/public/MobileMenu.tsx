"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { PRIMARY_NAV as LINKS } from "@/lib/site";

/**
 * Floating mobile navigation: a fixed bottom-center glass pill that opens a
 * full menu panel. Hidden on md+ where the desktop nav is used.
 */
export default function MobileMenu() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Prevent background scroll while the panel is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <div className="md:hidden">
      {/* Floating pill button */}
      <button
        type="button"
        aria-label="Open menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2.5 rounded-full border border-gold/60 bg-navy/85 backdrop-blur px-6 py-3 shadow-[0_0_24px_rgba(212,175,94,0.35)] transition-opacity ${
          open ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        <span className="font-display text-sm font-black gold-text">7FC</span>
        <span className="text-[10px] tracking-[0.25em] uppercase text-gold-2">Menu</span>
        <span aria-hidden className="text-gold-2 text-xs">☰</span>
      </button>

      {/* Menu panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        className={`fixed inset-0 z-[70] transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div
          className="absolute inset-0 bg-night/80 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          aria-hidden
        />
        <div
          className={`absolute bottom-0 left-0 right-0 rounded-t-2xl border-t border-x border-gold/40 bg-navy/95 backdrop-blur px-6 pt-6 pb-8 shadow-[0_-8px_40px_rgba(212,175,94,0.15)] transition-transform duration-300 ${
            open ? "translate-y-0" : "translate-y-full"
          }`}
        >
          <div className="flex items-center justify-between mb-5">
            <span className="font-display text-lg font-black gold-text">7FC</span>
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="w-9 h-9 rounded-full border border-gold/40 text-gold-2 text-sm flex items-center justify-center"
            >
              ✕
            </button>
          </div>
          <nav className="grid grid-cols-2 gap-2.5">
            {LINKS.map(([label, href]) => {
              const active = href === "/wall" && pathname === "/wall";
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={`text-center text-xs tracking-[0.2em] uppercase rounded-lg border px-3 py-3.5 transition-colors ${
                    active
                      ? "border-gold bg-gold/15 text-gold-2"
                      : "border-gold/20 text-gray-300 hover:border-gold/50"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
          <Link
            href="/#wall"
            onClick={() => setOpen(false)}
            className="cta-glow block mt-4 bg-crimson text-white text-center font-bold tracking-widest uppercase text-sm px-6 py-3.5 rounded-lg"
          >
            Raise Your 7
          </Link>
        </div>
      </div>
    </div>
  );
}
