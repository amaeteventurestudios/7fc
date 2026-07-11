import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import PageShell from "@/components/public/PageShell";
import LegalArticle from "@/components/public/LegalArticle";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Fan & Intellectual Property Disclaimer | 7FC",
  description:
    "7FC is an independent, unofficial fan community. Trademarks, names, and images referenced on this site belong to their respective owners.",
  alternates: { canonical: `${SITE_URL}/disclaimer` },
};

export default function DisclaimerPage() {
  return (
    <PageShell kicker="Unofficial, and proud of it" title="Fan & IP Disclaimer">
      <LegalArticle
        sections={[
          {
            id: "unofficial",
            title: "Independent and unofficial",
            body: (
              <p>
                7FC is an independent, unofficial global fan community.{" "}
                <strong>7FC is not affiliated with or endorsed by Cristiano
                Ronaldo, CR7, any club, league, federation, Amazon, retailer,
                manufacturer, marketplace, or other rights holder.</strong> 7FC
                does not claim official status of any kind.
              </p>
            ),
          },
          {
            id: "ip",
            title: "Third-party intellectual property",
            body: (
              <p>
                Names, logos, trademarks, service marks, product names,
                photographs, and other intellectual property referenced on this
                site belong to their respective owners. References on 7FC are
                used for identification, commentary, appreciation, editorial
                presentation, and fan-community purposes where applicable.
                Nothing on this site grants — or claims to grant — any license
                to use protected material.
              </p>
            ),
          },
          {
            id: "products",
            title: "Products and retailers",
            body: (
              <p>
                7FC does not manufacture, sell, ship, warrant, or service any
                third-party product. Product purchases occur on third-party
                retailer sites, which control pricing, availability,
                specifications, fulfillment, returns, and support. Product
                imagery in the 7FC Kit is stylized editorial visualization, as
                labeled on every Kit page. External links are used at the
                visitor&rsquo;s discretion.
              </p>
            ),
          },
          {
            id: "complaints",
            title: "Rights-holder concerns",
            body: (
              <p>
                If you are a rights holder and believe content on this site
                oversteps, contact{" "}
                <a href="mailto:legal@sevenfc.net">legal@sevenfc.net</a>. We take
                every notice seriously and act promptly where appropriate.
              </p>
            ),
          },
        ]}
      />
    </PageShell>
  );
}
