"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Building2, BarChart3, FileText, Mail } from "lucide-react";
import { ShaderAnimation } from "@/components/ui/shader-animation";
import { AxisLogo } from "@/components/axis-logo";
import { StructuredData } from "@/components/structured-data";
import { ProductShowcase } from "@/components/landing/ProductShowcase";
import { SocialProof } from "@/components/landing/SocialProof";
import { FeatureDeepDive } from "@/components/landing/FeatureDeepDive";
import { PricingTable } from "@/components/landing/PricingTable";
import { FAQSection } from "@/components/landing/FAQSection";

export default function Home() {
  const router = useRouter();

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
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <AxisLogo variant="full" size="navbar" className="text-white" />
          <nav className="flex items-center gap-2 sm:gap-4" aria-label="Main navigation">
            <Button 
              variant="ghost" 
              onClick={() => router.push("/login")} 
              className="text-white hover:bg-white/20 hover:text-white text-sm sm:text-base"
              aria-label="Sign in to your account"
            >
              Sign in
            </Button>
            <Button 
              onClick={() => router.push("/register")} 
              className="bg-white text-black hover:bg-white/90 text-sm sm:text-base px-3 sm:px-4"
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

        <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 sm:gap-4 w-full sm:w-auto px-4">
          <Button size="lg" onClick={() => router.push("/register")} className="text-base bg-white text-black hover:bg-white/90 font-bold">
            Start Free Trial
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => router.push("/login")}
            className="text-base border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm font-bold"
          >
            Sign in
          </Button>
        </div>

        {/* Features */}
        <section className="mt-12 sm:mt-16 md:mt-24 grid w-full max-w-5xl gap-4 sm:gap-6 md:gap-8 sm:grid-cols-2 lg:grid-cols-4 px-4">
          <article className="flex flex-col items-center gap-3 sm:gap-4 rounded-lg border border-white/20 bg-white/10 p-4 sm:p-6 shadow-lg backdrop-blur-md">
            <div className="flex size-10 sm:size-12 items-center justify-center rounded-full bg-blue-400/80" aria-hidden="true">
              <Building2 className="size-5 sm:size-6 text-white" />
            </div>
            <h3 className="font-bold text-white text-sm sm:text-base">Property Management</h3>
            <p className="text-center text-xs sm:text-sm font-medium text-white/80">
              Manage all your listings with detailed information and financial tracking
            </p>
          </article>

          <article className="flex flex-col items-center gap-3 sm:gap-4 rounded-lg border border-white/20 bg-white/10 p-4 sm:p-6 shadow-lg backdrop-blur-md">
            <div className="flex size-10 sm:size-12 items-center justify-center rounded-full bg-purple-400/80" aria-hidden="true">
              <BarChart3 className="size-5 sm:size-6 text-white" />
            </div>
            <h3 className="font-bold text-white text-sm sm:text-base">Financial Calculator</h3>
            <p className="text-center text-xs sm:text-sm font-medium text-white/80">
              Calculate ROI, commissions, and expenses with visual analytics
            </p>
          </article>

          <article className="flex flex-col items-center gap-3 sm:gap-4 rounded-lg border border-white/20 bg-white/10 p-4 sm:p-6 shadow-lg backdrop-blur-md">
            <div className="flex size-10 sm:size-12 items-center justify-center rounded-full bg-green-400/80" aria-hidden="true">
              <FileText className="size-5 sm:size-6 text-white" />
            </div>
            <h3 className="font-bold text-white text-sm sm:text-base">Invoice Generation</h3>
            <p className="text-center text-xs sm:text-sm font-medium text-white/80">
              Create professional invoices with automated numbering and tracking
            </p>
          </article>

          <article className="flex flex-col items-center gap-3 sm:gap-4 rounded-lg border border-white/20 bg-white/10 p-4 sm:p-6 shadow-lg backdrop-blur-md">
            <div className="flex size-10 sm:size-12 items-center justify-center rounded-full bg-orange-400/80" aria-hidden="true">
              <Mail className="size-5 sm:size-6 text-white" />
            </div>
            <h3 className="font-bold text-white text-sm sm:text-base">Email Integration</h3>
            <p className="text-center text-xs sm:text-sm font-medium text-white/80">
              Automated invoice sending with Gmail and Outlook integration
            </p>
          </article>
        </section>
      </main>

      {/* New Landing Page Sections */}
      <ProductShowcase />
      <SocialProof />
      <FeatureDeepDive />
      <PricingTable />
      <FAQSection />

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/20 bg-black/30 backdrop-blur-sm mt-8 sm:mt-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 text-center text-xs sm:text-sm font-medium text-white/80">
          <p>© 2024 Axis CRM. All rights reserved.</p>
          <nav className="mt-4 flex flex-wrap justify-center gap-4 sm:gap-6" aria-label="Footer navigation">
            <a href="/login" className="hover:text-white transition-colors">Sign In</a>
            <a href="/register" className="hover:text-white transition-colors">Get Started</a>
          </nav>
        </div>
      </footer>
    </div>
    </>
  );
}