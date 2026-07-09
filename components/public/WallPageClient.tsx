"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CONTAINER, Particles } from "./ui";
import {
  SupporterCard,
  FoundingSlotCard,
  supporterDisplayName,
  type PublicSupporter,
} from "./WallSections";
import { flagEmoji } from "@/lib/countries";
import { formatPublicDate } from "@/lib/format";
import { ERAS, type GlobalWallSettings } from "@/lib/types";

type SortKey = "latest" | "oldest" | "number" | "country";

const SORTS: Array<[SortKey, string]> = [
  ["latest", "Latest joined"],
  ["oldest", "Oldest joined"],
  ["number", "Supporter number"],
  ["country", "Country"],
];

const CHIPS: Array<[string, string]> = [
  ["", "All"],
  ["US", "USA"],
  ["NG", "Nigeria"],
  ["PT", "Portugal"],
  ["BR", "Brazil"],
  ["SA", "Saudi Arabia"],
  ["GH", "Ghana"],
  ["GB", "UK"],
];

function topCounts(
  supporters: PublicSupporter[],
  key: (s: PublicSupporter) => string | null
): Array<[string, number]> {
  const counts = new Map<string, number>();
  for (const s of supporters) {
    const k = key(s);
    if (k) counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
}

export default function WallPageClient({
  supporters,
  settings,
}: {
  supporters: PublicSupporter[];
  settings: GlobalWallSettings;
}) {
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("");
  const [era, setEra] = useState("");
  const [sort, setSort] = useState<SortKey>("latest");
  const [page, setPage] = useState(1);

  const pageSize = Math.max(settings.wall_page_size || 24, 1);

  const countries = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of supporters) map.set(s.country_code, s.country_name);
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [supporters]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = supporters.filter((s) => {
      if (country && s.country_code !== country) return false;
      if (era && s.favorite_era !== era) return false;
      if (q) {
        const haystack = [
          supporterDisplayName(s),
          `#${String(s.supporter_number).padStart(4, "0")}`,
          String(s.supporter_number),
          s.country_name,
          s.favorite_era ?? "",
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
    list = [...list];
    if (sort === "latest")
      list.sort((a, b) => b.created_at.localeCompare(a.created_at));
    else if (sort === "oldest")
      list.sort((a, b) => a.created_at.localeCompare(b.created_at));
    else if (sort === "number")
      list.sort((a, b) => a.supporter_number - b.supporter_number);
    else list.sort((a, b) => a.country_name.localeCompare(b.country_name));
    return list;
  }, [supporters, query, country, era, sort]);

  const filtering = !!(query.trim() || country || era);
  const visible = filtered.slice(0, page * pageSize);
  const foundingCount =
    settings.founding_slots_enabled && !filtering
      ? Math.max(pageSize - visible.length, 0)
      : 0;
  const hasMore = filtered.length > visible.length;

  const countryCount = new Set(supporters.map((s) => s.country_code)).size;
  const latest = supporters.reduce<PublicSupporter | null>(
    (acc, s) => (!acc || s.created_at > acc.created_at ? s : acc),
    null
  );
  const topCountries = topCounts(supporters, (s) => s.country_name);
  const topEras = topCounts(supporters, (s) => s.favorite_era);

  const heroStats: Array<[string, string]> = [
    ["Countries", String(countryCount)],
    ["Supporters", supporters.length.toLocaleString()],
    ["Latest Country", latest?.country_name ?? "—"],
    [
      "Latest Raised",
      latest ? formatPublicDate(latest.created_at) : "—",
    ],
  ];

  const selectCls =
    "bg-night border border-gold/25 rounded px-3 py-2.5 text-sm text-white focus:border-gold focus:outline-none";

  return (
    <>
      {/* Wall hero */}
      <section className="relative overflow-hidden text-center border-b border-gold/15">
        <div className="absolute inset-0 atmosphere" aria-hidden />
        <div
          className="absolute inset-0 opacity-25 bg-cover bg-center"
          style={{ backgroundImage: "url(/images/7fc-world-map.webp)" }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-b from-night/50 via-night/70 to-night" aria-hidden />
        {/* Mobile-only cinematic silhouette, masked so it never fights the headline */}
        <div
          aria-hidden
          className="md:hidden absolute inset-x-0 bottom-0 top-1/4 opacity-20 bg-contain bg-bottom bg-no-repeat pointer-events-none"
          style={{
            backgroundImage: "url(/images/7fc-wall-hero-mobile.webp)",
            maskImage:
              "linear-gradient(to bottom, transparent, black 30%, black 75%, transparent)",
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent, black 30%, black 75%, transparent)",
          }}
        />
        <Particles />
        <div className={`${CONTAINER} relative pt-14 pb-12 md:pt-24 md:pb-20`}>
          <h1 className="font-display text-3xl md:text-6xl font-black gold-text tracking-wide">
            The Global 7 Wall
          </h1>
          <p className="mt-4 text-sm md:text-lg text-gray-300">
            This is not a page counter. This is a roll call.
          </p>
          <p className="mt-2 text-xs md:text-base text-gray-400">
            Search your name. Find your country. See who has raised the 7.
          </p>
          <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {heroStats.map(([label, value]) => (
              <div key={label} className="glass-card p-5 md:p-8 text-center">
                <p className="font-display text-2xl md:text-4xl font-bold gold-text">{value}</p>
                <p className="text-[10px] md:text-xs tracking-[0.2em] uppercase text-gray-400 mt-2">
                  {label}
                </p>
              </div>
            ))}
          </div>
          {supporters.length === 0 && (
            <p className="mt-6 text-sm text-gold-2/80">
              The founding era has begun — the first supporters to raise their
              7 become part of 7FC history.
            </p>
          )}
        </div>
      </section>

      {/* Search + filters */}
      <section className="py-10 md:py-14 border-b border-gold/10 bg-navy/30">
        <div className={CONTAINER}>
          <div className="flex flex-col lg:flex-row gap-3 items-stretch">
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name, supporter number, country, or era"
              className="flex-1 bg-night border border-gold/25 rounded px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-gold focus:outline-none"
            />
            <div className="grid grid-cols-3 gap-3 lg:flex">
              <select
                value={country}
                onChange={(e) => {
                  setCountry(e.target.value);
                  setPage(1);
                }}
                className={selectCls}
                aria-label="Filter by country"
              >
                <option value="">All countries</option>
                {countries.map(([code, name]) => (
                  <option key={code} value={code}>
                    {flagEmoji(code)} {name}
                  </option>
                ))}
              </select>
              <select
                value={era}
                onChange={(e) => {
                  setEra(e.target.value);
                  setPage(1);
                }}
                className={selectCls}
                aria-label="Filter by era"
              >
                <option value="">All eras</option>
                {ERAS.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className={selectCls}
                aria-label="Sort order"
              >
                {SORTS.map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {CHIPS.map(([code, label]) => {
              const active = country === code;
              return (
                <button
                  key={label}
                  onClick={() => {
                    setCountry(code);
                    setPage(1);
                  }}
                  className={`px-4 py-1.5 rounded-full text-xs tracking-wide border transition-colors ${
                    active
                      ? "border-gold bg-gold/15 text-gold-2"
                      : "border-gray-700 text-gray-400 hover:border-gold/50 hover:text-gray-200"
                  }`}
                >
                  {code ? `${flagEmoji(code)} ${label}` : label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Grid + side panel */}
      <section className="py-12 md:py-20">
        <div className={`${CONTAINER} grid lg:grid-cols-[1fr_300px] gap-10`}>
          <div>
            {filtering && filtered.length === 0 ? (
              <div className="glass-card p-10 text-center">
                <p className="text-sm text-gray-300">
                  No supporters match your search yet. Try a different filter —
                  or be the first from your country to raise the 7.
                </p>
                <Link
                  href="/#wall"
                  className="cta-glow inline-block mt-6 bg-crimson text-white font-bold tracking-widest uppercase text-xs px-6 py-3 rounded"
                >
                  Raise Your 7
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
                {visible.map((s) => (
                  <SupporterCard
                    key={s.supporter_number}
                    supporter={s}
                    settings={settings}
                    showDate
                  />
                ))}
                {Array.from({ length: foundingCount }).map((_, i) => (
                  <FoundingSlotCard key={`founding-${i}`} href="/#wall" />
                ))}
              </div>
            )}
            {hasMore && (
              <div className="text-center mt-8">
                <button
                  onClick={() => setPage((p) => p + 1)}
                  className="cta-gold-glow border border-gold/60 text-gold-2 font-semibold tracking-widest uppercase text-sm px-8 py-3 rounded"
                >
                  Load More
                </button>
              </div>
            )}
          </div>
          {/* Right panel */}
          <aside className="space-y-6">
            <div className="glass-card p-6">
              <h3 className="font-display text-sm font-bold tracking-[0.2em] uppercase text-gold-2 text-center">
                Top Countries
              </h3>
              {topCountries.length === 0 ? (
                <p className="text-xs text-gray-500 text-center mt-4">
                  Waiting for founding supporters.
                </p>
              ) : (
                <ul className="mt-4 space-y-2.5">
                  {topCountries.map(([name, count]) => (
                    <li key={name} className="flex justify-between text-sm text-gray-300">
                      <span>{name}</span>
                      <span className="text-gold-2">{count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="glass-card p-6">
              <h3 className="font-display text-sm font-bold tracking-[0.2em] uppercase text-gold-2 text-center">
                Top Eras
              </h3>
              {topEras.length === 0 ? (
                <p className="text-xs text-gray-500 text-center mt-4">
                  Waiting for founding supporters.
                </p>
              ) : (
                <ul className="mt-4 space-y-2.5">
                  {topEras.map(([name, count]) => (
                    <li key={name} className="flex justify-between text-sm text-gray-300">
                      <span>{name}</span>
                      <span className="text-gold-2">{count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        </div>
      </section>

      {/* Latest 7s Raised strip */}
      <section className="py-10 md:py-16 border-t border-gold/10 overflow-hidden">
        <h2 className="font-display text-xl md:text-3xl font-bold gold-text text-center mb-8">
          Latest 7s Raised
        </h2>
        <div className="relative border-y border-gold/15 bg-navy/50 py-6">
          <div className="ticker-track flex w-max gap-5 px-4">
            {(() => {
              const strip: Array<PublicSupporter | null> = [
                ...supporters.slice(0, 8),
              ];
              if (settings.founding_slots_enabled)
                while (strip.length < 8) strip.push(null);
              const doubled = [...strip, ...strip];
              return doubled.map((s, i) => (
                <div key={i} className="min-w-[240px] md:min-w-[280px]">
                  {s ? (
                    <SupporterCard supporter={s} settings={settings} />
                  ) : (
                    <FoundingSlotCard href="/#wall" />
                  )}
                </div>
              ));
            })()}
          </div>
        </div>
      </section>

      {/* CTA banner */}
      <section className="relative overflow-hidden border-t border-gold/15">
        <div className="absolute inset-0 atmosphere" aria-hidden />
        <div className="light-sweep" aria-hidden />
        <div className="relative mx-auto max-w-4xl px-4 py-16 md:py-28 text-center">
          <p className="font-display text-2xl md:text-4xl text-white font-bold leading-snug">
            Your story. Your standard.
            <br />
            <span className="gold-text">Your place on the wall.</span>
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/#wall"
              className="cta-glow bg-crimson text-white font-bold tracking-widest uppercase text-sm px-9 py-3.5 rounded"
            >
              Raise Your 7
            </Link>
            <Link
              href="/"
              className="cta-gold-glow border border-gold/60 text-gold-2 font-semibold tracking-widest uppercase text-sm px-9 py-3.5 rounded"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
