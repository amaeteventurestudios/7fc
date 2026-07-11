import type { Metadata } from "next";
import { Cinzel, Inter } from "next/font/google";
import "./globals.css";

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://sevenfc.net";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "7FC — The CR7 Legacy. Forever 7.",
  description:
    "7FC is an independent, unofficial Cristiano Ronaldo fan tribute and football culture site celebrating the legacy, discipline, records, and global fan energy of the number 7.",
  keywords: [
    "Cristiano Ronaldo", "Ronaldo", "CR7", "Cristiano Ronaldo legacy",
    "Ronaldo fan site", "CR7 fan tribute", "number 7 football",
    "football greatness", "Portugal football", "Manchester United Ronaldo",
    "Real Madrid Ronaldo", "Juventus Ronaldo", "Al Nassr Ronaldo",
    "football records", "football discipline", "7FC",
  ],
  alternates: { canonical: SITE_URL },
  robots: { index: true, follow: true },
  icons: { icon: [{ url: "/images/7fc-favicon.webp", type: "image/webp" }] },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "7FC — Seven FC",
    title: "7FC — The CR7 Legacy. Forever 7.",
    description:
      "An independent, unofficial fan tribute celebrating the discipline, records, and global fan energy of the number 7.",
    images: [
      {
        url: "/images/7fc-og-preview.webp",
        width: 1200,
        height: 630,
        alt: "7FC — The CR7 Legacy. Forever 7. Unofficial fan tribute.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "7FC — The CR7 Legacy. Forever 7.",
    description:
      "An independent, unofficial fan tribute celebrating the discipline, records, and global fan energy of the number 7.",
    images: ["/images/7fc-og-preview.webp"],
  },
};

const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "7FC — Seven FC",
    url: SITE_URL,
    description:
      "7FC is an independent, unofficial fan tribute and football culture site. Not affiliated with Cristiano Ronaldo, CR7, any club, federation, sponsor, or official brand.",
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "7FC — Seven FC",
    url: SITE_URL,
    logo: `${SITE_URL}/images/7fc-logo-main.webp`,
    description:
      "An independent, unofficial fan tribute celebrating the discipline, records, and global fan energy of the number 7.",
  },
];

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${cinzel.variable} ${inter.variable} antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        {children}
      </body>
    </html>
  );
}
