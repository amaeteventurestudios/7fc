import type { ReactNode } from "react";

export interface LegalSection {
  id: string;
  title: string;
  body: ReactNode;
}

/**
 * Long-form legal/policy article: effective dates, table of contents,
 * readable left-aligned sections. Semantic headings, no animation.
 */
export default function LegalArticle({
  effectiveDate,
  lastUpdated,
  sections,
}: {
  effectiveDate?: string;
  lastUpdated?: string;
  sections: LegalSection[];
}) {
  return (
    <article className="text-left">
      {(effectiveDate || lastUpdated) && (
        <p className="text-[11px] tracking-[0.2em] uppercase text-gray-500 text-center">
          {effectiveDate && <>Effective: {effectiveDate}</>}
          {effectiveDate && lastUpdated && " · "}
          {lastUpdated && <>Last updated: {lastUpdated}</>}
        </p>
      )}
      <nav aria-label="Table of contents" className="glass-card p-6 mt-8">
        <h2 className="font-display text-sm font-bold tracking-[0.2em] uppercase text-gold-2">
          Contents
        </h2>
        <ol className="mt-4 grid sm:grid-cols-2 gap-x-6 gap-y-1.5 list-decimal list-inside text-sm">
          {sections.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className="text-gray-300 hover:text-gold-2 underline-offset-4 hover:underline"
              >
                {s.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>
      <div className="mt-10 space-y-10">
        {sections.map((s) => (
          <section key={s.id} id={s.id} className="scroll-mt-24">
            <h2 className="font-display text-lg md:text-xl font-bold text-gold-2 tracking-wide">
              {s.title}
            </h2>
            <div className="mt-3 space-y-3 text-sm md:text-[15px] text-gray-300 leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_a]:text-gold-2 [&_a]:underline [&_a]:underline-offset-2 [&_strong]:text-gray-100">
              {s.body}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}
