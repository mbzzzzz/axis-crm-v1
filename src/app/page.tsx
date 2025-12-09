"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Building2, BarChart3, FileText, Mail } from "lucide-react";
import { ShaderAnimation } from "@/components/ui/shader-animation";
import { AxisLogo } from "@/components/axis-logo";
import { StructuredData } from "@/components/structured-data";
import { PricingSection } from "@/components/landing/PricingSection";
import { TrustedBrands } from "@/components/landing/TrustedBrands";
import { FAQSection } from "@/components/landing/FAQSection";
import { FeaturesCarousel } from "@/components/landing/FeaturesCarousel";
import { FeaturedProperties } from "@/components/landing/FeaturedProperties";
import { useSession } from "@/lib/auth-client";

export default function Home() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  // Redirect authenticated users to dashboard
  // Only redirect if we have a confirmed session (not during OAuth callback or redirect)
  useEffect(() => {
    // Don't redirect if we're in the middle of an OAuth callback or other auth flows
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      const searchParams = new URLSearchParams(window.location.search);
      
      // Skip redirect during auth flows - IMPORTANT: Don't redirect from landing page during OAuth
      if (pathname === '/auth/callback' || 
          pathname === '/login' || 
          pathname === '/register' ||
          searchParams.has('code') || // OAuth callback in progress
          searchParams.has('error')) { // Auth error
        return;
      }
      
      // If we're already on dashboard or another protected route, don't redirect
      if (pathname.startsWith('/dashboard') || 
          pathname.startsWith('/properties') ||
          pathname.startsWith('/tenants') ||
          pathname.startsWith('/invoices') ||
          pathname.startsWith('/maintenance') ||
          pathname.startsWith('/leads') ||
          pathname.startsWith('/financials') ||
          pathname.startsWith('/settings')) {
        return;
      }
      
      // IMPORTANT: Don't redirect from landing page if we just came from OAuth callback
      // Check if there's a recent OAuth callback (within last 5 seconds)
      const oauthCallbackTime = sessionStorage.getItem('oauth_callback_time');
      if (oauthCallbackTime) {
        const timeSinceCallback = Date.now() - parseInt(oauthCallbackTime, 10);
        if (timeSinceCallback < 5000) {
          // Recent OAuth callback - don't redirect, let the callback handle it
          sessionStorage.removeItem('oauth_callback_time');
          return;
        }
        sessionStorage.removeItem('oauth_callback_time');
      }
    }
    
    // Only redirect if session is confirmed and not pending
    // Add a small delay to ensure cookies are fully set after OAuth callback
    if (!isPending && session?.user) {
      // Use a small timeout to ensure cookies are available
      const timeoutId = setTimeout(() => {
        router.replace("/dashboard");
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [session, isPending, router]);

  return (
    <>
      <StructuredData 
        type="SoftwareApplication" 
        data={{
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
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
            "Lead Pipeline Management",
            "Financial Reporting",
            "Document Management",
          ],
        }}
      />
      <div className="relative flex min-h-screen flex-col">
        {/* Shader Animation Background */}
        <ShaderAnimation />

      {/* Header */}
      <header className="relative z-10 border-b border-white/20 bg-black/30 backdrop-blur-sm">
        <div className="container mx-auto flex h-14 sm:h-16 items-center justify-between px-3 sm:px-4 md:px-6 lg:px-8">
          <AxisLogo variant="full" size="navbar" className="text-white" />
          <nav className="flex items-center gap-1.5 sm:gap-2 md:gap-4" aria-label="Main navigation">
            <Button 
              variant="ghost" 
              onClick={() => router.push("/listings")}
              className="text-white hover:bg-white/20 hover:text-white text-xs sm:text-sm md:text-base hidden sm:inline-flex h-8 sm:h-9 md:h-10"
              aria-label="Browse properties"
            >
              Find Properties
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => {
                const pricingSection = document.getElementById("pricing");
                if (pricingSection) {
                  pricingSection.scrollIntoView({ behavior: "smooth" });
                }
              }}
              className="text-white hover:bg-white/20 hover:text-white text-xs sm:text-sm md:text-base hidden sm:inline-flex h-8 sm:h-9 md:h-10"
              aria-label="View pricing"
            >
              Pricing
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => router.push("/login")} 
              className="text-white hover:bg-white/20 hover:text-white text-xs sm:text-sm md:text-base h-8 sm:h-9 md:h-10 px-2 sm:px-3"
              aria-label="Sign in to your account"
            >
              Sign in
            </Button>
            <Button 
              onClick={() => router.push("/register")} 
              className="bg-white text-black hover:bg-white/90 text-xs sm:text-sm md:text-base px-2 sm:px-3 md:px-4 h-8 sm:h-9 md:h-10"
              aria-label="Get started with Axis CRM"
            >
              Get Started
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 container mx-auto flex flex-1 flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16 text-center">
        <div className="mb-4 sm:mb-6 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm shadow-sm backdrop-blur-sm">
          <span className="flex size-2 rounded-full bg-green-400" aria-hidden="true"></span>
          <span className="text-white/90 font-medium">Real Estate CRM Platform</span>
        </div>

        <h1 className="mb-4 sm:mb-6 max-w-4xl text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tight text-white drop-shadow-lg px-2">
          Manage Your Real Estate Business with{" "}
          <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Axis CRM
          </span>
        </h1>

        <p className="mb-8 sm:mb-12 max-w-2xl text-base sm:text-lg md:text-xl font-semibold text-white/90 drop-shadow-md px-4">
          A comprehensive platform for real estate agents and property managers to handle listings,
          calculate profits, generate invoices, and automate workflows.
        </p>

        <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-2.5 sm:gap-3 md:gap-4 w-full sm:w-auto px-4">
          <Button size="lg" onClick={() => router.push("/register")} className="w-full sm:w-auto text-sm sm:text-base bg-white text-black hover:bg-white/90 font-bold h-11 sm:h-12">
            Start Free Trial
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => router.push("/listings")}
            className="w-full sm:w-auto text-sm sm:text-base border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm font-bold h-11 sm:h-12"
          >
            Browse Properties
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => router.push("/login")}
            className="w-full sm:w-auto text-sm sm:text-base border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm font-bold h-11 sm:h-12"
          >
            Sign in
          </Button>
        </div>

        {/* Features */}
        <section className="mt-8 sm:mt-12 md:mt-16 lg:mt-24 grid w-full max-w-5xl gap-3 sm:gap-4 md:gap-6 lg:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 px-4">
          <article className="flex flex-col items-center gap-2 sm:gap-3 md:gap-4 rounded-lg border border-white/20 bg-white/10 p-3 sm:p-4 md:p-6 shadow-lg backdrop-blur-md">
            <div className="flex size-8 sm:size-10 md:size-12 items-center justify-center rounded-full bg-blue-400/80" aria-hidden="true">
              <Building2 className="size-4 sm:size-5 md:size-6 text-white" />
            </div>
            <h3 className="font-bold text-white text-xs sm:text-sm md:text-base">Property Management</h3>
            <p className="text-center text-xs sm:text-sm font-medium text-white/80 leading-relaxed">
              Manage all your listings with detailed information and financial tracking
            </p>
          </article>

          <article className="flex flex-col items-center gap-2 sm:gap-3 md:gap-4 rounded-lg border border-white/20 bg-white/10 p-3 sm:p-4 md:p-6 shadow-lg backdrop-blur-md">
            <div className="flex size-8 sm:size-10 md:size-12 items-center justify-center rounded-full bg-purple-400/80" aria-hidden="true">
              <BarChart3 className="size-4 sm:size-5 md:size-6 text-white" />
            </div>
            <h3 className="font-bold text-white text-xs sm:text-sm md:text-base">Financial Calculator</h3>
            <p className="text-center text-xs sm:text-sm font-medium text-white/80 leading-relaxed">
              Calculate ROI, commissions, and expenses with visual analytics
            </p>
          </article>

          <article className="flex flex-col items-center gap-2 sm:gap-3 md:gap-4 rounded-lg border border-white/20 bg-white/10 p-3 sm:p-4 md:p-6 shadow-lg backdrop-blur-md">
            <div className="flex size-8 sm:size-10 md:size-12 items-center justify-center rounded-full bg-green-400/80" aria-hidden="true">
              <FileText className="size-4 sm:size-5 md:size-6 text-white" />
            </div>
            <h3 className="font-bold text-white text-xs sm:text-sm md:text-base">Invoice Generation</h3>
            <p className="text-center text-xs sm:text-sm font-medium text-white/80 leading-relaxed">
              Create professional invoices with automated numbering and tracking
            </p>
          </article>

          <article className="flex flex-col items-center gap-2 sm:gap-3 md:gap-4 rounded-lg border border-white/20 bg-white/10 p-3 sm:p-4 md:p-6 shadow-lg backdrop-blur-md">
            <div className="flex size-8 sm:size-10 md:size-12 items-center justify-center rounded-full bg-orange-400/80" aria-hidden="true">
              <Mail className="size-4 sm:size-5 md:size-6 text-white" />
            </div>
            <h3 className="font-bold text-white text-xs sm:text-sm md:text-base">Email Integration</h3>
            <p className="text-center text-xs sm:text-sm font-medium text-white/80 leading-relaxed">
              Automated invoice sending with Gmail and Outlook integration
            </p>
          </article>
        </section>
      </main>

      {/* Trusted Brands Section */}
      <TrustedBrands />

      {/* Features Carousel Section */}
      <FeaturesCarousel />

      {/* Featured Properties Section */}
      <FeaturedProperties />

      {/* Pricing Section */}
      <PricingSection />

      {/* FAQ Section */}
      <FAQSection />

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/20 bg-black/30 backdrop-blur-sm mt-6 sm:mt-8 md:mt-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8 text-center text-xs sm:text-sm font-medium text-white/80">
          <p className="mb-3 sm:mb-4">© 2024 Axis CRM. All rights reserved.</p>
          <nav className="flex flex-wrap justify-center gap-3 sm:gap-4 md:gap-6 text-xs sm:text-sm" aria-label="Footer navigation">
            <a href="/listings" className="hover:text-white transition-colors">Find Properties</a>
            <a href="/login" className="hover:text-white transition-colors">Sign In</a>
            <a href="/register" className="hover:text-white transition-colors">Get Started</a>
            <a href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="/terms-of-service" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="/compliance" className="hover:text-white transition-colors">Compliance</a>
          </nav>
        </div>
      </footer>
    </div>
    </>
  );
}