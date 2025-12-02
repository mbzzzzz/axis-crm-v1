import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compliance",
  description: "Axis CRM Compliance Information - Learn about our security, privacy, and regulatory compliance standards.",
};

export default function ComplianceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

