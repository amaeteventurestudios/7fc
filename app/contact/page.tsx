import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import PageShell from "@/components/public/PageShell";
import ContactForm from "./ContactForm";
import { issueFormState } from "@/lib/formstate";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contact 7FC | Get in Touch",
  description:
    "Contact 7FC — general inquiries, Global 7 Wall support, privacy requests, legal notices, and security reports for the independent unofficial fan community.",
  alternates: { canonical: `${SITE_URL}/contact` },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/contact`,
    siteName: "7FC — Seven FC",
    title: "Contact 7FC",
    description: "Reach the 7FC team — support, privacy, legal, and security contacts.",
  },
};

const DIRECT = [
  ["General inquiries", "contact@sevenfc.net"],
  ["Global 7 Wall & technical support", "support@sevenfc.net"],
  ["Privacy requests", "privacy@sevenfc.net"],
  ["Legal, copyright & trademark", "legal@sevenfc.net"],
  ["Security reports", "security@sevenfc.net"],
] as const;

export default function ContactPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Contact 7FC",
    url: `${SITE_URL}/contact`,
    description:
      "Contact page for 7FC, an independent unofficial global fan community.",
  };
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <PageShell
        kicker="We read every message"
        title="Contact 7FC"
        intro="Questions, support, privacy, legal, or security — send a message below and it is routed to the right inbox. We review every submission, but we cannot guarantee a response to every message."
        wide
      >
        <div className="grid lg:grid-cols-[1.6fr_1fr] gap-8 items-start">
          <ContactForm formState={issueFormState()} />
          <aside className="glass-card p-6 md:p-8">
            <h2 className="font-display text-base font-bold text-gold-2 tracking-wide uppercase">
              Direct email
            </h2>
            <ul className="mt-5 space-y-4">
              {DIRECT.map(([label, addr]) => (
                <li key={addr}>
                  <p className="text-[11px] tracking-[0.2em] uppercase text-gray-500">{label}</p>
                  <a href={`mailto:${addr}`} className="text-sm text-gold-2 hover:text-gold underline underline-offset-4 break-all">
                    {addr}
                  </a>
                </li>
              ))}
            </ul>
            <p className="text-[11px] text-gray-500 mt-6 leading-relaxed">
              7FC is an independent, unofficial fan community. We don&rsquo;t publish
              a phone number or postal address. For privacy rights you can also
              use the dedicated{" "}
              <a href="/privacy-request" className="text-gold-2 underline underline-offset-2">
                Privacy Request
              </a>{" "}
              page.
            </p>
          </aside>
        </div>
      </PageShell>
    </>
  );
}
