import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import PageShell from "@/components/public/PageShell";
import LegalArticle from "@/components/public/LegalArticle";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Community Guidelines | 7FC",
  description:
    "The rules of the Global 7 Wall: what belongs, what doesn't, how moderation works, and how to report a problem.",
  alternates: { canonical: `${SITE_URL}/community-guidelines` },
};

export default function CommunityGuidelinesPage() {
  return (
    <PageShell kicker="One code. One family." title="Community Guidelines">
      <LegalArticle
        sections={[
          {
            id: "spirit",
            title: "The spirit of the Wall",
            body: (
              <p>
                The Global 7 Wall is a celebration of discipline, hunger, and
                the standard behind the number 7 — fans from every country,
                side by side. Keep it worthy of that.
              </p>
            ),
          },
          {
            id: "prohibited",
            title: "Not allowed",
            body: (
              <ul>
                <li>Hate or discriminatory content of any kind</li>
                <li>Threats, harassment, or obscene abuse</li>
                <li>Impersonating any person, or fraudulent information</li>
                <li>Spam, advertising, or automated submissions</li>
                <li>Illegal content or malicious links</li>
                <li>Posting another person&rsquo;s private information</li>
                <li>Copyright- or trademark-infringing content</li>
                <li>Scripts, HTML, or any executable content</li>
                <li>Attempts to manipulate supporter numbers or bypass moderation</li>
              </ul>
            ),
          },
          {
            id: "moderation",
            title: "How moderation works",
            body: (
              <>
                <p>
                  Every submission is reviewed before it appears publicly, and
                  submission does not guarantee publication. 7FC may reject,
                  hide, correct obvious formatting, unpublish, or remove
                  content at any time. You keep ownership of what you write;
                  approved public submissions are displayed and may be indexed
                  by search engines and AI services according to the consent
                  you gave at signup.
                </p>
                <p>
                  Repeated or serious abuse can lead to blocking. Entries that
                  break these guidelines can be reported by anyone using the
                  &ldquo;Report an entry&rdquo; option on the{" "}
                  <a href="/wall">Wall page</a> — reports are confidential.
                </p>
              </>
            ),
          },
          {
            id: "removal",
            title: "Removing your own content",
            body: (
              <p>
                Want your entry changed, unpublished, or deleted? Use your
                private <a href="/manage">management link</a>, the{" "}
                <a href="/privacy-request">Privacy Request page</a>, or email{" "}
                <a href="mailto:support@sevenfc.net">support@sevenfc.net</a>. For
                legal or rights issues use{" "}
                <a href="mailto:legal@sevenfc.net">legal@sevenfc.net</a>.
              </p>
            ),
          },
        ]}
      />
    </PageShell>
  );
}
