import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import { TERMS_VERSION } from "@/lib/policy";
import PageShell from "@/components/public/PageShell";
import LegalArticle from "@/components/public/LegalArticle";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Terms of Use | 7FC",
  description:
    "The Terms of Use for 7FC, the independent unofficial global fan community — participation, the Global 7 Wall, content rules, and legal terms.",
  alternates: { canonical: `${SITE_URL}/terms` },
};

export default function TermsPage() {
  return (
    <PageShell kicker="Read before you raise your 7" title="Terms of Use">
      <LegalArticle
        effectiveDate={TERMS_VERSION}
        lastUpdated={TERMS_VERSION}
        sections={[
          {
            id: "acceptance",
            title: "Acceptance of these Terms",
            body: (
              <p>
                Welcome to 7FC (<strong>&ldquo;7FC,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;</strong>), available at{" "}
                <a href="https://sevenfc.net">sevenfc.net</a>. By using this
                website — browsing, joining the Global 7 Wall, or contacting us
                — you agree to these Terms of Use. If you do not agree, please
                do not use the site. These Terms apply together with our{" "}
                <a href="/privacy">Privacy Policy</a>,{" "}
                <a href="/cookies">Cookie Policy</a>,{" "}
                <a href="/community-guidelines">Community Guidelines</a>,{" "}
                <a href="/affiliate-disclosure">Affiliate Disclosure</a>, and{" "}
                <a href="/disclaimer">Fan &amp; Intellectual Property Disclaimer</a>.
              </p>
            ),
          },
          {
            id: "about",
            title: "What 7FC is (and is not)",
            body: (
              <>
                <p>
                  7FC is an independent, unofficial global fan community
                  celebrating the discipline, legacy, mentality, and cultural
                  impact associated with the number 7. It is operated as an
                  independent, California-based sole proprietorship.
                </p>
                <p>
                  <strong>7FC is not affiliated with or endorsed by Cristiano
                  Ronaldo, CR7, any club, league, federation, retailer,
                  manufacturer, marketplace, or other rights holder.</strong>{" "}
                  Nothing on this site claims or implies official status.
                </p>
              </>
            ),
          },
          {
            id: "eligibility",
            title: "Age eligibility",
            body: (
              <p>
                Anyone may browse 7FC. Joining the Global 7 Wall (which
                involves submitting personal information) is limited to people
                aged <strong>16 or older</strong>. The signup form requires you
                to confirm your age; if you cannot, the signup is not completed
                and the form data is not retained.
              </p>
            ),
          },
          {
            id: "wall",
            title: "The Global 7 Wall",
            body: (
              <>
                <p>
                  When you join the Global 7 Wall you submit your first name,
                  optional last name, email address, country, optional favorite
                  era, and an optional message. You must verify your email
                  address before your entry can proceed. Once verified, a clean
                  submission may be published automatically; submissions our
                  safety checks flag are held for manual review first. 7FC may
                  review, hide, reject, unpublish, or remove any entry at any
                  time, and automatic publication does not guarantee permanent
                  publication. Your email address always stays private; your
                  last name appears only if you explicitly choose to show your
                  full name.
                </p>
                <p>
                  Publication requires your separate, explicit public-display
                  consent. Supporter numbers are assigned by the system and
                  cannot be chosen, traded, or manipulated. Submission does not
                  guarantee publication.
                </p>
              </>
            ),
          },
          {
            id: "your-content",
            title: "Your content and our limited permission",
            body: (
              <>
                <p>
                  You own the content you submit. By submitting an entry with
                  public-display consent, you grant 7FC a non-exclusive,
                  worldwide, royalty-free permission to review, moderate,
                  store, display, format, and distribute your approved public
                  submission on the Global 7 Wall and in 7FC&rsquo;s public data
                  files, for as long as your entry remains published. You can
                  withdraw public-display consent, unpublish, or delete your
                  entry at any time using your management link or the{" "}
                  <a href="/privacy-request">Privacy Request</a> page.
                </p>
                <p>
                  Approved public content may be crawled, indexed, cached, or
                  summarized by third-party search engines and AI services. 7FC
                  does not control those third-party systems, and removal from
                  7FC does not guarantee immediate removal from external
                  caches.
                </p>
              </>
            ),
          },
          {
            id: "conduct",
            title: "Prohibited conduct",
            body: (
              <>
                <p>You agree not to:</p>
                <ul>
                  <li>impersonate any person or misrepresent an affiliation;</li>
                  <li>submit spam, advertising, or automated submissions;</li>
                  <li>harass, threaten, or abuse anyone, or submit hateful or illegal content;</li>
                  <li>submit another person&rsquo;s private information;</li>
                  <li>submit content that infringes copyright, trademark, or other rights;</li>
                  <li>attempt to bypass verification, moderation, rate limits, or security controls;</li>
                  <li>attempt to manipulate supporter numbers;</li>
                  <li>interfere with the operation or security of the site.</li>
                </ul>
                <p>
                  See the <a href="/community-guidelines">Community Guidelines</a>{" "}
                  for details.
                </p>
              </>
            ),
          },
          {
            id: "moderation",
            title: "Moderation, rejection, and removal",
            body: (
              <p>
                We may review, approve, reject, hide, edit for obvious
                formatting, unpublish, or remove any submission at any time,
                with or without notice, including content reported by other
                visitors through the &ldquo;Report an entry&rdquo; feature. We may
                suspend or block access for abuse, and may remove entries to
                comply with law or protect the community.
              </p>
            ),
          },
          {
            id: "affiliate",
            title: "Affiliate links and third-party retailers",
            body: (
              <>
                <p>
                  The 7FC Kit contains affiliate links to third-party
                  retailers, including Amazon.{" "}
                  <strong>As an Amazon Associate I earn from qualifying
                  purchases.</strong> Purchases happen entirely on the
                  retailer&rsquo;s site: 7FC is not the seller, manufacturer,
                  shipper, warrantor, or customer-service provider for any
                  affiliate product. The retailer controls price, availability,
                  fulfillment, returns, and support. Review the current
                  retailer listing before purchasing. See the{" "}
                  <a href="/affiliate-disclosure">Affiliate Disclosure</a>.
                </p>
              </>
            ),
          },
          {
            id: "ip",
            title: "Intellectual property",
            body: (
              <>
                <p>
                  The 7FC name, site design, and original editorial content are
                  owned by 7FC. Third-party names, logos, trademarks,
                  photographs, and other intellectual property referenced on
                  this fan site belong to their respective owners and are used
                  for identification, commentary, and fan-community purposes
                  only. See the <a href="/disclaimer">Disclaimer</a>.
                </p>
                <p>
                  Copyright, trademark, or other IP complaints:{" "}
                  <a href="mailto:legal@sevenfc.net">legal@sevenfc.net</a>. Include
                  the material at issue, its location on the site, your rights
                  basis, and your contact information. We review every notice
                  and remove or restrict content where appropriate.
                </p>
              </>
            ),
          },
          {
            id: "third-party",
            title: "Third-party websites",
            body: (
              <p>
                Links to third-party sites (including retailer listings) are
                provided for convenience. 7FC does not control and is not
                responsible for third-party content, policies, or practices.
                You use external links at your own discretion.
              </p>
            ),
          },
          {
            id: "disclaimers",
            title: "Disclaimers",
            body: (
              <p>
                The site is provided <strong>&ldquo;as is&rdquo; and &ldquo;as
                available&rdquo;</strong> without warranties of any kind, express or
                implied, including merchantability, fitness for a particular
                purpose, accuracy, and non-infringement. 7FC does not warrant
                that the site will be uninterrupted, error-free, or secure.
                Editorial content is opinion and general information, not
                professional advice.
              </p>
            ),
          },
          {
            id: "liability",
            title: "Limitation of liability",
            body: (
              <p>
                To the maximum extent permitted by law, 7FC will not be liable
                for indirect, incidental, special, consequential, or punitive
                damages, or loss of data, goodwill, or profits, arising from
                your use of the site. To the extent any liability cannot be
                excluded, 7FC&rsquo;s total liability for all claims relating to the
                site is limited to one hundred US dollars (US$100). Some
                jurisdictions do not allow certain exclusions, so parts of this
                section may not apply to you.
              </p>
            ),
          },
          {
            id: "indemnity",
            title: "Indemnification",
            body: (
              <p>
                If your submission or your misuse of the site causes a
                third-party claim against 7FC, you agree to reasonably
                cooperate with us and to cover losses and reasonable costs that
                directly result from your violation of these Terms — except to
                the extent the loss was caused by 7FC.
              </p>
            ),
          },
          {
            id: "termination",
            title: "Suspension and termination",
            body: (
              <p>
                We may suspend or terminate access to the site or remove
                entries for violations of these Terms, suspected abuse, legal
                requirements, or discontinuation of the service. You may leave
                at any time by deleting your entry via your management link or
                a <a href="/privacy-request">privacy request</a>.
              </p>
            ),
          },
          {
            id: "changes",
            title: "Changes to these Terms",
            body: (
              <p>
                We may update these Terms from time to time. The effective date
                above always reflects the current version, and material changes
                will be indicated on this page. Continued use of the site after
                a change means you accept the updated Terms.
              </p>
            ),
          },
          {
            id: "law",
            title: "Governing law and severability",
            body: (
              <p>
                These Terms are governed by the laws of the State of
                California, USA, without regard to conflict-of-law rules.
                Disputes are subject to the courts located in California,
                unless applicable consumer law gives you the right to another
                venue. If any provision of these Terms is found unenforceable,
                the rest remains in effect.
              </p>
            ),
          },
          {
            id: "contact",
            title: "Contact",
            body: (
              <p>
                Legal questions about these Terms:{" "}
                <a href="mailto:legal@sevenfc.net">legal@sevenfc.net</a>. General
                contact: <a href="/contact">sevenfc.net/contact</a>.
              </p>
            ),
          },
        ]}
      />
    </PageShell>
  );
}
