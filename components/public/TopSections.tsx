"use client";

import { Reveal, SectionTitle, CountUp, Particles, PlaceholderImg } from "./ui";

export function DisclaimerBar({ text }: { text: string }) {
  return (
    <div className="bg-navy-2 border-b border-gold/20 text-center px-4 py-2">
      <p className="text-[11px] md:text-xs text-gold-2/80 tracking-wide">{text}</p>
    </div>
  );
}

const NAV_LINKS = [
  ["Legacy", "#built-different"],
  ["Journey", "#journey"],
  ["Moments", "#moments"],
  ["Records", "#records"],
  ["Wall", "#wall"],
  ["Kit", "#kit"],
  ["About", "#about"],
] as const;

export function Nav() {
  return (
    <header className="sticky top-0 z-50 bg-night/85 backdrop-blur border-b border-gold/15">
      <div className="mx-auto max-w-6xl flex items-center justify-between px-4 py-3">
        <a href="#top" className="flex items-baseline gap-2">
          <span className="font-display text-xl font-black gold-text">7FC</span>
          <span className="hidden sm:inline text-[10px] tracking-[0.35em] text-gold/70 uppercase">
            Seven FC
          </span>
        </a>
        <nav className="hidden md:flex gap-6 text-xs tracking-[0.2em] uppercase text-gray-300">
          {NAV_LINKS.map(([label, href]) => (
            <a key={href} href={href} className="hover:text-gold-2 transition-colors">
              {label}
            </a>
          ))}
        </nav>
        <a
          href="#wall"
          className="cta-glow bg-crimson text-white text-xs font-bold tracking-widest uppercase px-4 py-2 rounded"
        >
          Raise Your 7
        </a>
      </div>
    </header>
  );
}

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden text-center">
      <div className="absolute inset-0 atmosphere" aria-hidden />
      <div
        className="absolute inset-0 opacity-40 bg-cover bg-center"
        style={{ backgroundImage: "url(/images/7fc-hero-stadium-bg.webp)" }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-gradient-to-b from-night/40 via-night/60 to-night" aria-hidden />
      <div className="light-sweep" aria-hidden />
      <Particles />
      <div className="relative mx-auto max-w-4xl px-4 pt-16 pb-20 md:pt-28 md:pb-32 flex flex-col items-center">
        <p className="text-xs tracking-[0.4em] uppercase text-electric mb-4">
          Discipline. Standards. Greatness.
        </p>
        <h1 className="font-display font-black gold-text text-6xl md:text-8xl leading-none">
          7FC
        </h1>
        <p className="font-display tracking-[0.5em] text-gold-2 text-sm md:text-lg mt-2 uppercase">
          Seven FC
        </p>
        <h2 className="font-display text-xl md:text-3xl text-white mt-6 tracking-wide">
          The CR7 Legacy. Forever 7.
        </h2>
        <p className="mt-4 max-w-xl text-sm md:text-base text-gray-300">
          A global fan tribute to discipline, longevity, records, pressure,
          reinvention, and the standard of the number 7.
        </p>
        <PlaceholderImg
          src="/images/7fc-hero-player.webp"
          alt="Back view of a generic number 7 football player under stadium lights"
          className="mt-8 w-40 md:w-56 rounded-lg opacity-90"
          label="Hero player placeholder"
        />
        <PlaceholderImg
          src="/images/7fc-signature-mark.webp"
          alt="Abstract gold signature-style decorative mark"
          className="mt-4 w-32 md:w-44 opacity-80"
          label="Signature mark placeholder"
        />
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="#wall"
            className="cta-glow bg-crimson text-white font-bold tracking-widest uppercase text-sm px-8 py-3 rounded"
          >
            Raise Your 7
          </a>
          <a
            href="#supporters"
            className="cta-gold-glow border border-gold/60 text-gold-2 font-semibold tracking-widest uppercase text-sm px-8 py-3 rounded"
          >
            See the Global 7 Wall
          </a>
        </div>
      </div>
    </section>
  );
}

const STATS: Array<{ icon: string; value: number; suffix: string; label: string }> = [
  { icon: "⚽", value: 880, suffix: "+", label: "Goals" },
  { icon: "🏆", value: 34, suffix: "+", label: "Trophies" },
  { icon: "🥇", value: 5, suffix: "", label: "Ballon d'Ors" },
  { icon: "👕", value: 5, suffix: "", label: "Clubs" },
];

export function StatsStrip() {
  return (
    <section className="border-y border-gold/15 bg-navy/60">
      <div className="mx-auto max-w-5xl grid grid-cols-2 md:grid-cols-4 gap-px">
        {STATS.map((s) => (
          <div key={s.label} className="text-center py-8 px-2">
            <div className="text-2xl mb-2" aria-hidden>{s.icon}</div>
            <div className="font-display text-3xl md:text-4xl font-bold gold-text">
              <CountUp target={s.value} suffix={s.suffix} />
            </div>
            <div className="text-[11px] tracking-[0.25em] uppercase text-gray-400 mt-1">
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function BuiltDifferent() {
  return (
    <section id="built-different" className="section-glow py-16 md:py-24 px-4">
      <div className="mx-auto max-w-5xl grid md:grid-cols-2 gap-10 items-center">
        <Reveal className="text-center md:text-left">
          <h2 className="font-display text-2xl md:text-3xl font-bold gold-text">
            Built Different
          </h2>
          <p className="text-crimson text-xs tracking-[0.25em] uppercase mt-2">
            Obsession builds legacy.
          </p>
          <p className="mt-5 text-gray-300 text-sm md:text-base leading-relaxed">
            From humble beginnings to global greatness — relentless in pursuit
            of excellence, year after year, decade after decade.
          </p>
          <p className="mt-5 font-display text-lg text-white">
            Not just a player. <span className="gold-text">A standard.</span>
          </p>
          <PlaceholderImg
            src="/images/7fc-built-different-player.webp"
            alt="Cinematic side profile of a generic football player"
            className="mt-6 w-full rounded-lg border border-gold/20"
            label="Built Different player placeholder"
          />
        </Reveal>
        <Reveal delay={150} className="text-center md:text-left">
          <div className="glass-card p-6 md:p-8">
            <h3 className="font-display text-lg md:text-xl text-gold-2 font-bold tracking-wide">
              The 7FC Manifesto
            </h3>
            <p className="mt-4 text-gray-300 text-sm leading-relaxed">
              This is for the fans who watched the work before the trophies.
              The late runs. The impossible headers. The cold nights. The
              pressure. The standards.
            </p>
            <p className="mt-4 text-gray-400 text-sm">7FC is built around one idea:</p>
            <p className="mt-3 font-display text-lg md:text-xl gold-text font-bold uppercase leading-snug">
              Greatness is not luck.
              <br />
              Greatness is repeated.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

const CODE_OF_7 = [
  { icon: "🎯", title: "Discipline", copy: "The work when nobody is watching." },
  { icon: "♾️", title: "Longevity", copy: "Greatness across decades." },
  { icon: "💎", title: "Pressure", copy: "Showing up when the lights are brightest." },
  { icon: "🔄", title: "Reinvention", copy: "Winning in different places, different systems." },
  { icon: "🚩", title: "Nation", copy: "Pride. Purpose. Representing something bigger." },
  { icon: "👑", title: "Standard", copy: "Not just talent. Repetition. Obsession. Output." },
];

export function CodeOf7() {
  return (
    <section className="py-16 md:py-24 px-4">
      <div className="mx-auto max-w-6xl">
        <SectionTitle>The Code of 7</SectionTitle>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {CODE_OF_7.map((c, i) => (
            <Reveal key={c.title} delay={i * 80}>
              <div className="glass-card h-full p-5 text-center hover:border-gold/50 transition-colors">
                <div className="text-2xl mb-3" aria-hidden>{c.icon}</div>
                <h3 className="font-display text-sm font-bold tracking-[0.15em] uppercase text-gold-2">
                  {c.title}
                </h3>
                <p className="mt-2 text-xs text-gray-400 leading-relaxed">{c.copy}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
