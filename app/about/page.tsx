import type { Metadata } from "next";
import Link from "next/link";
import { getStore } from "@/lib/data";
import { SITE_URL, OG_PREVIEW_IMAGE } from "@/lib/site";
import { DisclaimerBar, Nav } from "@/components/public/TopSections";
import { AboutFaqFooter } from "@/components/public/BottomSections";
import PageHero from "@/components/public/PageHero";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "About 7FC | An Unofficial Fan Tribute to the Number 7",
  description:
    "7FC is an independent, unofficial fan tribute and football culture site celebrating the legacy, discipline, and global fan energy behind the number 7. Learn what 7FC is and what it stands for.",
  alternates: { canonical: `${SITE_URL}/about` },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/about`,
    siteName: "7FC — Seven FC",
    title: "About 7FC | An Unofficial Fan Tribute to the Number 7",
    description:
      "What 7FC is, what it stands for, and why it exists — an independent, unofficial fan tribute.",
    images: [{ url: OG_PREVIEW_IMAGE, width: 1200, height: 630 }],
  },
};

export default async function AboutPage() {
  const store = await getStore();
  const legal = await store.getLegal();
  return (
    <>
      <DisclaimerBar text={legal.top_disclaimer} />
      <Nav />
      <main id="main-content">
        <PageHero
          kicker="For the Fans. For the Legacy."
          title="About 7FC"
          intro="7FC (Seven FC) is an independent, unofficial fan tribute and football culture site. It exists to celebrate a standard — the discipline, mentality, records, and global fan energy associated with the number 7 — and to give supporters around the world a place to raise their 7."
          crumb="About"
        />
        <div className="text-center text-sm text-gray-400 mt-8 px-4">
          <Link href="/wall" className="text-gold-2 hover:text-gold underline underline-offset-4">
            Visit the Global Supporter Wall
          </Link>
          {" · "}
          <Link href="/journey" className="text-gold-2 hover:text-gold underline underline-offset-4">
            Explore the Journey
          </Link>
          {" · "}
          <Link href="/kit" className="text-gold-2 hover:text-gold underline underline-offset-4">
            Explore the 7FC Kit
          </Link>
        </div>
      </main>
      <AboutFaqFooter legal={legal} />
    </>
  );
}
