import type { Metadata } from "next";
import { getStore } from "@/lib/data";
import { DisclaimerBar, Nav } from "@/components/public/TopSections";
import { SiteFooter } from "@/components/public/BottomSections";
import VerifyClient from "./VerifyClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Confirm your email | 7FC",
  robots: { index: false, follow: false },
};

export default async function VerifyPage() {
  const store = await getStore();
  const legal = await store.getLegal();
  return (
    <>
      <DisclaimerBar text={legal.top_disclaimer} />
      <Nav />
      <main id="main-content">
        <VerifyClient />
      </main>
      <SiteFooter legal={legal} />
    </>
  );
}
