import type { Metadata } from "next";
import Link from "next/link";
import { getStore } from "@/lib/data";
import { SITE_URL, OG_PREVIEW_IMAGE } from "@/lib/site";
import { DisclaimerBar, Nav } from "@/components/public/TopSections";
import { RecordWall } from "@/components/public/MidSections";
import { SiteFooter } from "@/components/public/BottomSections";
import { EraProvider } from "@/components/public/EraContext";
import PageHero from "@/components/public/PageHero";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Record Wall | Milestones Behind the Number 7",
  description:
    "The Record Wall — all-time goals, international records, Champions League milestones, and the numbers that defined the number 7, curated by 7FC.",
  alternates: { canonical: `${SITE_URL}/records` },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/records`,
    siteName: "7FC — Seven FC",
    title: "Record Wall | Milestones Behind the Number 7",
    description:
      "All-time goals, international records, and the milestones that defined the number 7.",
    images: [{ url: OG_PREVIEW_IMAGE, width: 1200, height: 630 }],
  },
};

export default async function RecordsPage() {
  const store = await getStore();
  const legal = await store.getLegal();
  return (
    <EraProvider>
      <DisclaimerBar text={legal.top_disclaimer} />
      <Nav />
      <main id="main-content">
        <PageHero
          kicker="The Numbers Tell the Story"
          title="The Record Wall"
          intro="Records are receipts for two decades of relentless output. These are the milestones — goals, titles, and firsts — that turned the number 7 into a global standard for delivery under pressure."
          crumb="Records"
        />
        <RecordWall />
        <p className="text-center text-sm text-gray-400 pb-16 px-4">
          Keep going:{" "}
          <Link href="/moments" className="text-gold-2 hover:text-gold underline underline-offset-4">
            See Iconic Moments
          </Link>
          {" · "}
          <Link href="/wall" className="text-gold-2 hover:text-gold underline underline-offset-4">
            Visit the Global Supporter Wall
          </Link>
          {" · "}
          <Link href="/kit" className="text-gold-2 hover:text-gold underline underline-offset-4">
            Explore the 7FC Kit
          </Link>
        </p>
      </main>
      <SiteFooter legal={legal} />
    </EraProvider>
  );
}
