import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import PageShell from "@/components/public/PageShell";
import LegalArticle from "@/components/public/LegalArticle";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Affiliate Disclosure | 7FC",
  description:
    "7FC's affiliate relationships explained: Amazon Associates participation, how affiliate links work, and what 7FC does and does not control.",
  alternates: { canonical: `${SITE_URL}/affiliate-disclosure` },
};

export default function AffiliateDisclosurePage() {
  return (
    <PageShell kicker="Full transparency" title="Affiliate Disclosure">
      <LegalArticle
        sections={[
          {
            id: "amazon",
            title: "Amazon Associates",
            body: (
              <>
                <p>
                  <strong>As an Amazon Associate I earn from qualifying
                  purchases.</strong>
                </p>
                <p>
                  Pages in the 7FC Kit contain affiliate links. If you make a
                  qualifying purchase through one of these links, 7FC may earn
                  a commission at no additional cost to you. Affiliate links
                  are marked near each recommendation and call to action —
                  not only here.
                </p>
              </>
            ),
          },
          {
            id: "how",
            title: "How affiliate links work here",
            body: (
              <>
                <ul>
                  <li>Clicking an affiliate link takes you to the retailer&rsquo;s site (for example, Amazon). The purchase happens entirely there.</li>
                  <li>The retailer — not 7FC — controls price, availability, product information, fulfillment, shipping, returns, warranties, and customer service.</li>
                  <li>7FC is not the seller or manufacturer of any product, and does not publish prices, ratings, or reviews of its own — always check the current retailer listing before buying.</li>
                  <li>Affiliate links use <code>rel=&quot;sponsored&quot;</code> so search engines know they are commercial.</li>
                </ul>
              </>
            ),
          },
          {
            id: "independence",
            title: "Independence",
            body: (
              <p>
                Amazon and the manufacturers of listed products do not endorse,
                sponsor, or operate 7FC. Kit picks are 7FC&rsquo;s own editorial
                selections; earning a commission never changes what an entry
                says. The cinematic Kit images are stylized editorial
                visualizations, clearly labeled as such on every product page
                and card — see the notice on each Kit page.
              </p>
            ),
          },
          {
            id: "contact",
            title: "Questions",
            body: (
              <p>
                Questions about affiliate relationships:{" "}
                <a href="mailto:contact@sevenfc.net">contact@sevenfc.net</a>.
              </p>
            ),
          },
        ]}
      />
    </PageShell>
  );
}
