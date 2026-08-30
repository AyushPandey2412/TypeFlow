import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./seo.css";
import "./learn.css";
import "./learn-polish.css";
import "./learn-shift.css";
import "./learn-theory.css";
import "./tour.css";
import { Providers } from "./providers";
import { SiteFooter } from "../components/site-footer";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Typeflow - Free Typing Speed Test and Live Races", template: "%s | Typeflow" },
  description: "Measure WPM and accuracy with a focused typing test, practice continuous text, track results, and race friends live.",
  applicationName: "Typeflow",
  keywords: ["typing speed test", "WPM test", "typing practice", "typing accuracy test", "multiplayer typing race"],
  authors: [{ name: "Typeflow" }], creator: "Typeflow", publisher: "Typeflow",
  alternates: { canonical: "/" },
  openGraph: { type: "website", url: "/", siteName: "Typeflow", title: "Typeflow - Free Typing Speed Test", description: "Test your WPM and accuracy, practice focused typing, and race friends live." },
  twitter: { card: "summary_large_image", title: "Typeflow - Free Typing Speed Test", description: "Test your WPM and accuracy, practice focused typing, and race friends live." },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: [{ media: "(prefers-color-scheme: dark)", color: "#090a0c" }, { media: "(prefers-color-scheme: light)", color: "#f7f7f8" }] };

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  const structuredData = { "@context": "https://schema.org", "@type": "WebApplication", name: "Typeflow", url: siteUrl, applicationCategory: "EducationalApplication", operatingSystem: "Any", isAccessibleForFree: true, description: "A free typing speed test, practice tool, and multiplayer typing race application." };
  return <html lang="en" suppressHydrationWarning><body suppressHydrationWarning><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}/><Providers>{children}<SiteFooter/></Providers></body></html>;
}
