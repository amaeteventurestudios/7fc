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
    .slice(0, 12)
    .map((s) => publicSupporterView(s, settings));
  const countryCount = new Set(approved.map((s) => s.country_code)).size;
  const latestCountry = latest[0]?.country_name ?? null;

  return (
    <EraProvider>
      <DisclaimerBar text={legal.top_disclaimer} />
      <Nav />
      <main>
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
          settings={settings}
        />
        <LatestSupporters supporters={latest} settings={settings} />
        <GlobalWallForm settings={settings} />
        <KitSection
          products={products}
          disclosure={legal.affiliate_disclosure}
        />
      </main>
      <AboutFaqFooter legal={legal} />
    </EraProvider>
  );
}
