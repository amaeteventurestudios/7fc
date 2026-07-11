import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import PageShell from "@/components/public/PageShell";
import LegalArticle from "@/components/public/LegalArticle";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Accessibility Statement | 7FC",
  description:
    "7FC's accessibility goal is WCAG 2.2 Level AA. What we've done, known limitations, and how to report an accessibility problem.",
  alternates: { canonical: `${SITE_URL}/accessibility` },
};

export default function AccessibilityPage() {
  return (
    <PageShell kicker="Everyone raises their 7" title="Accessibility Statement">
      <LegalArticle
        lastUpdated="2026-07-11"
        sections={[
          {
            id: "goal",
            title: "Our goal",
            body: (
              <p>
                7FC aims to conform to the{" "}
                <a href="https://www.w3.org/TR/WCAG22/">Web Content
                Accessibility Guidelines (WCAG) 2.2, Level AA</a>. We designed a
                high-contrast dark interface with gold accents, and we test
                with keyboard navigation, screen-reader semantics, and reduced
                motion in mind. We do not claim perfect conformance — the site
                is actively developed and some issues may remain.
              </p>
            ),
          },
          {
            id: "measures",
            title: "What we do",
            body: (
              <ul>
                <li>Semantic HTML with a logical heading structure and labeled landmarks</li>
                <li>A skip-to-content link and visible keyboard focus indicators</li>
                <li>Labels tied to every form control, with error and status messages announced via ARIA live regions</li>
                <li>Focus-managed dialogs (including the cookie preferences dialog) with no keyboard traps</li>
                <li>Text alternatives on informative images; decorative images hidden from assistive tech</li>
                <li>Contrast-checked gold-on-dark text and controls</li>
                <li><code>prefers-reduced-motion</code> respected — animations are disabled for users who ask for that</li>
                <li>Responsive layout that reflows for mobile screens and text resizing</li>
              </ul>
            ),
          },
          {
            id: "limitations",
            title: "Known limitations",
            body: (
              <ul>
                <li>Third-party components (such as the Cloudflare Turnstile human check) are provided by their vendors; we use their accessible modes but do not control them.</li>
                <li>Some decorative visual effects (glows, gradients) are intentionally cinematic; content never depends on them.</li>
              </ul>
            ),
          },
          {
            id: "feedback",
            title: "Report a problem",
            body: (
              <p>
                If anything on 7FC is hard to use with your assistive
                technology, please tell us:{" "}
                <a href="mailto:support@sevenfc.net">support@sevenfc.net</a> or the{" "}
                <a href="/contact">contact form</a> (category: technical
                support). Describe the page, what you expected, and the
                browser/AT you use — we treat accessibility reports as bugs to
                fix, not feedback to file away.
              </p>
            ),
          },
        ]}
      />
    </PageShell>
  );
}
