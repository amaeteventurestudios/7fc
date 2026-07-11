"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Reveal, SectionTitle, PlaceholderImg, CONTAINER } from "./ui";
import { useEra } from "./EraContext";
import { COUNTRIES, flagEmoji } from "@/lib/countries";
import { formatPublicDate } from "@/lib/format";
import { ERAS } from "@/lib/types";
import type { GlobalWallSettings } from "@/lib/types";
import type { PublicSupporter } from "@/lib/store";
import TurnstileWidget from "./TurnstileWidget";

export type { PublicSupporter };

export function supporterDisplayName(s: PublicSupporter): string {
  if (s.last_name) return `${s.first_name} ${s.last_name}`;
  if (s.last_initial) return `${s.first_name} ${s.last_initial}`;
  return s.first_name;
}

/** Card for a real approved supporter. Never shows email. */
export function SupporterCard({
  supporter,
  settings,
  showDate = false,
}: {
  supporter: PublicSupporter;
  settings: GlobalWallSettings;
  showDate?: boolean;
}) {
  return (
    <div className="glass-card px-5 py-6 text-center hover:border-gold/50 transition-colors h-full">
      <p className="text-gold-2 font-display text-base font-bold">
        #{String(supporter.supporter_number).padStart(4, "0")}
      </p>
      <p className="text-base text-white mt-2">
        {settings.show_country_flags && (
          <span aria-hidden>{flagEmoji(supporter.country_code)} </span>
        )}
        {supporterDisplayName(supporter)}
      </p>
      <p className="text-xs text-gray-400 mt-1.5">
        {supporter.country_name}
        {supporter.favorite_era ? ` · ${supporter.favorite_era}` : ""}
      </p>
      {showDate && (
        <p className="text-[10px] text-gray-500 mt-1.5">
          Raised {formatPublicDate(supporter.created_at)}
        </p>
      )}
    </div>
  );
}

/** Open-slot CTA card — clearly not a person, no fake data. */
export function FoundingSlotCard({ href = "/#wall" }: { href?: string }) {
  return (
    <Link
      href={href}
      className="block h-full rounded-xl border border-dashed border-gold/40 bg-navy/30 px-5 py-6 text-center hover:border-gold hover:bg-navy/50 transition-all"
    >
      <p className="font-display text-sm font-bold tracking-[0.15em] uppercase text-gold/80">
        Founding Slot Open
      </p>
      <p className="text-base text-white mt-2 font-semibold">Raise Your 7</p>
      <p className="text-xs text-gray-400 mt-1.5">Claim your supporter number</p>
    </Link>
  );
}

const MAP_PULSES = [
  { top: "38%", left: "22%", color: "#c8102e" },
  { top: "62%", left: "31%", color: "#d4af5e" },
  { top: "34%", left: "46%", color: "#2b6cff" },
  { top: "52%", left: "49%", color: "#d4af5e" },
  { top: "46%", left: "58%", color: "#c8102e" },
  { top: "42%", left: "72%", color: "#2b6cff" },
  { top: "60%", left: "84%", color: "#d4af5e" },
];

const CHIP_COUNTRIES = [
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
  topEra,
  settings,
}: {
  countryCount: number;
  supporterCount: number;
  latestCountry: string | null;
  topEra: string | null;
  settings: GlobalWallSettings;
}) {
  const statCards: Array<[string, string]> = [];
  if (settings.show_country_count)
    statCards.push(["Countries Represented", String(countryCount)]);
  if (settings.show_supporter_count)
    statCards.push(["Supporters", supporterCount.toLocaleString()]);
  statCards.push(["Latest Country", latestCountry ?? "Awaiting the first 7"]);
  statCards.push(["Top Era", topEra ?? "Awaiting the first 7"]);

  return (
    <section className="section-glow py-16 md:py-28 border-t border-gold/10">
      <div className={CONTAINER}>
        <SectionTitle>Where the 7 Has Been Raised</SectionTitle>
        <Reveal>
          <p className="text-center text-sm md:text-lg text-gray-300 max-w-2xl mx-auto">
            From Portugal to Nigeria, Brazil to the United States, the 7 is
            global. Every supporter adds one more light to the map.
          </p>
          <div className="relative mt-10 rounded-xl overflow-hidden border border-gold/25 shadow-[0_0_40px_rgba(43,108,255,0.1)]">
            <PlaceholderImg
              src="/images/7fc-world-map.webp"
              alt="Dark world map showing global 7FC supporter locations"
              className="w-full min-h-[280px] md:min-h-[480px] object-cover"
              label="World map placeholder (1600x700)"
            />
            {MAP_PULSES.map((p, i) => (
              <span key={i} className="absolute" style={{ top: p.top, left: p.left }} aria-hidden>
                <span
                  className="map-pulse w-5 h-5 -translate-x-1/2 -translate-y-1/2"
                  style={{ background: p.color, animationDelay: `${i * 0.4}s` }}
                />
                <span
                  className="absolute w-2 h-2 rounded-full -translate-x-1/2 -translate-y-1/2"
                  style={{ background: p.color }}
                />
              </span>
            ))}
          </div>
          <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map(([label, value]) => (
              <div key={label} className="glass-card p-6 md:p-8 text-center">
                <p className="font-display text-2xl md:text-4xl font-bold gold-text">{value}</p>
                <p className="text-[11px] md:text-xs tracking-[0.2em] uppercase text-gray-400 mt-2">
                  {label}
                </p>
              </div>
            ))}
          </div>
          {settings.show_country_flags && (
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {CHIP_COUNTRIES.map(([code, name]) => (
                <span
                  key={code}
                  className="glass-card px-4 py-2 text-xs md:text-sm text-gray-300 flex items-center gap-2"
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
  if (!settings.show_latest_supporters) return null;
  const previewCount = Math.max(settings.homepage_preview_count || 8, 1);
  const real = supporters.slice(0, previewCount);
  const foundingCount = settings.founding_slots_enabled
    ? Math.max(previewCount - real.length, 0)
    : 0;
  if (real.length + foundingCount === 0) return null;
  const slots: Array<PublicSupporter | null> = [
    ...real,
    ...Array<null>(foundingCount).fill(null),
  ];
  const doubled = [...slots, ...slots];
  return (
    <section id="supporters" className="py-16 md:py-24 overflow-hidden border-t border-gold/10">
      <div className={CONTAINER}>
        <SectionTitle>Latest 7FC Supporters</SectionTitle>
      </div>
      <div className="relative border-y border-gold/15 bg-navy/50 py-6">
        <div className="ticker-track flex w-max gap-5 px-4">
          {doubled.map((s, i) => (
            <div key={i} className="min-w-[240px] md:min-w-[280px]">
              {s ? (
                <SupporterCard supporter={s} settings={settings} />
              ) : (
                <FoundingSlotCard />
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="text-center mt-8">
        <Link
          href="/wall"
          className="cta-gold-glow inline-block border border-gold/60 text-gold-2 font-semibold tracking-widest uppercase text-sm px-8 py-3 rounded"
        >
          View Full Global 7 Wall
        </Link>
      </div>
    </section>
  );
}

interface SubmitResult {
  supporter_number: number;
  status: string;
  needs_verification?: boolean;
}

export function GlobalWallForm({
  settings,
  signupAvailable = true,
}: {
  settings: GlobalWallSettings;
  signupAvailable?: boolean;
}) {
  const { selectedEra, setSelectedEra } = useEra();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SubmitResult | null>(null);

  const closed = !settings.enable_submissions || settings.emergency_lock;
  const paused = !closed && !signupAvailable;

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
    "w-full bg-night border border-gold/25 rounded px-3 py-3 text-sm text-white placeholder-gray-500 focus:border-gold focus:outline-none";

  return (
    <section id="wall" className="section-glow py-16 md:py-28 border-t border-gold/10">
      <div className={CONTAINER}>
        <SectionTitle kicker="This is not a page counter. This is a roll call.">
          The Global 7 Wall
        </SectionTitle>
        <Reveal>
          {result ? (
            <div className="card-enter glass-card max-w-2xl mx-auto p-10 md:p-14 text-center border-gold/60">
              <p className="font-display text-2xl md:text-3xl gold-text font-bold">
                Your 7 has been raised.
              </p>
              <p className="font-display text-4xl md:text-5xl text-white mt-5 font-black">
                Supporter #{String(result.supporter_number).padStart(4, "0")}
              </p>
              <p className="text-sm md:text-base text-gray-300 mt-5" role="status">
                {result.needs_verification
                  ? "One step left: we've sent a verification email to your address. Click the link inside within 24 hours to confirm your signup. Your entry will appear on the Global 7 Wall after verification and approval."
                  : result.status === "pending"
                    ? "Your profile will appear on the Global 7 Wall after approval."
                    : "You are now live on the Global 7 Wall."}
              </p>
              <p className="text-[11px] tracking-[0.2em] uppercase text-gold/70 mt-5">
                I raised my 7 on SevenFC.net
              </p>
              <Link
                href="/wall"
                className="cta-gold-glow inline-block mt-7 border border-gold/60 text-gold-2 font-semibold tracking-widest uppercase text-sm px-8 py-3 rounded"
              >
                View Global 7 Wall
              </Link>
            </div>
          ) : closed || paused ? (
            <div className="glass-card max-w-2xl mx-auto p-8 text-center" role="status">
              <p className="text-sm text-gray-300">
                {paused
                  ? "New signups are temporarily paused for maintenance. The Wall is still open to explore — check back soon to raise your 7."
                  : "The Global 7 Wall is temporarily closed for new entries. Check back soon."}
              </p>
            </div>
          ) : (
            <div className="grid lg:grid-cols-[1fr_1.6fr_1fr] gap-8 items-start">
              {/* Left: why + privacy */}
              <div className="text-center lg:text-left order-2 lg:order-1">
                <h3 className="font-display text-lg md:text-xl text-gold-2 font-bold">
                  Why raise your 7?
                </h3>
                <p className="mt-4 text-sm md:text-base text-gray-300 leading-relaxed">
                  If CR7 made you believe in discipline, hunger, and greatness,
                  raise your 7 and leave your mark with fans around the world.
                </p>
                <ul className="mt-6 space-y-3 text-xs md:text-sm text-gray-400">
                  <li>🌍 Your name, your country, your era.</li>
                  <li>🔒 Your email stays private. Always.</li>
                  <li>📋 Your name and country appear only if you choose.</li>
                  <li>🔢 Every supporter gets a permanent number.</li>
                </ul>
              </div>
              {/* Center: form */}
              <form
                onSubmit={onSubmit}
                className="glass-card p-6 md:p-10 space-y-4 order-1 lg:order-2"
              >
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
                  <label className="flex items-start justify-center md:justify-start gap-2 text-xs text-gray-300">
                    <input type="checkbox" name="show_full_name" value="1" className="accent-[#d4af5e] mt-0.5" />
                    <span>Show my full name on the Global 7 Wall (otherwise only your first name appears)</span>
                  </label>
                )}
                <div className="border-t border-gold/15 pt-4 space-y-3 text-left">
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    <strong className="text-gold-2">What appears publicly if approved:</strong>{" "}
                    your first name (full name only if you tick the box above),
                    country, favorite era, message, and supporter number. Your
                    email address always stays private.
                  </p>
                  <label className="flex items-start gap-2 text-xs text-gray-300">
                    <input type="checkbox" name="terms_accepted" value="1" required className="accent-[#d4af5e] mt-0.5" />
                    <span>
                      I agree to the{" "}
                      <Link href="/terms" className="text-gold-2 underline underline-offset-2" target="_blank">
                        Terms of Use
                      </Link>{" "}
                      and acknowledge the{" "}
                      <Link href="/privacy" className="text-gold-2 underline underline-offset-2" target="_blank">
                        Privacy Policy
                      </Link>
                      . *
                    </span>
                  </label>
                  <label className="flex items-start gap-2 text-xs text-gray-300">
                    <input type="checkbox" name="age_attested" value="1" required className="accent-[#d4af5e] mt-0.5" />
                    <span>I confirm that I am at least 16 years old. *</span>
                  </label>
                  <label className="flex items-start gap-2 text-xs text-gray-300">
                    <input type="checkbox" name="display_consent" value="1" className="accent-[#d4af5e] mt-0.5" />
                    <span>
                      I consent to 7FC displaying my selected information and
                      message on the public Global 7 Wall. I understand that
                      approved public content may be indexed, cached, or
                      summarized by search engines and AI services.
                    </span>
                  </label>
                  <label className="flex items-start gap-2 text-xs text-gray-300">
                    <input type="checkbox" name="marketing_consent" value="1" className="accent-[#d4af5e] mt-0.5" />
                    <span>I would like to receive occasional 7FC news and updates. (Optional)</span>
                  </label>
                </div>
                <TurnstileWidget action="wall_signup" />
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
                    className="cta-glow bg-crimson text-white font-bold tracking-widest uppercase text-sm px-10 py-4 rounded disabled:opacity-50 w-full md:w-auto"
                  >
                    {submitting ? "Raising your 7…" : "Claim My Supporter Number →"}
                  </button>
                </div>
              </form>
              {/* Right: supporter card preview */}
              <div className="text-center order-3 hidden lg:block">
                <div className="glass-card p-6 border-gold/40">
                  <p className="text-[10px] tracking-[0.3em] uppercase text-gray-500">
                    Preview — this could be you
                  </p>
                  <PlaceholderImg
                    src="/images/7fc-supporter-card-player.webp"
                    alt="Generic number 7 supporter card artwork"
                    className="w-full aspect-[7/9] object-cover rounded mt-4"
                    label="Supporter card art"
                  />
                  <p className="font-display text-lg gold-text font-bold mt-4">
                    I RAISED MY 7
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Supporter #____</p>
                  <p className="text-xs text-gray-500 mt-0.5">Your name · Your country</p>
                  <p className="text-[10px] tracking-[0.2em] uppercase text-gold/60 mt-3">
                    SevenFC.net
                  </p>
                </div>
              </div>
            </div>
          )}
        </Reveal>
      </div>
    </section>
  );
}
