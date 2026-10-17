import type { MetadataRoute } from "next";
const siteUrl = "https://typeflowlive.vercel.app";
export default function sitemap(): MetadataRoute.Sitemap {
  // List canonical public pages without inventing modification dates.
  const routes = ["", "/learn", "/leaderboard", "/about", "/how-wpm-is-calculated", "/privacy", "/terms", "/contact"];
  return routes.map(route => ({ url: `${siteUrl}${route}` }));
}
