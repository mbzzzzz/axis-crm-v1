"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ShaderAnimation } from "@/components/ui/shader-animation";
import { AxisLogo } from "@/components/axis-logo";

export default function CompliancePage() {
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
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-white drop-shadow-lg">Compliance</h1>
          <p className="text-white/70 text-sm sm:text-base">Our commitment to security, privacy, and regulatory compliance</p>
        </div>

        <div className="prose prose-invert max-w-none space-y-6 text-white/90">
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">Overview</h2>
            <p className="mb-4">
              At Axis CRM, we are committed to maintaining the highest standards of security, privacy, and regulatory compliance. This page outlines our compliance framework, certifications, and the measures we take to protect your data and ensure we meet industry standards.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">Data Protection and Privacy</h2>
            
            <h3 className="text-xl font-semibold mb-3 text-white mt-6">GDPR Compliance</h3>
            <p className="mb-4">
              Axis CRM is designed to comply with the General Data Protection Regulation (GDPR). We implement:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Data minimization and purpose limitation principles</li>
              <li>User consent management and right to withdraw consent</li>
              <li>Right to access, rectification, and erasure of personal data</li>
              <li>Data portability features</li>
              <li>Privacy by design and default</li>
              <li>Data breach notification procedures</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-white mt-6">CCPA Compliance</h3>
            <p className="mb-4">
              For users in California, we comply with the California Consumer Privacy Act (CCPA) by providing:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Transparency about data collection and use</li>
              <li>Right to know what personal information is collected</li>
              <li>Right to delete personal information</li>
              <li>Right to opt-out of the sale of personal information (we do not sell personal information)</li>
              <li>Non-discrimination for exercising privacy rights</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-white mt-6">Other Privacy Regulations</h3>
            <p className="mb-4">
              We continuously monitor and adapt our practices to comply with applicable privacy laws, including:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>PIPEDA (Canada)</li>
              <li>LGPD (Brazil)</li>
              <li>Other regional data protection regulations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">Security Standards</h2>
            
            <h3 className="text-xl font-semibold mb-3 text-white mt-6">Encryption</h3>
            <p className="mb-4">
              We employ industry-standard encryption to protect your data:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>In Transit:</strong> TLS 1.2+ encryption for all data transmission</li>
              <li><strong>At Rest:</strong> AES-256 encryption for stored data</li>
              <li><strong>Database:</strong> Encrypted connections and encrypted storage</li>
              <li><strong>Backups:</strong> Encrypted backup storage</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-white mt-6">Access Controls</h3>
            <p className="mb-4">
              We implement strict access controls to protect your information:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Multi-factor authentication (MFA) support</li>
              <li>Role-based access control (RBAC)</li>
              <li>Data isolation between user accounts</li>
              <li>Regular access reviews and audits</li>
              <li>Principle of least privilege for system access</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-white mt-6">Infrastructure Security</h3>
            <p className="mb-4">
              Our infrastructure is built on secure, enterprise-grade platforms:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Cloud infrastructure with SOC 2 Type II compliance (Supabase)</li>
              <li>Regular security assessments and penetration testing</li>
              <li>Intrusion detection and monitoring systems</li>
              <li>Automated security scanning and vulnerability management</li>
              <li>Incident response procedures</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">Data Residency and Sovereignty</h2>
            <p className="mb-4">
              We understand the importance of data residency requirements. Currently, our data is stored in [specify region/data center locations]. We are committed to:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Transparency about data storage locations</li>
              <li>Compliance with local data residency requirements where applicable</li>
              <li>Providing options for data residency when available</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">Business Continuity and Disaster Recovery</h2>
            <p className="mb-4">
              We maintain robust business continuity and disaster recovery plans:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Regular automated backups with point-in-time recovery</li>
              <li>Redundant systems and failover capabilities</li>
              <li>Disaster recovery testing and procedures</li>
              <li>Service level agreements (SLAs) for uptime</li>
              <li>Incident response and communication plans</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">Third-Party Services and Vendors</h2>
            <p className="mb-4">
              We work with trusted third-party service providers and ensure they meet our security and compliance standards:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Authentication:</strong> Clerk (SOC 2 Type II compliant)</li>
              <li><strong>Database:</strong> Supabase/PostgreSQL (SOC 2 Type II compliant)</li>
              <li><strong>Hosting:</strong> Vercel (ISO 27001, SOC 2 Type II)</li>
              <li><strong>Payment Processing:</strong> Secure, PCI-DSS compliant processors</li>
            </ul>
            <p>
              We conduct due diligence on all vendors and maintain data processing agreements where required.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">Audit and Compliance Monitoring</h2>
            <p className="mb-4">
              We maintain ongoing compliance through:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Regular internal security audits</li>
              <li>Compliance monitoring and reporting</li>
              <li>Employee training on security and privacy</li>
              <li>Documentation of security policies and procedures</li>
              <li>Continuous improvement of security measures</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">Your Responsibilities</h2>
            <p className="mb-4">
              While we implement strong security measures, you also play a crucial role in protecting your data:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Use strong, unique passwords for your account</li>
              <li>Enable multi-factor authentication when available</li>
              <li>Keep your account credentials secure and confidential</li>
              <li>Regularly review and update your account settings</li>
              <li>Report any security concerns or suspicious activity immediately</li>
              <li>Ensure compliance with applicable laws when using our Service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">Compliance Certifications and Standards</h2>
            <p className="mb-4">
              We are committed to achieving and maintaining relevant compliance certifications. Our infrastructure partners maintain:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>SOC 2 Type II compliance (through our service providers)</li>
              <li>ISO 27001 information security management (through our hosting provider)</li>
              <li>GDPR compliance</li>
              <li>CCPA compliance</li>
            </ul>
            <p>
              We continuously work to enhance our compliance posture and may pursue additional certifications as we grow.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">Reporting Security Issues</h2>
            <p className="mb-4">
              If you discover a security vulnerability or have concerns about our compliance practices, please contact us immediately:
            </p>
            <ul className="list-none space-y-2 mb-4">
              <li><strong>Security Email:</strong> security@axiscrm.com</li>
              <li><strong>Compliance Email:</strong> compliance@axiscrm.com</li>
            </ul>
            <p>
              We take all security reports seriously and will investigate and respond promptly. We appreciate responsible disclosure of security vulnerabilities.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">Updates to Compliance Information</h2>
            <p className="mb-4">
              We regularly review and update our compliance practices. This page will be updated to reflect changes in our compliance posture, certifications, and standards. We encourage you to review this page periodically.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">Contact Us</h2>
            <p className="mb-4">
              For questions about our compliance practices, please contact us:
            </p>
            <ul className="list-none space-y-2 mb-4">
              <li><strong>Compliance Email:</strong> compliance@axiscrm.com</li>
              <li><strong>Security Email:</strong> security@axiscrm.com</li>
              <li><strong>General Inquiries:</strong> <a href="/" className="text-blue-400 hover:underline">axis-crm.com</a></li>
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

