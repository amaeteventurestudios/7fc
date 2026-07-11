import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * RFC 9309 robots policy. robots.txt is guidance for crawlers, not security:
 * private routes are additionally protected by authentication, tokens, and
 * noindex metadata. Public content (including CSS/JS/images) stays crawlable.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/api/",
          "/verify",
          "/manage",
          "/privacy-request/verify",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
