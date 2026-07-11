import type { MetadataRoute } from "next";
import { getStore } from "@/lib/data";
import { productSlug } from "@/lib/kit";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

/** Legal pages change with policy versions, not every build. */
const POLICY_DATE = new Date("2026-07-11T00:00:00Z");

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
    { url: `${SITE_URL}/contact`, lastModified: POLICY_DATE, changeFrequency: "yearly", priority: 0.5 },
    { url: `${SITE_URL}/privacy-request`, lastModified: POLICY_DATE, changeFrequency: "yearly", priority: 0.4 },
    { url: `${SITE_URL}/terms`, lastModified: POLICY_DATE, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/privacy`, lastModified: POLICY_DATE, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/cookies`, lastModified: POLICY_DATE, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/affiliate-disclosure`, lastModified: POLICY_DATE, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/disclaimer`, lastModified: POLICY_DATE, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/community-guidelines`, lastModified: POLICY_DATE, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/accessibility`, lastModified: POLICY_DATE, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/security`, lastModified: POLICY_DATE, changeFrequency: "yearly", priority: 0.3 },
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
