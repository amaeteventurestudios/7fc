import type { Metadata } from "next";
import Link from "next/link";
import { getStore } from "@/lib/data";
import { SITE_URL, OG_PREVIEW_IMAGE } from "@/lib/site";
import { DisclaimerBar, Nav } from "@/components/public/TopSections";
import { Journey, ChooseEra } from "@/components/public/MidSections";
import { SiteFooter } from "@/components/public/BottomSections";
import { EraProvider } from "@/components/public/EraContext";
import PageHero from "@/components/public/PageHero";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "The Journey | Defining Eras Behind the Number 7",
  description:
    "Follow the journey behind the number 7 — from Sporting to Manchester, Madrid, Turin, Riyadh, and Portugal. The defining eras, standards, and mentality, told by 7FC.",
  alternates: { canonical: `${SITE_URL}/journey` },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/journey`,
    siteName: "7FC — Seven FC",
    title: "The Journey | Defining Eras Behind the Number 7",
    description:
      "The defining eras and standards behind the number 7, told by 7FC — an unofficial fan tribute.",
    images: [{ url: OG_PREVIEW_IMAGE, width: 1200, height: 630 }],
  },
};

export default async function JourneyPage() {
  const store = await getStore();
  const legal = await store.getLegal();
  return (
    <EraProvider>
      <DisclaimerBar text={legal.top_disclaimer} />
      <Nav />
      <main>
        <PageHero
          kicker="From Madeira to the World"
          title="The Journey"
          intro="Every era carried the same standard: relentless work, discipline, and delivery under pressure. Trace the defining chapters behind the number 7 — club by club, era by era — and choose the one that shaped your football story."
          crumb="Journey"
        />
        <Journey />
        <ChooseEra />
        <p className="text-center text-sm text-gray-400 pb-16 px-4">
          Keep going:{" "}
          <Link href="/moments" className="text-gold-2 hover:text-gold underline underline-offset-4">
            See Iconic Moments
          </Link>
          {" · "}
          <Link href="/records" className="text-gold-2 hover:text-gold underline underline-offset-4">
            View the Record Wall
          </Link>
          {" · "}
          <Link href="/wall" className="text-gold-2 hover:text-gold underline underline-offset-4">
            Visit the Global Supporter Wall
          </Link>
        </p>
      </main>
      <SiteFooter legal={legal} />
    </EraProvider>
  );
}
