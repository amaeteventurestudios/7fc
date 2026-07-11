import { emailEnabled } from "@/lib/email/outbox";
import { getStore } from "@/lib/data";
import { publicSupporterView } from "@/lib/store";
import { EraProvider } from "@/components/public/EraContext";
import {
  DisclaimerBar,
  Nav,
  Hero,
  StatsStrip,
  BuiltDifferent,
  CodeOf7,
} from "@/components/public/TopSections";
import {
  Journey,
  ChooseEra,
  Moments,
  RecordWall,
  QuoteBanner,
} from "@/components/public/MidSections";
import {
  WorldMapSection,
  LatestSupporters,
  GlobalWallForm,
} from "@/components/public/WallSections";
import {
  KitSection,
  AboutFaqFooter,
} from "@/components/public/BottomSections";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const store = await getStore();
  const { settings, legal, products, approved } = await store.getPublicHome();
  const latest = [...approved]
    .sort((a, b) => b.supporter_number - a.supporter_number)
    .map((s) => publicSupporterView(s, settings));
  const countryCount = new Set(approved.map((s) => s.country_code)).size;
  const latestCountry = latest[0]?.country_name ?? null;
  const eraCounts = new Map<string, number>();
  for (const s of approved) {
    if (s.favorite_era)
      eraCounts.set(s.favorite_era, (eraCounts.get(s.favorite_era) ?? 0) + 1);
  }
  const topEra =
    [...eraCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  return (
    <EraProvider>
      <DisclaimerBar text={legal.top_disclaimer} />
      <Nav />
      <main id="main-content">
        <Hero />
        <StatsStrip />
        <BuiltDifferent />
        <CodeOf7 />
        <Journey />
        <ChooseEra />
        <Moments />
        <RecordWall />
        <QuoteBanner />
        <WorldMapSection
          countryCount={countryCount}
          supporterCount={approved.length}
          latestCountry={latestCountry}
          topEra={topEra}
          settings={settings}
        />
        <LatestSupporters supporters={latest} settings={settings} />
        <GlobalWallForm settings={settings} signupAvailable={emailEnabled()} />
        <KitSection
          products={products}
          disclosure={legal.affiliate_disclosure}
        />
      </main>
      <AboutFaqFooter legal={legal} />
    </EraProvider>
  );
}
