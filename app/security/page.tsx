import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import PageShell from "@/components/public/PageShell";
import LegalArticle from "@/components/public/LegalArticle";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Security & Responsible Disclosure | 7FC",
  description:
    "How to report a security vulnerability in sevenfc.net responsibly, and what to expect from 7FC in return.",
  alternates: { canonical: `${SITE_URL}/security` },
};

export default function SecurityPage() {
  return (
    <PageShell kicker="Help us protect the community" title="Security">
      <LegalArticle
        lastUpdated="2026-07-11"
        sections={[
          {
            id: "report",
            title: "Reporting a vulnerability",
            body: (
              <>
                <p>
                  Found a security issue in sevenfc.net? Please email{" "}
                  <a href="mailto:security@sevenfc.net">security@sevenfc.net</a>{" "}
                  with:
                </p>
                <ul>
                  <li>a description of the issue and where it occurs;</li>
                  <li>steps to reproduce (proof-of-concept welcome);</li>
                  <li>the potential impact as you see it;</li>
                  <li>how you&rsquo;d like to be credited, if at all.</li>
                </ul>
                <p>
                  Machine-readable details live at{" "}
                  <a href="/.well-known/security.txt">/.well-known/security.txt</a>{" "}
                  (RFC 9116).
                </p>
              </>
            ),
          },
          {
            id: "rules",
            title: "Ground rules",
            body: (
              <>
                <p>We ask that you:</p>
                <ul>
                  <li>give us reasonable time to fix an issue before public disclosure;</li>
                  <li>avoid accessing, modifying, or deleting other people&rsquo;s data — use test accounts;</li>
                  <li>don&rsquo;t run destructive tests, denial-of-service, spam, or social engineering;</li>
                  <li>stop and report immediately if you encounter personal data.</li>
                </ul>
                <p>
                  In return, we will acknowledge legitimate reports, work on a
                  fix in good faith, and not pursue action against good-faith
                  research that follows these rules.{" "}
                  <strong>7FC is a small fan community and does not operate a
                  paid bug bounty.</strong>
                </p>
              </>
            ),
          },
          {
            id: "practices",
            title: "What we already do",
            body: (
              <ul>
                <li>HTTPS everywhere with strict security headers (HSTS, frame-ancestors, nosniff, referrer and permissions policies)</li>
                <li>Hashed one-time tokens for email verification and self-service links; no raw tokens in logs</li>
                <li>Parameterized database queries and escaped output everywhere user content is rendered</li>
                <li>Rate limiting, honeypots, and Cloudflare Turnstile on public forms</li>
                <li>Authenticated admin area; no personal data in ordinary logs</li>
                <li>Signed webhook verification for email delivery events</li>
              </ul>
            ),
          },
        ]}
      />
    </PageShell>
  );
}
