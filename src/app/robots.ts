import { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://axis-crm-v1.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard/",
          "/api/",
          "/_next/",
          "/admin/",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: [
          "/dashboard/",
          "/api/",
        ],
      },
      {
        userAgent: "GPTBot",
        allow: "/",
        disallow: [
          "/dashboard/",
          "/api/",
        ],
      },
      {
        userAgent: "ChatGPT-User",
        allow: "/",
        disallow: [
          "/dashboard/",
          "/api/",
        ],
      },
      {
        userAgent: "CCBot",
        allow: "/",
        disallow: [
          "/dashboard/",
          "/api/",
        ],
      },
      {
        userAgent: "anthropic-ai",
        allow: "/",
        disallow: [
          "/dashboard/",
          "/api/",
        ],
      },
      {
        userAgent: "Claude-Web",
        allow: "/",
        disallow: [
          "/dashboard/",
          "/api/",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}

