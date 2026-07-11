import type { MetadataRoute } from "next";
import { getStore } from "@/lib/data";
import { productSlug } from "@/lib/kit";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const store = await getStore();
  const products = await store.listActiveProducts();
  const now = new Date();

  const majorPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/kit`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/wall`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/journey`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/moments`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/records`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
  ];

  const productPages: MetadataRoute.Sitemap = products
    .filter((p) => p.active && p.indexable)
    .map((p) => ({
      url: `${SITE_URL}/kit/${productSlug(p)}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

  return [...majorPages, ...productPages];
}
