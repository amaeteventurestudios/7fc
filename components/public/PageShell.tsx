import type { ReactNode } from "react";
import { getStore } from "@/lib/data";
import { DisclaimerBar, Nav } from "./TopSections";
import { SiteFooter } from "./BottomSections";
import { CONTAINER } from "./ui";

/**
 * Standard shell for standalone pages (contact, legal, privacy tools):
 * disclaimer bar + nav + centered title block + long-form content + footer.
 */
export default async function PageShell({
  kicker,
  title,
  intro,
  children,
  wide = false,
}: {
  kicker?: string;
  title: string;
  intro?: string;
  children: ReactNode;
  wide?: boolean;
}) {
  const store = await getStore();
  const legal = await store.getLegal();
  return (
    <>
      <DisclaimerBar text={legal.top_disclaimer} />
      <Nav />
      <main id="main-content">
        <div className={`${CONTAINER} py-12 md:py-20`}>
          <header className="text-center max-w-3xl mx-auto">
            {kicker && (
              <p className="text-xs md:text-sm tracking-[0.3em] uppercase text-electric/80">
                {kicker}
              </p>
            )}
            <h1 className="font-display text-3xl md:text-5xl font-bold tracking-wide gold-text mt-3">
              {title}
            </h1>
            <div className="mx-auto mt-6 h-px w-32 md:w-48 bg-gradient-to-r from-transparent via-gold to-transparent" />
            {intro && (
              <p className="text-sm md:text-base text-gray-300 mt-6 leading-relaxed">
                {intro}
              </p>
            )}
          </header>
          <div className={`${wide ? "max-w-5xl" : "max-w-3xl"} mx-auto mt-10 md:mt-14`}>
            {children}
          </div>
        </div>
      </main>
      <SiteFooter legal={legal} />
    </>
  );
}
