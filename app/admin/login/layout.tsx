import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Login | 7FC",
  robots: { index: false, follow: false },
};

export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
