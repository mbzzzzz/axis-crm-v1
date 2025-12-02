import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Axis CRM Terms of Service - Read our terms and conditions for using the platform.",
};

export default function TermsOfServiceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

