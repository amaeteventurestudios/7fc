import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import { PRIVACY_VERSION } from "@/lib/policy";
import PageShell from "@/components/public/PageShell";
import LegalArticle from "@/components/public/LegalArticle";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Privacy Policy | 7FC",
  description:
    "How 7FC collects, uses, protects, and deletes personal information — the Global 7 Wall, email verification, contact forms, cookies, and your rights.",
  alternates: { canonical: `${SITE_URL}/privacy` },
};

export default function PrivacyPage() {
  return (
    <PageShell kicker="Your email stays private. Always." title="Privacy Policy">
      <LegalArticle
        effectiveDate={PRIVACY_VERSION}
        lastUpdated={PRIVACY_VERSION}
        sections={[
          {
            id: "who",
            title: "Who is responsible",
            body: (
              <p>
                This site is operated by 7FC, an independent, unofficial global
                fan community based in California, USA. 7FC is the controller
                / responsible party for personal information processed through{" "}
                <a href="https://sevenfc.net">sevenfc.net</a>. Privacy contact:{" "}
                <a href="mailto:privacy@sevenfc.net">privacy@sevenfc.net</a>.
              </p>
            ),
          },
          {
            id: "collect",
            title: "What we collect",
            body: (
              <>
                <p><strong>Global 7 Wall signup:</strong></p>
                <ul>
                  <li>First name, optional last name</li>
                  <li>Email address (never published)</li>
                  <li>Country</li>
                  <li>Optional favorite era and supporter message</li>
                  <li>Supporter number (assigned by us)</li>
                  <li>Public-display preference and marketing preference</li>
                  <li>Age attestation (that you confirmed being 16+; we do not collect your birth date)</li>
                  <li>Email-verification status and timestamps</li>
                  <li>Consent records with the policy versions you accepted</li>
                  <li>Moderation status and publication timestamps</li>
                </ul>
                <p><strong>Contact form:</strong> name, email, category, subject, and message.</p>
                <p><strong>Privacy requests:</strong> your email, request type, optional details, and the request&rsquo;s verification/completion state.</p>
                <p>
                  <strong>Technical data:</strong> our host (Cloudflare)
                  processes IP addresses and request metadata to serve and
                  protect the site (rate limiting, abuse prevention, bot
                  detection via Cloudflare Turnstile). Turnstile is an
                  essential fraud-prevention and security service provided by
                  Cloudflare: when you submit a protected form it processes
                  technical signals (such as your IP address and browser
                  characteristics) solely to distinguish people from bots — it
                  is not advertising or marketing and we never use it to track
                  you across sites. For abuse prevention we keep short-lived
                  rate-limit counters keyed by a one-way keyed hash of the IP
                  address or email (raw IPs are never stored in our database);
                  each counter expires with its window — at most 24 hours —
                  and expired counters are purged automatically. Reports use
                  at most a truncated, salted hash for duplicate protection. Email delivery events (sent, bounced,
                  complained) are recorded with our email provider&rsquo;s message
                  IDs; hard-bounced or complaining addresses go on a minimal
                  suppression list so we stop emailing them.
                </p>
              </>
            ),
          },
          {
            id: "purposes",
            title: "Why we use it (purposes and legal bases)",
            body: (
              <>
                <ul>
                  <li><strong>Running the Global 7 Wall</strong> — creating, verifying, moderating, and (with your consent) publishing your entry. Legal bases where GDPR applies: contract (providing the service you requested) and consent (public display, marketing preference).</li>
                  <li><strong>Transactional email</strong> — verification, welcome, management links, contact acknowledgments, privacy-request confirmations (contract / legitimate interest).</li>
                  <li><strong>Owner notifications</strong> — an internal alert when a verified signup or privacy request arrives (legitimate interest in operating the community).</li>
                  <li><strong>Moderation, security, and fraud prevention</strong> — reviewing content, handling reports, rate limiting, bot protection (legitimate interest / legal obligation).</li>
                  <li><strong>Answering messages</strong> you send us (legitimate interest / consent).</li>
                </ul>
                <p>We do not sell personal information, and we do not use it for third-party advertising.</p>
              </>
            ),
          },
          {
            id: "public",
            title: "What is public vs. private",
            body: (
              <>
                <p>
                  <strong>Public (only after email verification, moderation
                  approval, and your explicit public-display consent):</strong>{" "}
                  first name, last-name initial (or full last name only if you
                  chose that), country, favorite era, supporter message,
                  supporter number, and signup month.
                </p>
                <p>
                  <strong>Always private:</strong> your email address, full
                  last name (unless you opted in), consent records, moderation
                  notes, and everything else. Approved public content may be
                  indexed, cached, or summarized by search engines and AI
                  services; withdrawing consent removes it from our site and
                  data files promptly, but third-party caches are outside our
                  control and may take time to update.
                </p>
              </>
            ),
          },
          {
            id: "providers",
            title: "Service providers",
            body: (
              <>
                <ul>
                  <li><strong>Cloudflare</strong> (USA) — hosting, CDN, database (D1), object storage, bot protection (Turnstile). Cloudflare may set strictly necessary cookies for security challenges.</li>
                  <li><strong>Resend</strong> (USA) — transactional email delivery, when configured. The provider processes recipient addresses and message content to deliver email.</li>
                  <li><strong>Amazon</strong> — if you click a Kit affiliate link you leave our site; Amazon&rsquo;s own privacy policy applies there. Our affiliate links contain a tag identifying 7FC but we send no personal data with them.</li>
                </ul>
                <p>
                  These providers process data on our behalf under their
                  standard data-protection terms. Data is processed in the
                  United States; where GDPR applies, transfers rely on the
                  providers&rsquo; standard contractual clauses / Data Privacy
                  Framework participation.
                </p>
              </>
            ),
          },
          {
            id: "cookies",
            title: "Cookies",
            body: (
              <p>
                7FC uses only strictly necessary technologies: an
                administrator session cookie (admin area only), a cookie that
                remembers your cookie-preference choice, and Cloudflare&rsquo;s
                security cookies where required. We run <strong>no analytics,
                no advertising trackers, and no fingerprinting</strong>. Details
                and controls: <a href="/cookies">Cookie Policy</a>.
              </p>
            ),
          },
          {
            id: "retention",
            title: "How long we keep information",
            body: (
              <>
                <ul>
                  <li>Unverified signups: deleted after <strong>7 days</strong> (verification links expire after 24 hours).</li>
                  <li>Verified supporter records: kept while your entry exists; deleted/anonymized on request.</li>
                  <li>Email contents in our delivery queue: redacted within <strong>7 days</strong> of delivery; delivery metadata kept up to <strong>90 days</strong>.</li>
                  <li>Contact messages: delivered to our inbox; the site&rsquo;s temporary delivery copy is redacted within 7 days.</li>
                  <li>Resolved content reports: purged after <strong>180 days</strong>.</li>
                  <li>Privacy-request records: kept <strong>24 months</strong> as compliance evidence.</li>
                  <li>Suppression entries (bounces/complaints): kept while needed to avoid emailing you again.</li>
                </ul>
                <p>
                  Deleted data may persist briefly in encrypted backups until
                  those backups expire on schedule. See our retention schedule
                  summary above; deletion from third-party caches (search
                  engines, AI services, email inboxes of messages already sent)
                  is not instantaneous and not within our control.
                </p>
              </>
            ),
          },
          {
            id: "rights",
            title: "Your rights and choices",
            body: (
              <>
                <p>
                  You can, at any time, using your{" "}
                  <a href="/manage">management link</a> or the{" "}
                  <a href="/privacy-request">Privacy Request</a> page:
                </p>
                <ul>
                  <li>access and export the information we hold about you (JSON);</li>
                  <li>correct your details;</li>
                  <li>unpublish your Wall entry or withdraw public-display consent;</li>
                  <li>opt out of news and updates;</li>
                  <li>delete your personal information entirely.</li>
                </ul>
                <p>
                  We verify your email before disclosing, changing, or deleting
                  anything, and we never disclose one person&rsquo;s data to someone
                  else who merely knows their email address.
                </p>
                <p>
                  <strong>EEA/UK visitors (GDPR/UK GDPR):</strong> you also have
                  the rights to restrict or object to processing, the right to
                  data portability, the right to withdraw consent at any time,
                  and the right to lodge a complaint with your local
                  supervisory authority.
                </p>
                <p>
                  <strong>California residents:</strong> 7FC is a small fan
                  community that may fall below the CCPA/CPRA business
                  thresholds; regardless, we voluntarily honor reasonable
                  access, correction, and deletion requests as described above.
                  We do not sell personal information and do not share it for
                  cross-context behavioral advertising. We honor Global Privacy
                  Control signals for any future optional technologies.
                </p>
              </>
            ),
          },
          {
            id: "children",
            title: "Children",
            body: (
              <p>
                The site&rsquo;s content is suitable for general audiences, but
                Global 7 Wall signup is limited to people aged 16 or older and
                the form requires an age confirmation. We do not knowingly
                collect personal information from anyone under 16; if you
                believe we have, contact{" "}
                <a href="mailto:privacy@sevenfc.net">privacy@sevenfc.net</a> and we
                will delete it.
              </p>
            ),
          },
          {
            id: "security",
            title: "Security",
            body: (
              <p>
                We protect personal information with HTTPS everywhere, hashed
                one-time tokens for verification and management links,
                parameterized database queries, output escaping, rate limiting,
                bot protection, restricted admin authentication, and security
                headers. No system is perfectly secure — we cannot guarantee
                absolute security, but we work to protect your data and will
                act on reports sent to{" "}
                <a href="mailto:security@sevenfc.net">security@sevenfc.net</a>.
              </p>
            ),
          },
          {
            id: "changes",
            title: "Changes to this Policy",
            body: (
              <p>
                We may update this Privacy Policy as the site evolves. The
                effective date above reflects the current version, and consent
                records store the version you accepted. Material changes will
                be highlighted on this page.
              </p>
            ),
          },
          {
            id: "contact",
            title: "Contact",
            body: (
              <p>
                Privacy questions and requests:{" "}
                <a href="mailto:privacy@sevenfc.net">privacy@sevenfc.net</a>, the{" "}
                <a href="/privacy-request">Privacy Request page</a>, or the{" "}
                <a href="/contact">contact form</a>.
              </p>
            ),
          },
        ]}
      />
    </PageShell>
  );
}
