import { generateStructuredData } from "@/lib/seo";

export function StructuredData({ type, data }: { type: "Organization" | "WebApplication" | "SoftwareApplication"; data?: any }) {
  const structuredData = generateStructuredData(type, data);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

