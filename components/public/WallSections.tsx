"use client";

import { useState, type FormEvent } from "react";
import { Reveal, SectionTitle, PlaceholderImg } from "./ui";
import { useEra } from "./EraContext";
import { COUNTRIES, flagEmoji } from "@/lib/countries";
import { ERAS } from "@/lib/types";
import type { GlobalWallSettings } from "@/lib/types";

export interface PublicSupporter {
  supporter_number: number;
  first_name: string;
  last_name: string | null;
  country_name: string;
  country_code: string;
  favorite_era: string | null;
}

const MAP_PULSES = [
  { top: "38%", left: "22%", color: "#c8102e" }, // North America
  { top: "62%", left: "31%", color: "#d4af5e" }, // South America
  { top: "34%", left: "46%", color: "#2b6cff" }, // Europe / Portugal
  { top: "52%", left: "49%", color: "#d4af5e" }, // West Africa
  { top: "46%", left: "58%", color: "#c8102e" }, // Middle East
  { top: "42%", left: "72%", color: "#2b6cff" }, // South Asia
  { top: "60%", left: "84%", color: "#d4af5e" }, // Oceania
];

const TOP_COUNTRIES = [
  ["US", "United States"],
  ["PT", "Portugal"],
  ["NG", "Nigeria"],
  ["BR", "Brazil"],
  ["SA", "Saudi Arabia"],
  ["GH", "Ghana"],
] as const;

export function WorldMapSection({
  countryCount,
  supporterCount,
  latestCountry,
  settings,
}: {
  countryCount: number;
  supporterCount: number;
  latestCountry: string | null;
  settings: GlobalWallSettings;
}) {
  return (
    <section className="section-glow py-16 md:py-24 px-4">
      <div className="mx-auto max-w-6xl">
        <SectionTitle>Where the 7 Has Been Raised</SectionTitle>
        <Reveal>
          <p className="text-center text-sm text-gray-300 max-w-xl mx-auto">
            From Portugal to Nigeria, Brazil to the United States, the 7 is
            global. Every supporter adds one more light to the map.
          </p>
          <div className="relative mt-8 rounded-xl overflow-hidden border border-gold/20">
            <PlaceholderImg
              src="/images/7fc-world-map.webp"
              alt="Dark world map showing global 7FC supporter locations"
              className="w-full object-cover"
              label="World map placeholder (1600x700)"
            />
            {MAP_PULSES.map((p, i) => (
              <span key={i} className="absolute" style={{ top: p.top, left: p.left }} aria-hidden>
                <span
                  className="map-pulse w-4 h-4 -translate-x-1/2 -translate-y-1/2"
                  style={{ background: p.color, animationDelay: `${i * 0.4}s` }}
                />
                <span
                  className="absolute w-1.5 h-1.5 rounded-full -translate-x-1/2 -translate-y-1/2"
                  style={{ background: p.color }}
                />
              </span>
            ))}
          </div>
          <div className="mt-8 flex flex-col md:flex-row items-center justify-center gap-6 text-center">
            {settings.show_country_count && (
              <div>
                <p className="font-display text-2xl font-bold gold-text">{countryCount}+</p>
                <p className="text-[11px] tracking-[0.2em] uppercase text-gray-400">Countries</p>
              </div>
            )}
            {settings.show_supporter_count && (
              <div>
                <p className="font-display text-2xl font-bold gold-text">
                  {supporterCount.toLocaleString()}+
                </p>
                <p className="text-[11px] tracking-[0.2em] uppercase text-gray-400">Supporters</p>
              </div>
            )}
            {latestCountry && (
              <div>
                <p className="font-display text-lg text-gold-2">⭐ {latestCountry}</p>
                <p className="text-[11px] tracking-[0.2em] uppercase text-gray-400">
                  Latest country
                </p>
              </div>
            )}
          </div>
          {settings.show_country_flags && (
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {TOP_COUNTRIES.map(([code, name]) => (
                <span
                  key={code}
                  className="glass-card px-3 py-1.5 text-xs text-gray-300 flex items-center gap-2"
                >
                  <span aria-hidden>{flagEmoji(code)}</span> {name}
                </span>
              ))}
            </div>
          )}
        </Reveal>
      </div>
    </section>
  );
}

export function LatestSupporters({
  supporters,
  settings,
}: {
  supporters: PublicSupporter[];
  settings: GlobalWallSettings;
}) {
  if (!settings.show_latest_supporters || supporters.length === 0) return null;
  const doubled = [...supporters, ...supporters];
  return (
    <section id="supporters" className="py-16 md:py-20 px-0 overflow-hidden">
      <div className="px-4">
        <SectionTitle>Latest 7FC Supporters</SectionTitle>
      </div>
      <div className="relative border-y border-gold/15 bg-navy/50 py-4">
        <div className="ticker-track flex w-max gap-4 px-4">
          {doubled.map((s, i) => (
            <div
              key={`${s.supporter_number}-${i}`}
              className="glass-card px-4 py-3 text-center min-w-[190px]"
            >
              <p className="text-gold-2 font-display text-sm font-bold">
                #{String(s.supporter_number).padStart(4, "0")}
              </p>
              <p className="text-sm text-white mt-1">
                {settings.show_country_flags && (
                  <span aria-hidden>{flagEmoji(s.country_code)} </span>
                )}
                {s.first_name}
                {s.last_name ? ` ${s.last_name}` : ""}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {s.country_name}
                {s.favorite_era ? ` · ${s.favorite_era}` : ""}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

interface SubmitResult {
  supporter_number: number;
  status: string;
}

export function GlobalWallForm({ settings }: { settings: GlobalWallSettings }) {
  const { selectedEra, setSelectedEra } = useEra();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SubmitResult | null>(null);

  const closed = !settings.enable_submissions || settings.emergency_lock;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    try {
      const res = await fetch("/api/wall/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Something went wrong. Try again.");
      setResult(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputCls =
    "w-full bg-night border border-gold/25 rounded px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:border-gold focus:outline-none";

  return (
    <section id="wall" className="section-glow py-16 md:py-24 px-4">
      <div className="mx-auto max-w-3xl">
        <SectionTitle kicker="This is not a page counter. This is a roll call.">
          The Global 7 Wall
        </SectionTitle>
        <Reveal>
          <p className="text-center text-sm text-gray-300 max-w-xl mx-auto mb-8">
            If CR7 made you believe in discipline, hunger, and greatness, raise
            your 7 and leave your mark with fans around the world.
          </p>
          {result ? (
            <div className="card-enter glass-card p-8 text-center border-gold/60">
              <p className="font-display text-2xl gold-text font-bold">
                Your 7 has been raised.
              </p>
              <p className="font-display text-4xl text-white mt-4 font-black">
                Supporter #{String(result.supporter_number).padStart(4, "0")}
              </p>
              <p className="text-sm text-gray-300 mt-4">
                Welcome to the Global 7 Wall.
                {result.status === "pending" &&
                  " Your entry will appear once it is approved."}
              </p>
            </div>
          ) : closed ? (
            <div className="glass-card p-8 text-center">
              <p className="text-sm text-gray-300">
                The Global 7 Wall is temporarily closed for new entries. Check
                back soon.
              </p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="glass-card p-6 md:p-8 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="text-center md:text-left">
                  <label htmlFor="first_name" className="block text-[11px] tracking-[0.2em] uppercase text-gold-2 mb-1.5">
                    First Name *
                  </label>
                  <input id="first_name" name="first_name" required maxLength={60} className={inputCls} placeholder="First name" />
                </div>
                <div className="text-center md:text-left">
                  <label htmlFor="last_name" className="block text-[11px] tracking-[0.2em] uppercase text-gold-2 mb-1.5">
                    Last Name (optional)
                  </label>
                  <input id="last_name" name="last_name" maxLength={60} className={inputCls} placeholder="Last name" />
                </div>
                <div className="text-center md:text-left">
                  <label htmlFor="email" className="block text-[11px] tracking-[0.2em] uppercase text-gold-2 mb-1.5">
                    Email Address * <span className="text-gray-500 normal-case">(private)</span>
                  </label>
                  <input id="email" name="email" type="email" required maxLength={200} className={inputCls} placeholder="Your email" />
                </div>
                <div className="text-center md:text-left">
                  <label htmlFor="country_code" className="block text-[11px] tracking-[0.2em] uppercase text-gold-2 mb-1.5">
                    Country *
                  </label>
                  <select id="country_code" name="country_code" required defaultValue="" className={inputCls}>
                    <option value="" disabled>
                      Select your country
                    </option>
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {flagEmoji(c.code)} {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="text-center md:text-left md:col-span-2">
                  <label htmlFor="favorite_era" className="block text-[11px] tracking-[0.2em] uppercase text-gold-2 mb-1.5">
                    Favorite CR7 Era (optional)
                  </label>
                  <select
                    id="favorite_era"
                    name="favorite_era"
                    value={selectedEra ?? ""}
                    onChange={(e) =>
                      setSelectedEra(
                        (e.target.value || null) as typeof selectedEra
                      )
                    }
                    className={inputCls}
                  >
                    <option value="">Select your era</option>
                    {ERAS.map((era) => (
                      <option key={era} value={era}>
                        {era}
                      </option>
                    ))}
                  </select>
                </div>
                {settings.allow_fan_messages && (
                  <div className="text-center md:text-left md:col-span-2">
                    <label htmlFor="message" className="block text-[11px] tracking-[0.2em] uppercase text-gold-2 mb-1.5">
                      Message (optional)
                    </label>
                    <textarea id="message" name="message" rows={3} maxLength={500} className={inputCls} placeholder="What did the 7 teach you?" />
                  </div>
                )}
              </div>
              {settings.allow_full_names && (
                <label className="flex items-center justify-center md:justify-start gap-2 text-xs text-gray-300">
                  <input type="checkbox" name="show_full_name" value="1" className="accent-[#d4af5e]" />
                  Show my full name on the Global 7 Wall
                </label>
              )}
              {/* Honeypot — humans never see or fill this */}
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                className="hidden"
                aria-hidden="true"
              />
              {error && (
                <p className="text-center text-sm text-red-400" role="alert">
                  {error}
                </p>
              )}
              <div className="text-center pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="cta-glow bg-crimson text-white font-bold tracking-widest uppercase text-sm px-10 py-3.5 rounded disabled:opacity-50 w-full md:w-auto"
                >
                  {submitting ? "Raising your 7…" : "Claim My Supporter Number →"}
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-3 text-[10px] text-gray-500 text-center">
                <p>🌍 Your name, your country, your era.</p>
                <p>🔒 Your email stays private.</p>
                <p>📋 Your name and country may appear on the Global 7 Wall if you choose.</p>
              </div>
            </form>
          )}
        </Reveal>
      </div>
    </section>
  );
}
