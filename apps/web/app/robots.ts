import type { MetadataRoute } from "next";
const siteUrl = "https://typeflowlive.vercel.app";
export default function robots(): MetadataRoute.Robots { return { rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/history", "/friends"] }, sitemap: `${siteUrl}/sitemap.xml`, host: siteUrl }; }

