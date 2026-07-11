import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import { COOKIE_POLICY_VERSION } from "@/lib/policy";
import PageShell from "@/components/public/PageShell";
import LegalArticle from "@/components/public/LegalArticle";
import CookieSettingsButton from "@/components/public/CookieSettingsButton";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cookie Policy | 7FC",
  description:
    "The cookies and similar technologies 7FC actually uses — strictly necessary only, no analytics, no advertising — and how to manage your preferences.",
  alternates: { canonical: `${SITE_URL}/cookies` },
};

export default function CookiesPage() {
  return (
    <PageShell kicker="Your privacy, your choice" title="Cookie Policy">
      <LegalArticle
        effectiveDate={COOKIE_POLICY_VERSION}
        lastUpdated={COOKIE_POLICY_VERSION}
        sections={[
          {
            id: "summary",
            title: "The short version",
            body: (
              <p>
                7FC currently uses <strong>only strictly necessary
                technologies</strong>. We run no analytics, no advertising or
                marketing trackers, no social-media pixels, no embedded-media
                cookies, and no fingerprinting. Because nothing optional is in
                use, no consent banner interrupts your visit — this page and
                the Cookie Settings control exist so you can verify that and
                manage preferences if optional categories are ever introduced.
              </p>
            ),
          },
          {
            id: "inventory",
            title: "Exact inventory",
            body: (
              <>
                <ul>
                  <li>
                    <strong>7fc_admin_session</strong> (cookie, first-party) —
                    keeps a site administrator signed in to the protected admin
                    area. Only set when an administrator logs in; ordinary
                    visitors never receive it. Necessary. Expires after 8
                    hours.
                  </li>
                  <li>
                    <strong>7fc_cookie_prefs</strong> (cookie, first-party) —
                    remembers your cookie-preference choice and the policy
                    version you saw. Set only when you save a choice in Cookie
                    Settings. Necessary. Expires after 12 months.
                  </li>
                  <li>
                    <strong>Cloudflare security cookies</strong> (e.g.{" "}
                    <code>cf_clearance</code>) — may be set by our host,
                    Cloudflare, when a security challenge or Turnstile
                    human-verification runs on forms. Strictly necessary for
                    abuse protection.
                  </li>
                </ul>
                <p>
                  We use no localStorage or sessionStorage for tracking, and
                  affiliate links to retailers contain a 7FC referral tag but
                  set no cookies on this site. Cookies the retailer sets on its
                  own site are governed by the retailer&rsquo;s policies.
                </p>
              </>
            ),
          },
          {
            id: "consent",
            title: "Your controls",
            body: (
              <>
                <p>
                  Open Cookie Settings any time (also linked in the footer) to
                  review categories, and to accept or reject optional
                  categories if any are ever added. Rejecting is always as easy
                  as accepting, nothing optional is preselected, and optional
                  technologies would never load before consent. We honor Global
                  Privacy Control browser signals for optional categories.
                </p>
                <CookieSettingsButton />
              </>
            ),
          },
          {
            id: "changes",
            title: "If this ever changes",
            body: (
              <p>
                If 7FC introduces analytics or any other optional technology,
                this policy will be updated first, the consent interface will
                ask before anything loads, and previously saved preferences
                will be re-requested because the policy version changes.
                Questions:{" "}
                <a href="mailto:privacy@sevenfc.net">privacy@sevenfc.net</a>.
              </p>
            ),
          },
        ]}
      />
    </PageShell>
  );
}
