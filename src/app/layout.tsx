import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
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
const siteDescription = "Comprehensive real estate CRM platform for property managers and agents. Manage properties, tenants, invoices, maintenance requests, and leads all in one place.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteName} - Real Estate Management Platform`,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  keywords: [
    "real estate CRM",
    "property management software",
    "real estate management",
    "property CRM",
    "tenant management",
    "real estate invoicing",
    "property maintenance tracking",
    "lead management",
    "real estate automation",
    "property management platform",
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
    // Add your verification codes here when available
    // google: "your-google-verification-code",
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
    <ClerkProvider
      signInUrl="/login"
      signUpUrl="/register"
      afterSignInUrl="/dashboard"
      afterSignUpUrl="/dashboard"
    >
      <html lang="en" suppressHydrationWarning>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes" />
          <meta name="theme-color" content="#000000" />
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
          <StructuredData type="Organization" />
          <StructuredData type="WebApplication" />
        </head>
        <body className="antialiased">
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
    </ClerkProvider>
  );
}