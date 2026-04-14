import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SupportWidget from "@/components/SupportWidget";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} dark`}>
      <body className="antialiased">
        <Navbar />
        <main className="min-h-screen pt-16">
          {children}
        </main>
        <Footer />
        <SupportWidget />
      </body>
    </html>
  );
}
