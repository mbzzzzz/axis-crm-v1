import { Metadata } from "next";
import { generateMetadata as genMeta } from "@/lib/seo";

export const metadata: Metadata = genMeta({
  title: "Real Estate CRM Platform - Manage Properties, Tenants & More",
  description: "Axis CRM is a comprehensive real estate management platform. Manage properties, tenants, invoices, maintenance requests, and leads. Perfect for property managers and real estate agents. Start free today.",
  keywords: [
    "real estate CRM",
    "property management",
    "tenant management",
    "real estate software",
    "property management system",
    "real estate automation",
    "property CRM software",
    "real estate management platform",
    "property manager tools",
    "real estate agent software",
  ],
  canonical: process.env.NEXT_PUBLIC_SITE_URL || "https://axis-crm-v1.vercel.app",
});

