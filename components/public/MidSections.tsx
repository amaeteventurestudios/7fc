"use client";

import { Reveal, SectionTitle, CountUp, PlaceholderImg, CONTAINER } from "./ui";
import { useEra } from "./EraContext";
import type { Era } from "@/lib/types";

const JOURNEY = [
  { name: "Sporting", years: "2002 – 2003", copy: "The beginning of a dream.", img: "/images/7fc-era-sporting.webp" },
  { name: "Manchester United", years: "2003 – 2009 · 2021 – 2022", copy: "The rise. Trophies. Greatness.", img: "/images/7fc-era-manchester.webp" },
  { name: "Real Madrid", years: "2009 – 2018", copy: "Records broken. History made. Legacy secured.", img: "/images/7fc-era-madrid.webp" },
  { name: "Juventus", years: "2018 – 2021", copy: "New chapter. Same hunger.", img: "/images/7fc-era-juventus.webp" },
  { name: "Al Nassr", years: "2023 –", copy: "New challenge. New energy.", img: "/images/7fc-era-al-nassr.webp" },
  { name: "Portugal", years: "2003 –", copy: "One nation. Forever pride.", img: "/images/7fc-era-portugal.webp" },
];

export function Journey() {
  return (
    <section id="journey" className="section-glow py-16 md:py-28 border-t border-gold/10">
      <div className={CONTAINER}>
        <SectionTitle>The Journey</SectionTitle>
        <div className="relative flex flex-col md:flex-row md:justify-between gap-10 md:gap-4">
          <div
            className="absolute md:top-16 md:left-0 md:right-0 md:h-px md:w-full top-0 bottom-0 left-1/2 w-px bg-gradient-to-b md:bg-gradient-to-r from-transparent via-gold/50 to-transparent"
            aria-hidden
          />
          {JOURNEY.map((j, i) => (
            <Reveal key={j.name} delay={i * 100} className="relative md:flex-1">
              <div className="flex flex-col items-center text-center px-2">
                <PlaceholderImg
                  src={j.img}
                  alt={`Generic tribute crest for the ${j.name} era`}
                  className="w-20 h-20 md:w-28 md:h-28 rounded-full border-2 border-gold/40 object-cover shadow-[0_0_20px_rgba(212,175,94,0.15)]"
                  label={j.name}
                />
                <span className="pulse-node mt-4 block w-3.5 h-3.5 rounded-full bg-gold" aria-hidden />
                <h3 className="mt-4 font-display text-sm md:text-base font-bold tracking-[0.12em] uppercase text-gold-2">
                  {j.name}
                </h3>
                <p className="text-xs md:text-sm text-electric mt-1.5">{j.years}</p>
                <p className="text-xs md:text-sm text-gray-400 mt-1.5 leading-snug max-w-[220px]">
                  {j.copy}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
        <p className="text-center text-[10px] md:text-xs text-gray-500 mt-10">
          Crest icons are generic placeholders. No official club or federation logos are used.
        </p>
      </div>
    </section>
  );
}

const ERA_CARDS: Array<{ era: Era; img: string; tagline: string }> = [
  { era: "Sporting Era", img: "/images/7fc-choice-sporting-era.webp", tagline: "The beginning." },
  { era: "Manchester Era", img: "/images/7fc-choice-manchester-era.webp", tagline: "The rise." },
  { era: "Madrid Era", img: "/images/7fc-choice-madrid-era.webp", tagline: "The machine." },
  { era: "Juventus Era", img: "/images/7fc-choice-juventus-era.webp", tagline: "The new chapter." },
  { era: "Al Nassr Era", img: "/images/7fc-choice-al-nassr-era.webp", tagline: "The global move." },
  { era: "Portugal Era", img: "/images/7fc-choice-portugal-era.webp", tagline: "The nation." },
  { era: "All Eras", img: "/images/7fc-choice-all-eras.webp", tagline: "The full legacy." },
];

export function ChooseEra() {
  const { selectedEra, setSelectedEra } = useEra();
  return (
    <section id="eras" className="py-16 md:py-28 border-t border-gold/10">
      <div className={CONTAINER}>
        <SectionTitle kicker="Pick the chapter that made you believe">
          Choose Your Era
        </SectionTitle>
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-4 md:gap-5">
          {ERA_CARDS.map((c, i) => {
            const selected = selectedEra === c.era;
            return (
              <Reveal key={c.era} delay={i * 60}>
                <button
                  type="button"
                  onClick={() => setSelectedEra(selected ? null : c.era)}
                  aria-pressed={selected}
                  className={`glass-card w-full overflow-hidden text-center transition-all ${
                    selected
                      ? "border-gold shadow-[0_0_28px_rgba(212,175,94,0.5)]"
                      : "hover:border-gold/50 hover:shadow-[0_0_18px_rgba(212,175,94,0.15)]"
                  }`}
                >
                  <PlaceholderImg
                    src={c.img}
                    alt={`Generic number 7 player card for the ${c.era}`}
                    className="w-full aspect-[4/3] object-cover"
                    label={c.era}
                  />
                  <div className="p-4 md:p-5">
                    <h3 className="font-display text-xs md:text-sm font-bold tracking-widest uppercase text-gold-2">
                      {c.era}
                    </h3>
                    <p className="text-[11px] md:text-xs text-gray-400 mt-1.5">{c.tagline}</p>
                  </div>
                </button>
              </Reveal>
            );
          })}
        </div>
        <p className="text-center text-xs md:text-sm text-gray-500 mt-8">
          {selectedEra
            ? `Selected: ${selectedEra} — it will prefill your Global 7 Wall entry below.`
            : "Tap an era to select it."}
        </p>
      </div>
    </section>
  );
}

const MOMENTS = [
  { title: "Champions League Nights", copy: "The stage he owned.", img: "/images/7fc-moment-champions-league-nights.webp" },
  { title: "All-Time Top Scorer", copy: "Records are made to be broken.", img: "/images/7fc-moment-all-time-scorer.webp" },
  { title: "Ballon d'Or Legend", copy: "Among the elite. Above the rest.", img: "/images/7fc-moment-ballon-dor-legend.webp" },
  { title: "Unforgettable Goals", copy: "Impossible made iconic.", img: "/images/7fc-moment-unforgettable-goals.webp" },
  { title: "Major Titles Collected", copy: "Winning is a habit. Not a moment.", img: "/images/7fc-moment-major-titles.webp" },
];

export function Moments() {
  return (
    <section id="moments" className="section-glow py-16 md:py-28 border-t border-gold/10">
      <div className={CONTAINER}>
        <SectionTitle>7FC Moments</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {MOMENTS.map((m, i) => (
            <Reveal key={m.title} delay={i * 80}>
              <div className="glass-card h-full overflow-hidden text-center hover:border-gold/60 hover:shadow-[0_0_24px_rgba(212,175,94,0.15)] transition-all">
                <PlaceholderImg
                  src={m.img}
                  alt={`Cinematic placeholder for ${m.title}`}
                  className="w-full aspect-[4/3] object-cover"
                  label={m.title}
                />
                <div className="p-5 md:p-6">
                  <h3 className="font-display text-sm md:text-base font-bold tracking-[0.12em] uppercase text-gold-2">
                    {m.title}
                  </h3>
                  <p className="text-xs md:text-sm text-gray-400 mt-2.5">{m.copy}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Configurable placeholder milestones — update values as they are verified. */
const RECORDS = [
  { value: 140, suffix: "+", top: "Champions League", label: "Goals" },
  { value: 130, suffix: "+", top: "International", label: "Goals" },
  { value: 880, suffix: "+", top: "Career", label: "Goals" },
  { value: 60, suffix: "+", top: "Hat-Tricks", label: "Hat-Tricks" },
  { value: 34, suffix: "+", top: "Major Trophies", label: "Trophies" },
  { value: 20, suffix: "+", top: "Years at Elite Level", label: "Years" },
  { value: 5, suffix: "", top: "Clubs", label: "Clubs" },
  { value: 100, suffix: "+", top: "Countries Inspired", label: "Countries" },
];

export function RecordWall() {
  return (
    <section id="records" className="py-16 md:py-28 border-t border-gold/10">
      <div className={CONTAINER}>
        <SectionTitle kicker="The receipts">The Record Wall</SectionTitle>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {RECORDS.map((r, i) => (
            <Reveal key={r.top} delay={i * 70}>
              <div className="glass-card h-full p-6 md:p-10 text-center hover:border-gold/50 transition-colors">
                <p className="text-[10px] md:text-xs tracking-[0.2em] uppercase text-gray-400">{r.top}</p>
                <p className="font-display text-3xl md:text-5xl font-bold gold-text mt-3">
                  <CountUp target={r.value} suffix={r.suffix} />
                </p>
                <p className="text-[10px] md:text-xs tracking-[0.2em] uppercase text-electric mt-2">
                  {r.label}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
        <p className="text-center text-[10px] md:text-xs text-gray-500 mt-8">
          Figures are approximate fan-tracked milestones and are updated over time.
        </p>
      </div>
    </section>
  );
}

export function QuoteBanner() {
  return (
    <section className="relative overflow-hidden border-y border-gold/20">
      <div
        className="absolute inset-0 opacity-30 bg-cover bg-center"
        style={{ backgroundImage: "url(/images/7fc-quote-banner-player.webp)" }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-gradient-to-r from-night via-navy/80 to-night" aria-hidden />
      <div className="light-sweep" aria-hidden />
      <div className="relative mx-auto max-w-5xl px-4 py-20 md:py-32 text-center">
        <span className="font-display text-5xl md:text-7xl gold-text leading-none" aria-hidden>
          &ldquo;
        </span>
        <p className="font-display text-2xl md:text-5xl text-white font-bold tracking-wide leading-snug">
          Talent opens the door.
          <br />
          Discipline owns the room.
        </p>
        <p className="mt-6 text-crimson text-xs md:text-base tracking-[0.35em] uppercase font-semibold">
          Focus. Work. Believe. Repeat.
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/7fc-signature-mark.webp"
          alt="Abstract gold signature-style decorative mark"
          className="mx-auto mt-8 w-32 md:w-48 opacity-70"
        />
      </div>
    </section>
  );
}
