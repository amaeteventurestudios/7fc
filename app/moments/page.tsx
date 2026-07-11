import type { Metadata } from "next";
import Link from "next/link";
import { getStore } from "@/lib/data";
import { SITE_URL } from "@/lib/site";
import { DisclaimerBar, Nav } from "@/components/public/TopSections";
import { Moments, QuoteBanner } from "@/components/public/MidSections";
import { SiteFooter } from "@/components/public/BottomSections";
import { EraProvider } from "@/components/public/EraContext";
import PageHero from "@/components/public/PageHero";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Iconic Moments | Performances That Defined the Number 7",
  description:
    "Relive the iconic moments behind the number 7 — Champions League nights, unforgettable goals, major titles, and record-breaking performances, curated by 7FC.",
  alternates: { canonical: `${SITE_URL}/moments` },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/moments`,
    siteName: "7FC — Seven FC",
    title: "Iconic Moments | Performances That Defined the Number 7",
    description:
      "Champions League nights, unforgettable goals, and major titles — the moments that defined the number 7.",
    images: [{ url: "/images/7fc-og-preview.webp", width: 1200, height: 630 }],
  },
};

export default async function MomentsPage() {
  const store = await getStore();
  const legal = await store.getLegal();
  return (
    <EraProvider>
      <DisclaimerBar text={legal.top_disclaimer} />
      <Nav />
      <main>
        <PageHero
          kicker="Nights That Made History"
          title="Iconic Moments"
          intro="Some performances become part of football memory forever. These are the nights and milestones fans still talk about — the moments that turned a number into a standard."
          crumb="Moments"
        />
        <Moments />
        <QuoteBanner />
        <p className="text-center text-sm text-gray-400 pb-16 px-4">
          Keep going:{" "}
          <Link href="/records" className="text-gold-2 hover:text-gold underline underline-offset-4">
            View the Record Wall
          </Link>
          {" · "}
          <Link href="/journey" className="text-gold-2 hover:text-gold underline underline-offset-4">
            Explore the Journey
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
