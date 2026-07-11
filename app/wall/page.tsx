import type { Metadata } from "next";
import { getStore } from "@/lib/data";
import { SITE_URL, OG_PREVIEW_IMAGE } from "@/lib/site";
import { publicSupporterView } from "@/lib/store";
import { DisclaimerBar, Nav } from "@/components/public/TopSections";
import { SiteFooter } from "@/components/public/BottomSections";
import WallPageClient from "@/components/public/WallPageClient";

export const dynamic = "force-dynamic";


export const metadata: Metadata = {
  title: "Global Supporter Wall | Join the Worldwide 7FC Community",
  description:
    "Search the Global 7 Wall, find approved 7FC supporters by country, era, and supporter number, and raise your 7 as part of an independent football fan tribute.",
  alternates: { canonical: `${SITE_URL}/wall` },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/wall`,
    siteName: "7FC — Seven FC",
    title: "The Global 7 Wall — 7FC",
    description:
      "A global roll call of football fans who raised their 7. An independent, unofficial fan tribute.",
    images: [{ url: OG_PREVIEW_IMAGE, width: 1200, height: 630 }],
  },
};

export default async function WallPage() {
  const store = await getStore();
  const { settings, legal, approved } = await store.getPublicHome();
  const supporters = [...approved]
    .sort((a, b) => b.supporter_number - a.supporter_number)
    .map((s) => publicSupporterView(s, settings));

  return (
    <>
      <DisclaimerBar text={legal.top_disclaimer} />
      <Nav />
      <main>
        <WallPageClient supporters={supporters} settings={settings} />
      </main>
      <SiteFooter legal={legal} />
    </>
  );
}
