import type { Metadata } from "next";
import "./globals.css";
import VisualEditsMessenger from "../visual-edits/VisualEditsMessenger";
import ErrorReporter from "@/components/ErrorReporter";
import Script from "next/script";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";
import { ConditionalThemeToggle } from "@/components/conditional-theme-toggle";
import { GlobalThemeProvider } from "@/components/global-theme-provider";
import { StructuredData } from "@/components/structured-data";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://axis-crm-v1.vercel.app";
const siteName = "Axis CRM";
const siteDescription = "The ultimate real estate management tool and property listing solution. Streamline your property management, tenant tracking, invoicing, and lead generation with Axis CRM.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteName} - Real Estate Management Platform & Listing Site`,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  keywords: [
    "real estate CRM",
    "property management software",
    "real estate management tools",
    "property listing sites",
    "tenant management system",
    "landlord software",
    "real estate agent tools",
    "property maintenance tracking",
    "rental property management",
    "automated invoicing for landlords",
    "best property tenant management tool",
    "best invoicing for tenants and realtor",
    "buy property",
    "rent property",
    "property listing",
    "tenant invoicing software",
    "realtor management tools",
  ],
  authors: [{ name: "Axis CRM" }],
  creator: "Axis CRM",
  publisher: "Axis CRM",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: siteName,
    title: `${siteName} - Real Estate Management Platform`,
    description: siteDescription,
    images: [
      {
        url: `${siteUrl}/icon logo.png`,
        width: 1200,
        height: 630,
        alt: `${siteName} Logo`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteName} - Real Estate Management Platform`,
    description: siteDescription,
    images: [`${siteUrl}/icon logo.png`],
    creator: "@axiscrm",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/icon logo.png", type: "image/png" },
    ],
    apple: "/icon logo.png",
  },
  alternates: {
    canonical: siteUrl,
  },
  verification: {
    google: "N0FGyKfRNpX5FgA6n94KfJPTHQ9d4JUQH7fOVe9OJzA",
    // yandex: "your-yandex-verification-code",
    // bing: "your-bing-verification-code",
  },
  category: "Real Estate Software",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes" />
        <meta name="theme-color" content="#000000" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <StructuredData type="Organization" />
        <StructuredData type="WebApplication" />
        {/* Google Tag Manager */}
        <Script id="gtm-script" strategy="afterInteractive">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-PSVSDRCH');
          `}
        </Script>
      </head>
      <body className="antialiased">
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-PSVSDRCH"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <GlobalThemeProvider>
            <ErrorReporter />
            <Script
              src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts//route-messenger.js"
              strategy="afterInteractive"
              data-target-origin="*"
              data-message-type="ROUTE_CHANGE"
              data-include-search-params="true"
              data-only-in-iframe="true"
              data-debug="true"
              data-custom-data='{"appName": "YourApp", "version": "1.0.0", "greeting": "hi"}'
            />
            {/* Global theme toggle - hidden on landing page */}
            <ConditionalThemeToggle />
            {children}
            <Toaster />
            <VisualEditsMessenger />
          </GlobalThemeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}