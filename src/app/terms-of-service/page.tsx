"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ShaderAnimation } from "@/components/ui/shader-animation";
import { AxisLogo } from "@/components/axis-logo";

export default function TermsOfServicePage() {
  const router = useRouter();

  return (
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
      <main className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-white drop-shadow-lg">Terms of Service</h1>
          <p className="text-white/70 text-sm sm:text-base">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        <div className="prose prose-invert max-w-none space-y-6 text-white/90">
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">1. Agreement to Terms</h2>
            <p className="mb-4">
              By accessing or using Axis CRM ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, then you may not access the Service.
            </p>
            <p>
              These Terms apply to all visitors, users, and others who access or use the Service. Your use of the Service is also governed by our Privacy Policy, which is incorporated into these Terms by reference.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">2. Description of Service</h2>
            <p className="mb-4">
              Axis CRM is a comprehensive real estate customer relationship management platform that provides tools for:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Property listing and management</li>
              <li>Tenant and client relationship management</li>
              <li>Invoice generation and financial tracking</li>
              <li>Maintenance request management</li>
              <li>Lead pipeline tracking</li>
              <li>Financial reporting and analytics</li>
            </ul>
            <p>
              We reserve the right to modify, suspend, or discontinue any part of the Service at any time with or without notice.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">3. User Accounts</h2>
            
            <h3 className="text-xl font-semibold mb-3 text-white mt-6">3.1 Account Creation</h3>
            <p className="mb-4">
              To use certain features of the Service, you must register for an account. You agree to:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Provide accurate, current, and complete information during registration</li>
              <li>Maintain and promptly update your account information</li>
              <li>Maintain the security of your password and account</li>
              <li>Accept responsibility for all activities that occur under your account</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-white mt-6">3.2 Account Eligibility</h3>
            <p className="mb-4">
              You must be at least 18 years old to create an account. By creating an account, you represent and warrant that you meet this age requirement and have the legal capacity to enter into these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">4. Acceptable Use</h2>
            <p className="mb-4">You agree not to use the Service to:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe upon the rights of others, including intellectual property rights</li>
              <li>Transmit any harmful, offensive, or illegal content</li>
              <li>Attempt to gain unauthorized access to the Service or related systems</li>
              <li>Interfere with or disrupt the Service or servers connected to the Service</li>
              <li>Use automated systems (bots, scrapers) to access the Service without permission</li>
              <li>Impersonate any person or entity or misrepresent your affiliation</li>
              <li>Collect or store personal data about other users without their consent</li>
              <li>Use the Service for any fraudulent or deceptive purpose</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">5. User Content and Data</h2>
            
            <h3 className="text-xl font-semibold mb-3 text-white mt-6">5.1 Ownership</h3>
            <p className="mb-4">
              You retain ownership of all data and content you upload, create, or store in the Service ("User Content"). By using the Service, you grant us a limited, non-exclusive license to use, store, and process your User Content solely for the purpose of providing and improving the Service.
            </p>

            <h3 className="text-xl font-semibold mb-3 text-white mt-6">5.2 Data Responsibility</h3>
            <p className="mb-4">
              You are solely responsible for:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>The accuracy, legality, and appropriateness of your User Content</li>
              <li>Obtaining necessary permissions and consents for data you upload</li>
              <li>Compliance with data protection laws applicable to your use of the Service</li>
              <li>Backing up your data outside of the Service</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-white mt-6">5.3 Data Retention</h3>
            <p className="mb-4">
              We will retain your User Content for as long as your account is active or as needed to provide the Service. Upon account termination, we may delete your User Content in accordance with our data retention policies, subject to applicable legal requirements.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">6. Subscription and Payment</h2>
            
            <h3 className="text-xl font-semibold mb-3 text-white mt-6">6.1 Subscription Plans</h3>
            <p className="mb-4">
              The Service may be offered through various subscription plans with different features and pricing. We reserve the right to modify subscription plans, features, and pricing at any time.
            </p>

            <h3 className="text-xl font-semibold mb-3 text-white mt-6">6.2 Payment Terms</h3>
            <p className="mb-4">
              By subscribing to a paid plan, you agree to:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Pay all fees associated with your subscription</li>
              <li>Provide accurate billing information</li>
              <li>Authorize us to charge your payment method for recurring fees</li>
              <li>Understand that fees are non-refundable except as required by law</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-white mt-6">6.3 Cancellation</h3>
            <p className="mb-4">
              You may cancel your subscription at any time. Cancellation will take effect at the end of your current billing period. You will continue to have access to the Service until the end of the paid period.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">7. Intellectual Property</h2>
            <p className="mb-4">
              The Service and its original content, features, and functionality are owned by Axis CRM and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
            </p>
            <p>
              You may not copy, modify, distribute, sell, or lease any part of the Service or included software, nor may you reverse engineer or attempt to extract the source code of that software, unless laws prohibit those restrictions or you have our written permission.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">8. Service Availability and Modifications</h2>
            <p className="mb-4">
              We strive to maintain high availability of the Service but do not guarantee uninterrupted access. The Service may be unavailable due to:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Scheduled maintenance and updates</li>
              <li>Technical issues or failures</li>
              <li>Force majeure events</li>
              <li>Actions by third-party service providers</li>
            </ul>
            <p>
              We reserve the right to modify, suspend, or discontinue any part of the Service at any time with or without notice. We are not liable for any loss or damage resulting from such actions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">9. Disclaimer of Warranties</h2>
            <p className="mb-4">
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, OR COURSE OF PERFORMANCE.
            </p>
            <p>
              We do not warrant that the Service will be uninterrupted, error-free, secure, or free from viruses or other harmful components. Your use of the Service is at your sole risk.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">10. Limitation of Liability</h2>
            <p className="mb-4">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL AXIS CRM, ITS AFFILIATES, OR THEIR RESPECTIVE OFFICERS, DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM YOUR USE OR INABILITY TO USE THE SERVICE.
            </p>
            <p>
              Our total liability for any claims arising from or related to the Service shall not exceed the amount you paid us in the twelve (12) months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">11. Indemnification</h2>
            <p className="mb-4">
              You agree to indemnify, defend, and hold harmless Axis CRM and its affiliates from and against any claims, liabilities, damages, losses, and expenses, including reasonable attorneys' fees, arising out of or in any way connected with:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Your use of the Service</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any rights of another party</li>
              <li>Your User Content</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">12. Termination</h2>
            <p className="mb-4">
              We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason, including if you breach these Terms.
            </p>
            <p className="mb-4">
              Upon termination, your right to use the Service will cease immediately. You may terminate your account at any time by contacting us or using the account deletion feature in your settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">13. Governing Law</h2>
            <p className="mb-4">
              These Terms shall be governed by and construed in accordance with the laws of [Your Jurisdiction], without regard to its conflict of law provisions. Any disputes arising from these Terms or the Service shall be subject to the exclusive jurisdiction of the courts in [Your Jurisdiction].
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">14. Changes to Terms</h2>
            <p className="mb-4">
              We reserve the right to modify these Terms at any time. We will notify you of any material changes by posting the new Terms on this page and updating the "Last updated" date. Your continued use of the Service after such modifications constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">15. Contact Information</h2>
            <p className="mb-4">
              If you have any questions about these Terms of Service, please contact us:
            </p>
            <ul className="list-none space-y-2 mb-4">
              <li><strong>Email:</strong> legal@axiscrm.com</li>
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

