"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getTenantFromToken } from "@/lib/tenant-auth";
import { Toaster } from "@/components/ui/sonner";

export default function TenantPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      // Skip auth check for login page
      if (pathname === "/tenant-portal/login" || pathname === "/tenant-portal/register") {
        setIsChecking(false);
        return;
      }

      const token = localStorage.getItem("tenant_token");
      if (!token) {
        router.push("/tenant-portal/login");
        setIsChecking(false);
        return;
      }

      const tenant = await getTenantFromToken(token);
      if (!tenant) {
        localStorage.removeItem("tenant_token");
        router.push("/tenant-portal/login");
        setIsChecking(false);
        return;
      }

      setIsAuthenticated(true);
      setIsChecking(false);
    };

    checkAuth();
  }, [pathname, router]);

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="size-16 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {children}
      <Toaster />
    </div>
  );
}

