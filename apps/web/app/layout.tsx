import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./seo.css";
import "./learn.css";
import "./learn-polish.css";
import "./learn-shift.css";
import "./learn-theory.css";
import "./learn-progress.css";
import "./tour.css";
import "./settings.css";
import { Providers } from "./providers";
import { SiteFooter } from "../components/site-footer";

const siteUrl = "https://typeflowlive.vercel.app";
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  verification: { google: "iA5ywoUflVaoN0YqAa-qrNEdQ1UqjCT90cmVuCojKfA" },
  title: { default: "Free Typing Speed Test & WPM Practice | Typeflow", template: "%s | Typeflow" },
  description: "Take a free typing speed test in 15, 30, 60 or 120 seconds. Measure WPM and accuracy, learn touch typing, and race friends in private multiplayer rooms.",
  applicationName: "Typeflow",
  keywords: ["typing speed test", "WPM test", "typing practice", "typing accuracy test", "multiplayer typing race"],
  authors: [{ name: "Typeflow" }], creator: "Typeflow", publisher: "Typeflow",
  alternates: { canonical: "/" },
  openGraph: { type: "website", siteName: "Typeflow", locale: "en_US", images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Typeflow — free typing speed test, touch typing practice and live races" }] },
  twitter: { card: "summary_large_image", images: ["/opengraph-image"] },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: [{ media: "(prefers-color-scheme: dark)", color: "#090a0c" }, { media: "(prefers-color-scheme: light)", color: "#f7f7f8" }] };

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  const structuredData = { "@context": "https://schema.org", "@graph": [{ "@type": "WebSite", "@id": `${siteUrl}/#website`, name: "Typeflow", alternateName: "Typeflow Live", url: siteUrl, inLanguage: "en" }, { "@type": "WebApplication", "@id": `${siteUrl}/#app`, name: "Typeflow", url: siteUrl, applicationCategory: "EducationalApplication", operatingSystem: "Any", isAccessibleForFree: true, offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, featureList: ["Timed typing speed tests", "WPM and accuracy measurement", "Touch typing lessons", "Private multiplayer typing races"], description: "A free typing speed test, practice tool, and multiplayer typing race application." }] };
  return <html lang="en" suppressHydrationWarning><body suppressHydrationWarning><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}/><Providers>{children}<SiteFooter/></Providers></body></html>;
}

