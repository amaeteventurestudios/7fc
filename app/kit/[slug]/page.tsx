import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStore } from "@/lib/data";
import { productSlug, productImage, pickRelated } from "@/lib/kit";
import { SITE_URL } from "@/lib/site";
import { DisclaimerBar, Nav } from "@/components/public/TopSections";
import { SiteFooter } from "@/components/public/BottomSections";
import KitProductPage from "@/components/public/KitProductPage";

export const dynamic = "force-dynamic";

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
  const ogImage = product.og_image || productImage(product);
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/kit/${slug}` },
    robots: product.indexable
      ? { index: true, follow: true }
      : { index: false, follow: true },
    openGraph: {
      type: "website",
      url: `${SITE_URL}/kit/${slug}`,
      siteName: "7FC — Seven FC",
      title: product.og_title || title,
      description: product.og_description || description,
      images: [{ url: ogImage, alt: product.image_alt || product.title }],
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
  const url = `${SITE_URL}/kit/${slug}`;

  // Editorial affiliate page: no offers, prices, ratings, or seller claims.
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: product.seo_title || product.title,
      url,
      description: product.seo_description || product.description,
    },
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.title,
      description: product.description,
      image: `${SITE_URL}${productImage(product)}`,
      url,
      ...(product.brand ? { brand: { "@type": "Brand", name: product.brand } } : {}),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "7FC Kit", item: `${SITE_URL}/kit` },
        {
          "@type": "ListItem",
          position: 3,
          name: product.short_title || product.title,
          item: url,
        },
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
      <main id="main-content">
        <KitProductPage product={product} related={related} />
      </main>
      <SiteFooter legal={legal} />
    </>
  );
}
