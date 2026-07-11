import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import PageShell from "@/components/public/PageShell";
import PrivacyRequestForm from "./PrivacyRequestForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Privacy Request | 7FC",
  description:
    "Request access, correction, export, or deletion of your personal information held by 7FC, or withdraw consent for public display.",
  alternates: { canonical: `${SITE_URL}/privacy-request` },
};

export default function PrivacyRequestPage() {
  return (
    <PageShell
      kicker="Your rights, honored"
      title="Privacy Request"
      intro="Ask 7FC to access, correct, export, or delete your personal information, remove your public Wall entry, withdraw consent, or opt out of updates. No account needed — we verify your email before anything is disclosed or changed, and we never expose one person's data to another."
    >
      <PrivacyRequestForm />
      <p className="text-center text-[11px] text-gray-500 mt-8 leading-relaxed">
        You can also email{" "}
        <a href="mailto:privacy@sevenfc.net" className="text-gold-2 underline underline-offset-2">
          privacy@sevenfc.net
        </a>{" "}
        directly, or use your private management link from the{" "}
        <a href="/manage" className="text-gold-2 underline underline-offset-2">Manage page</a>{" "}
        for instant self-service.
      </p>
    </PageShell>
  );
}
