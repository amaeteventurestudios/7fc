import { readDb, publicSupporterView } from "@/lib/store";
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
  const db = await readDb();
  const settings = db.global_wall_settings;
  const approved = db.supporters.filter((s) => s.status === "approved");
  const latest = [...approved]
    .sort((a, b) => b.supporter_number - a.supporter_number)
    .slice(0, 12)
    .map((s) => publicSupporterView(s, settings));
  const countryCount = new Set(approved.map((s) => s.country_code)).size;
  const latestCountry = latest[0]?.country_name ?? null;
  const products = db.affiliate_products
    .filter((p) => p.active)
    .sort((a, b) => a.sort_order - b.sort_order);

  return (
    <EraProvider>
      <DisclaimerBar text={db.legal_disclaimers.top_disclaimer} />
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
          disclosure={db.legal_disclaimers.affiliate_disclosure}
        />
      </main>
      <AboutFaqFooter legal={db.legal_disclaimers} />
    </EraProvider>
  );
}
