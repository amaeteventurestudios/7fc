import type { Metadata } from "next";
import { getStore } from "@/lib/data";
import { SITE_URL, OG_PREVIEW_IMAGE } from "@/lib/site";
import { DisclaimerBar, Nav } from "@/components/public/TopSections";
import { SiteFooter } from "@/components/public/BottomSections";
import KitCollection from "@/components/public/KitCollection";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "7FC Kit | Football Collectibles, Training Gear and Fan Picks",
  description:
    "The 7FC Kit — a curated collection of football collectibles, fragrance, fan display pieces, apparel, and training gear, each with an honest 7FC editorial breakdown.",
  alternates: { canonical: `${SITE_URL}/kit` },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/kit`,
    siteName: "7FC — Seven FC",
    title: "7FC Kit | Football Collectibles, Training Gear and Fan Picks",
    description:
      "A curated collection of football collectibles, fragrance, fan display pieces, apparel, and training gear from the 7FC Kit.",
    images: [{ url: OG_PREVIEW_IMAGE, width: 1200, height: 630 }],
  },
};

export default async function KitPage() {
  const store = await getStore();
  const [products, legal] = await Promise.all([
    store.listActiveProducts(),
    store.getLegal(),
  ]);

  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "The 7FC Kit",
      url: `${SITE_URL}/kit`,
      description:
        "A curated collection of football collectibles, fragrance, fan display pieces, apparel, and training gear from 7FC, an unofficial fan tribute.",
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "7FC Kit", item: `${SITE_URL}/kit` },
      ],
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <DisclaimerBar text={legal.top_disclaimer} />
      <Nav />
      <main>
        <KitCollection
          products={products}
          disclosure={legal.affiliate_disclosure}
        />
      </main>
      <SiteFooter legal={legal} />
    </>
  );
}
