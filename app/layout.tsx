import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ScrollToTop from "@/components/ScrollToTop";
import { BRAND, siteUrl } from "@/lib/brand";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

// TODO(brand): description och keywords är platshållare – skriv er egen SEO-text.
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: `${BRAND.name} – ${BRAND.tagline}`,
  description:
    `${BRAND.name} erbjuder undervisning online med kvalificerade lärare, flexibla tider och ett upplägg anpassat efter dina mål.`,
  keywords: ["online kurs", "distansundervisning", "utbildning"],
  openGraph: {
    url: "/",
    title: `${BRAND.name} – ${BRAND.tagline}`,
    description: `${BRAND.name} erbjuder undervisning online med kvalificerade lärare.`,
    locale: "sv_SE",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sv" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">
        <ScrollToTop />
        {children}
      </body>
    </html>
  );
}
