import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStore } from "@/lib/data";
import { productSlug, productImage, pickRelated } from "@/lib/kit";
import { DisclaimerBar, Nav } from "@/components/public/TopSections";
import { SiteFooter } from "@/components/public/BottomSections";
import KitProductPage from "@/components/public/KitProductPage";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://sevenfc.net";

async function getProduct(slug: string) {
  const store = await getStore();
  const products = await store.listActiveProducts();
  const product = products.find((p) => productSlug(p) === slug) ?? null;
  return { store, products, product };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { product } = await getProduct(slug);
  if (!product) return { title: "7FC Kit" };
  const title = product.seo_title || `${product.title} — 7FC Kit`;
  const description =
    product.seo_description ||
    `${product.description} An unofficial fan-favorite pick from the 7FC Kit.`;
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/kit/${slug}` },
    openGraph: {
      type: "website",
      url: `${SITE_URL}/kit/${slug}`,
      siteName: "7FC — Seven FC",
      title,
      description,
      images: [{ url: productImage(product) }],
    },
  };
}

export default async function KitProductRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { store, products, product } = await getProduct(slug);
  if (!product) notFound();
  const legal = await store.getLegal();
  const related = pickRelated(product, products);

  return (
    <>
      <DisclaimerBar text={legal.top_disclaimer} />
      <Nav />
      <main>
        <KitProductPage
          product={product}
          related={related}
          disclosure={legal.affiliate_disclosure}
        />
      </main>
      <SiteFooter legal={legal} />
    </>
  );
}
