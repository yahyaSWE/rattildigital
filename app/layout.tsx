import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ScrollToTop from "@/components/ScrollToTop";
import { BRAND, siteUrl } from "@/lib/brand";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: `${BRAND.name} – ${BRAND.tagline}`,
  description: `Personalized one-to-one Quran and Arabic lessons for children, adults, and families with qualified teachers and flexible schedules.`,
  keywords: ["Quran online", "Arabic online", "Tajweed", "Quran memorization", "online Quran classes"],
  openGraph: {
    url: "/",
    title: `${BRAND.name} – ${BRAND.tagline}`,
    description: "Learn Quran and Arabic online through personalized one-to-one lessons with qualified teachers.",
    locale: "en_GB",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">
        <ScrollToTop />
        {children}
      </body>
    </html>
  );
}
