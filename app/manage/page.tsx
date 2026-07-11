import type { Metadata } from "next";
import PageShell from "@/components/public/PageShell";
import ManageClient from "./ManageClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Manage your supporter entry | 7FC",
  robots: { index: false, follow: false },
};

export default function ManagePage() {
  return (
    <PageShell
      kicker="Your data, your choice"
      title="Manage Your Entry"
      intro="View, correct, unpublish, export, or delete your Global 7 Wall information. Request a private management link — it is emailed to the address on your entry and expires after 1 hour."
    >
      <ManageClient />
    </PageShell>
  );
}
