import type { Metadata } from "next";
import type { ReactNode } from "react";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import { Providers } from "../components/providers/providers";
import { initModuly } from "../lib/init";
import "./globals.css";

initModuly();

/** Makieta „kreskówka": Space Grotesk na całą typografię. */
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin", "latin-ext"],
  variable: "--font-space-grotesk",
  display: "swap",
});

/** IBM Plex Mono — etykiety, badge'y i podpisy (uppercase, szeroki tracking). */
const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://detailing-lacko.pl";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Detailing Łącko — pranie tapicerki, polerowanie | ceny z góry",
    template: "%s | Detailing Łącko",
  },
  description:
    "Pranie tapicerki od 300 zł, kompleksowe wnętrze 500 zł — pełny cennik na stronie, płacisz po obejrzeniu efektu. Czerniec 72, gmina Łącko.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "pl_PL",
    siteName: "Detailing Łącko",
    images: [{ url: "/og.jpg", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="pl"
      className={`${spaceGrotesk.variable} ${ibmPlexMono.variable}`}
    >
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
