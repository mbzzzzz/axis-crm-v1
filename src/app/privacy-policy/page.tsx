"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ShaderAnimation } from "@/components/ui/shader-animation";
import { AxisLogo } from "@/components/axis-logo";

export default function PrivacyPolicyPage() {
  const router = useRouter();

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* Shader Animation Background */}
      <ShaderAnimation />

      {/* Header */}
      <header className="relative z-10 border-b border-white/20 bg-black/30 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => router.push("/")}
            className="cursor-pointer hover:opacity-80 transition-opacity"
            aria-label="Go to home page"
          >
            <AxisLogo variant="full" size="navbar" className="text-white" />
          </button>
          <nav className="flex items-center gap-2 sm:gap-4" aria-label="Main navigation">
            <Button 
              variant="ghost" 
              onClick={() => router.push("/")} 
              className="text-white hover:bg-white/20 hover:text-white text-sm sm:text-base"
              aria-label="Go to home page"
            >
              Home
            </Button>
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

      {/* Content */}
      <main className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-4xl pb-16">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-white drop-shadow-lg">Privacy Policy</h1>
          <p className="text-white/70 text-sm sm:text-base">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        <div className="prose prose-invert max-w-none space-y-6 text-white/90">
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">1. Introduction</h2>
            <p className="mb-4">
              Welcome to Axis CRM ("we," "our," or "us"). We are committed to protecting your privacy and ensuring you have a positive experience on our platform. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our real estate CRM platform.
            </p>
            <p>
              By using Axis CRM, you agree to the collection and use of information in accordance with this policy. If you do not agree with our policies and practices, please do not use our service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">2. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold mb-3 text-white mt-6">2.1 Personal Information</h3>
            <p className="mb-4">
              We collect information that you provide directly to us, including:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Name, email address, and contact information</li>
              <li>Account credentials and authentication information</li>
              <li>Payment and billing information (processed securely through third-party providers)</li>
              <li>Profile information and preferences</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-white mt-6">2.2 Business Information</h3>
            <p className="mb-4">
              As a real estate CRM, we collect business-related data including:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Property listings and details</li>
              <li>Tenant and client information</li>
              <li>Invoice and financial data</li>
              <li>Maintenance requests and records</li>
              <li>Lead and pipeline information</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-white mt-6">2.3 Automatically Collected Information</h3>
            <p className="mb-4">
              We automatically collect certain information when you use our service:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Device information and identifiers</li>
              <li>IP address and location data</li>
              <li>Browser type and version</li>
              <li>Usage data and interaction patterns</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">3. How We Use Your Information</h2>
            <p className="mb-4">We use the collected information for various purposes:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>To provide, maintain, and improve our services</li>
              <li>To process transactions and manage your account</li>
              <li>To communicate with you about your account and our services</li>
              <li>To send you technical notices, updates, and support messages</li>
              <li>To respond to your comments, questions, and requests</li>
              <li>To monitor and analyze usage patterns and trends</li>
              <li>To detect, prevent, and address technical issues and security threats</li>
              <li>To comply with legal obligations and enforce our terms</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">4. Data Storage and Security</h2>
            <p className="mb-4">
              We implement appropriate technical and organizational measures to protect your personal information:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Encryption of data in transit and at rest</li>
              <li>Secure authentication and access controls</li>
              <li>Regular security assessments and updates</li>
              <li>Data isolation between user accounts</li>
              <li>Secure cloud infrastructure (Supabase/PostgreSQL)</li>
            </ul>
            <p className="mb-4">
              However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your information, we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">5. Data Sharing and Disclosure</h2>
            <p className="mb-4">We do not sell your personal information. We may share your information only in the following circumstances:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Service Providers:</strong> With trusted third-party service providers who assist us in operating our platform (e.g., authentication services, payment processors, cloud hosting)</li>
              <li><strong>Legal Requirements:</strong> When required by law, court order, or governmental authority</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
              <li><strong>With Your Consent:</strong> When you explicitly authorize us to share your information</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">6. Your Rights and Choices</h2>
            <p className="mb-4">You have the following rights regarding your personal information:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Access:</strong> Request access to your personal data</li>
              <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data</li>
              <li><strong>Deletion:</strong> Request deletion of your personal data</li>
              <li><strong>Data Portability:</strong> Request a copy of your data in a portable format</li>
              <li><strong>Opt-Out:</strong> Unsubscribe from marketing communications</li>
              <li><strong>Account Deletion:</strong> Delete your account and associated data</li>
            </ul>
            <p className="mb-4">
              To exercise these rights, please contact us at the information provided in the Contact section below.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">7. Cookies and Tracking Technologies</h2>
            <p className="mb-4">
              We use cookies and similar tracking technologies to track activity on our platform and store certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">8. Children's Privacy</h2>
            <p className="mb-4">
              Our service is not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">9. International Data Transfers</h2>
            <p className="mb-4">
              Your information may be transferred to and maintained on computers located outside of your state, province, country, or other governmental jurisdiction where data protection laws may differ. By using our service, you consent to the transfer of your information to our facilities and those third parties with whom we share it as described in this policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">10. Changes to This Privacy Policy</h2>
            <p className="mb-4">
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">11. Contact Us</h2>
            <p className="mb-4">
              If you have any questions about this Privacy Policy, please contact us:
            </p>
            <ul className="list-none space-y-2 mb-4">
              <li><strong>Email:</strong> privacy@axiscrm.com</li>
              <li><strong>Website:</strong> <a href="/" className="text-blue-400 hover:underline">axis-crm.com</a></li>
            </ul>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-white/20">
          <Button 
            variant="ghost" 
            onClick={() => router.push("/")} 
            className="text-white hover:bg-white/20 hover:text-white"
          >
            ← Back to Home
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/20 bg-black/30 backdrop-blur-sm mt-8 sm:mt-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 text-center text-xs sm:text-sm font-medium text-white/80">
          <p>© 2024 Axis CRM. All rights reserved.</p>
          <nav className="mt-4 flex flex-wrap justify-center gap-4 sm:gap-6" aria-label="Footer navigation">
            <a href="/login" className="hover:text-white transition-colors">Sign In</a>
            <a href="/register" className="hover:text-white transition-colors">Get Started</a>
            <a href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="/terms-of-service" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="/compliance" className="hover:text-white transition-colors">Compliance</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}

