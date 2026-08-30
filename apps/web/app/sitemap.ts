import type { MetadataRoute } from "next";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
export default function sitemap(): MetadataRoute.Sitemap { const routes = ["", "/learn", "/leaderboard", "/about", "/how-wpm-is-calculated", "/privacy", "/terms", "/contact"]; return routes.map((route, index) => ({ url: `${siteUrl}${route}`, lastModified: new Date(), changeFrequency: index < 2 ? "daily" : "monthly", priority: index === 0 ? 1 : index === 1 ? .8 : .6 })); }
