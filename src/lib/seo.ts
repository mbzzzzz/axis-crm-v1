import { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://axis-crm-v1.vercel.app";
const siteName = "Axis CRM";

export interface SEOConfig {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  noIndex?: boolean;
  canonical?: string;
}

export function generateMetadata(config: SEOConfig): Metadata {
  const title = config.title 
    ? `${config.title} | ${siteName}`
    : `${siteName} - Real Estate Management Platform`;
  
  const description = config.description || 
    "Comprehensive real estate CRM platform for property managers and agents.";

  return {
    title,
    description,
    keywords: config.keywords,
    openGraph: {
      title,
      description,
      url: config.canonical || siteUrl,
      siteName,
      images: config.image ? [
        {
          url: config.image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ] : undefined,
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: config.image ? [config.image] : undefined,
    },
    robots: config.noIndex ? {
      index: false,
      follow: false,
    } : {
      index: true,
      follow: true,
    },
    alternates: {
      canonical: config.canonical || siteUrl,
    },
  };
}

export function generateStructuredData(type: "Organization" | "WebApplication" | "SoftwareApplication", data?: any) {
  const baseData = {
    "@context": "https://schema.org",
    "@type": type,
    name: siteName,
    url: siteUrl,
    description: "Comprehensive real estate CRM platform for property managers and agents",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
  };

  if (type === "Organization") {
    return {
      ...baseData,
      "@type": "Organization",
      logo: `${siteUrl}/icon logo.png`,
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "Customer Service",
        availableLanguage: "English",
      },
    };
  }

  if (type === "WebApplication" || type === "SoftwareApplication") {
    return {
      ...baseData,
      "@type": type,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      featureList: [
        "Property Management",
        "Tenant Management",
        "Invoice Generation",
        "Maintenance Tracking",
        "Lead Pipeline",
        "Financial Reporting",
        "Document Management",
      ],
      ...data,
    };
  }

  return baseData;
}

