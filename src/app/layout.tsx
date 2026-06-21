import type { Metadata, Viewport } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import OnboardingWizard from "@/components/OnboardingWizard";
import MobileTabBar from "@/components/MobileTabBar";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "The Scene";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://thescene.fyi";

export const metadata: Metadata = {
  title: {
    default: `${siteName} | The Car Community, Reimagined`,
    template: `%s | ${siteName}`,
  },
  description: "Show off your build, connect with enthusiasts, discover car shows and events. The Scene is the car-centric social platform where your ride is your identity.",
  keywords: "car community, car social media, car shows, car meets, vehicle profile, car enthusiasts, car culture, modified cars, car events",
  openGraph: {
    title: `${siteName} | The Car Community, Reimagined`,
    description: "Show off your build, connect with enthusiasts, discover car shows and events.",
    url: siteUrl,
    siteName: siteName,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteName} | The Car Community, Reimagined`,
    description: "Show off your build, connect with enthusiasts, discover car shows and events.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${geistMono.variable} dark`}>
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
