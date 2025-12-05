"use client";

import { usePathname } from "next/navigation";
import ThemeToggle from "@/components/ui/theme-toggle";

export function ConditionalThemeToggle() {
  const pathname = usePathname();
  
  // Hide theme toggle on landing page (root path) and tenant portal pages
  if (pathname === "/" || pathname?.startsWith("/tenant-portal")) {
    return null;
  }
  
  return (
    <div className="fixed right-4 top-4 z-50">
      <ThemeToggle />
    </div>
  );
}

