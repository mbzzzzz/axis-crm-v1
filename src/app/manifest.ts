import { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://axis-crm-v1.vercel.app";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Axis CRM - Real Estate Management Platform",
    short_name: "Axis CRM",
    description: "Comprehensive real estate CRM platform for property managers and agents",
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icon logo.png",
        sizes: "any",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
    categories: ["business", "productivity", "real-estate"],
    screenshots: [],
  };
}

