import type { Metadata } from "next";
import PageShell from "@/components/public/PageShell";
import PrivacyVerifyClient from "./PrivacyVerifyClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Verify your privacy request | 7FC",
  robots: { index: false, follow: false },
};

export default function PrivacyVerifyPage() {
  return (
    <PageShell title="Verify Your Privacy Request">
      <PrivacyVerifyClient />
    </PageShell>
  );
}
