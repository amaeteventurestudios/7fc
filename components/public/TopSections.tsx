"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Reveal, SectionTitle, CountUp, Particles, PlaceholderImg, CONTAINER } from "./ui";
import MobileMenu from "./MobileMenu";
import { PRIMARY_NAV } from "@/lib/site";

export function DisclaimerBar({ text }: { text: string }) {
  return (
    <div className="bg-navy-2 border-b border-gold/20 text-center px-4 py-2">
      <p className="text-[11px] md:text-xs text-gold-2/80 tracking-wide">{text}</p>
    </div>
  );
}

export function Nav() {
  const pathname = usePathname();
  return (
    <>
    <header className="sticky top-0 z-50 bg-night/85 backdrop-blur border-b border-gold/15">
      <div className={`${CONTAINER} flex items-center justify-between py-3`}>
        <Link href="/" className="flex items-baseline gap-2" aria-label="7FC home">
          <span className="font-display text-xl md:text-2xl font-black gold-text">7FC</span>
          <span className="hidden sm:inline text-[10px] tracking-[0.35em] text-gold/70 uppercase">
            Seven FC
          </span>
        </Link>
        <nav className="hidden md:flex gap-4 lg:gap-6 text-xs tracking-[0.2em] uppercase text-gray-300">
          {PRIMARY_NAV.map(([label, href]) => {
            const active =
              href === "/" ? pathname === "/" : pathname?.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={
                  active
                    ? "text-gold-2 border-b border-gold pb-0.5"
                    : "hover:text-gold-2 transition-colors"
                }
              >
                {label}
              </Link>
            );
          })}
        </nav>
        <Link
          href="/#wall"
          className="cta-glow bg-crimson text-white text-xs font-bold tracking-widest uppercase px-4 py-2 rounded"
        >
          Raise Your 7
        </Link>
      </div>
    </header>
    <MobileMenu />
    </>
  );
}

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden text-center bg-night">
      <div className="relative w-full min-h-[640px] lg:min-h-0 lg:aspect-[1672/941]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/7fc-hero-stadium-bg.webp"
          alt="Cinematic stadium tunnel with a generic number 7 player under red, blue, and gold lights"
          className="absolute inset-0 h-full w-full object-cover lg:object-contain object-center"
        />
        <div className="absolute inset-0 atmosphere opacity-40 mix-blend-screen" aria-hidden />
        <div
          className="absolute inset-x-0 top-0 h-2/3 bg-gradient-to-b from-night via-night/50 to-transparent"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-night/80 via-transparent to-transparent"
          aria-hidden
        />
        <div className="light-sweep" aria-hidden />
        <Particles />
        <div className="absolute inset-0 flex flex-col items-center pt-10 sm:pt-12 md:pt-16 lg:pt-14">
          <div className="relative mx-auto w-full max-w-6xl px-4">
            <div className="flex flex-col items-center text-center">
              <p className="text-xs md:text-sm tracking-[0.4em] uppercase text-electric mb-6 md:mb-8">
                Discipline. Standards. Greatness.
              </p>
              <h1 className="font-display font-black gold-text text-6xl md:text-8xl leading-none drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)]">
                7FC
              </h1>
              <p className="font-display tracking-[0.5em] text-gold-2 text-sm md:text-xl mt-3 uppercase">
                Seven FC
              </p>
              <h2 className="font-display text-lg md:text-3xl text-white mt-5 md:mt-6 tracking-wide drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
                The CR7 Legacy. Forever 7.
              </h2>
              <p className="mt-4 max-w-xl text-xs md:text-base text-gray-300">
                A global fan tribute to discipline, longevity, records, pressure,
                reinvention, and the standard of the number 7.
              </p>
              <div className="mt-6 md:mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 relative z-10">
                <a
                  href="#wall"
                  className="cta-glow whitespace-nowrap bg-crimson text-white font-bold tracking-widest uppercase text-xs sm:text-sm md:text-base px-6 sm:px-8 md:px-9 py-3 md:py-3.5 rounded text-center"
                >
                  Raise Your 7
                </a>
                <Link
                  href="/wall"
                  className="cta-gold-glow whitespace-nowrap bg-night/70 backdrop-blur-sm border border-gold/60 text-gold-2 font-semibold tracking-widest uppercase text-xs sm:text-sm md:text-base px-6 sm:px-8 md:px-9 py-3 md:py-3.5 rounded text-center"
                >
                  See the Global 7 Wall
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const STATS: Array<{ icon: string; value: number; suffix: string; label: string }> = [
  { icon: "⚽", value: 970, suffix: "+", label: "Goals" },
  { icon: "🏆", value: 34, suffix: "+", label: "Trophies" },
  { icon: "🥇", value: 5, suffix: "", label: "Ballon d'Ors" },
  { icon: "👕", value: 5, suffix: "", label: "Clubs" },
];

export function StatsStrip() {
  return (
    <section className="border-y border-gold/15 bg-navy/60">
      <div className={`${CONTAINER} grid grid-cols-2 lg:grid-cols-4 gap-4 py-8 md:py-12`}>
        {STATS.map((s) => (
          <div
            key={s.label}
            className="glass-card text-center py-8 md:py-12 px-2 hover:border-gold/50 transition-colors"
          >
            <div className="text-3xl md:text-4xl mb-3" aria-hidden>{s.icon}</div>
            <div className="font-display text-3xl md:text-6xl font-bold gold-text">
              <CountUp target={s.value} suffix={s.suffix} />
            </div>
            <div className="text-[11px] md:text-sm tracking-[0.25em] uppercase text-gray-400 mt-2">
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
    <section id="built-different" className="section-glow py-16 md:py-28">
      <div className={`${CONTAINER} grid md:grid-cols-2 gap-10 lg:gap-16 items-center`}>
        <Reveal className="text-center md:text-left">
          <h2 className="font-display text-2xl md:text-4xl font-bold gold-text">
            Built Different
          </h2>
          <p className="text-crimson text-xs md:text-sm tracking-[0.25em] uppercase mt-3">
            Obsession builds legacy.
          </p>
          <p className="mt-6 text-gray-300 text-sm md:text-lg leading-relaxed">
            From humble beginnings to global greatness — relentless in pursuit
            of excellence, year after year, decade after decade.
          </p>
          <p className="mt-6 font-display text-lg md:text-2xl text-white">
            Not just a player. <span className="gold-text">A standard.</span>
          </p>
          <PlaceholderImg
            src="/images/7fc-built-different-player.webp"
            alt="Cinematic side profile of a generic football player"
            className="mt-8 w-full rounded-lg border border-gold/20"
            label="Built Different player placeholder"
          />
        </Reveal>
        <Reveal delay={150} className="text-center md:text-left">
          <div className="glass-card p-8 md:p-12">
            <h3 className="font-display text-lg md:text-2xl text-gold-2 font-bold tracking-wide">
              The 7FC Manifesto
            </h3>
            <p className="mt-5 text-gray-300 text-sm md:text-base leading-relaxed">
              This is for the fans who watched the work before the trophies.
              The late runs. The impossible headers. The cold nights. The
              pressure. The standards.
            </p>
            <p className="mt-5 text-gray-400 text-sm md:text-base">
              7FC is built around one idea:
            </p>
            <p className="mt-4 font-display text-lg md:text-3xl gold-text font-bold uppercase leading-snug">
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
    <section id="the-code" className="py-16 md:py-28 border-t border-gold/10">
      <div className={CONTAINER}>
        <SectionTitle>The Code of 7</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-5">
          {CODE_OF_7.map((c, i) => (
            <Reveal key={c.title} delay={i * 80}>
              <div className="glass-card h-full p-8 md:p-10 min-h-[220px] md:min-h-[280px] text-center hover:border-gold/60 hover:shadow-[0_0_24px_rgba(212,175,94,0.15)] transition-all flex flex-col items-center justify-center">
                <div className="text-4xl md:text-5xl mb-5" aria-hidden>{c.icon}</div>
                <h3 className="font-display text-base md:text-lg font-bold tracking-[0.15em] uppercase text-gold-2">
                  {c.title}
                </h3>
                <p className="mt-3 text-sm text-gray-400 leading-relaxed">{c.copy}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
