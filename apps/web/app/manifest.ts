import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest { return { name: "Typeflow - Typing Speed Test", short_name: "Typeflow", description: "Focused typing practice and live races.", start_url: "/", display: "standalone", background_color: "#090a0c", theme_color: "#36d399", icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }] }; }
