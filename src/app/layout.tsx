import type { Metadata, Viewport } from "next";
import { Barlow, Barlow_Condensed, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import OnboardingWizard from "@/components/OnboardingWizard";
import MobileTabBar from "@/components/MobileTabBar";

// Barlow is drawn from California highway signage and license plates —
// the right voice for a car site. Condensed carries the headlines,
// Plex Mono handles spec sheets.
const barlow = Barlow({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  style: ["normal", "italic"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "The Scene";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://thescene.fyi";

export const metadata: Metadata = {
  title: {
    default: `${siteName} | Your car. Your page. Your people.`,
    template: `%s | ${siteName}`,
  },
  description: "A free home for your build. Give your car its own page with specs, mods, photos and a guestbook, then find the shows, clubs and people around you. Every feature, every member, no tiers.",
  keywords: "car community, car social media, car shows, car meets, vehicle profile, car enthusiasts, car culture, modified cars, car events, build journal",
  openGraph: {
    title: `${siteName} | Your car. Your page. Your people.`,
    description: "A free home for your build. Specs, mods, photos, guestbook, events and clubs — every feature for every member.",
    url: siteUrl,
    siteName: siteName,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteName} | Your car. Your page. Your people.`,
    description: "A free home for your build. Specs, mods, photos, guestbook, events and clubs — every feature for every member.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#08080d",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${barlow.variable} ${barlowCondensed.variable} ${plexMono.variable} dark`}>
      <body className="antialiased">
        <Navbar />
        <main className="min-h-screen site-main">
          {children}
        </main>
        <MobileTabBar />
        <OnboardingWizard />
        <Footer />
      </body>
    </html>
  );
}
