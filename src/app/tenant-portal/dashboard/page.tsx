"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TenantHeader } from "@/components/tenant-portal/tenant-header";
import { PropertyOverviewCard } from "@/components/tenant-portal/property-overview-card";
import { FileText, Wrench, AlertCircle, DollarSign } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";

interface Tenant {
  id: number;
  name: string;
  email: string;
  monthlyRent?: number;
  leaseStart?: string;
  leaseEnd?: string;
  leaseStatus?: string;
  property?: any;
}

export default function TenantDashboardPage() {
  const router = useRouter();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("tenant_token");
      if (!token) {
        router.push("/tenant-portal/login");
        return;
      }

      // Fetch tenant data
      const tenantRes = await fetch("/api/auth/tenant/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!tenantRes.ok) {
        throw new Error("Failed to fetch tenant data");
      }

      const tenantData = await tenantRes.json();
      setTenant(tenantData.tenant);

      // Fetch invoices
      const invoicesRes = await fetch(`/api/invoices/mobile?tenantEmail=${encodeURIComponent(tenantData.tenant.email)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (invoicesRes.ok) {
        const invoicesData = await invoicesRes.json();
        setInvoices(Array.isArray(invoicesData) ? invoicesData : []);
      }

      // Fetch maintenance requests
      const maintenanceRes = await fetch(`/api/maintenance/mobile?tenantId=${tenantData.tenant.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (maintenanceRes.ok) {
        const maintenanceData = await maintenanceRes.json();
        setMaintenanceRequests(Array.isArray(maintenanceData) ? maintenanceData : []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  const unpaidInvoices = invoices.filter(inv => inv.paymentStatus !== "paid");
  const totalUnpaid = unpaidInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
  const openMaintenance = maintenanceRequests.filter(req => req.status !== "closed");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <TenantHeader />
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TenantHeader />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome back, {tenant?.name || "Tenant"}!
            </h1>
            <p className="text-muted-foreground mt-2">
              Here's an overview of your account
            </p>
          </div>

          <PropertyOverviewCard property={tenant?.property || null} tenant={tenant} />

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="size-5" />
                  Payment Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {totalUnpaid > 0 ? (
                  <>
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2 text-red-800">
                        <AlertCircle className="size-5" />
                        <span className="font-semibold">Outstanding Balance</span>
                      </div>
                      <p className="text-2xl font-bold text-red-900 mt-2">
                        ${totalUnpaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-sm text-red-700 mt-1">
                        {unpaidInvoices.length} unpaid invoice{unpaidInvoices.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <Button asChild className="w-full">
                      <Link href="/tenant-portal/invoices">View Invoices</Link>
                    </Button>
                  </>
                ) : (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                    <p className="text-green-800 font-semibold">All paid up!</p>
                    <p className="text-sm text-green-700 mt-1">No outstanding invoices</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="size-5" />
                  Maintenance Requests
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {openMaintenance.length > 0 ? (
                  <>
                    <div className="space-y-2">
                      {openMaintenance.slice(0, 3).map((req) => (
                        <div key={req.id} className="p-3 border rounded-lg">
                          <p className="font-medium">{req.title}</p>
                          <p className="text-sm text-muted-foreground">{req.status}</p>
                        </div>
                      ))}
                    </div>
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/tenant-portal/maintenance">View All Requests</Link>
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">No open maintenance requests</p>
                    <Button asChild variant="outline" className="mt-4">
                      <Link href="/tenant-portal/maintenance">Submit Request</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push("/tenant-portal/invoices")}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="size-5" />
                  Invoices
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{invoices.length}</p>
                <p className="text-sm text-muted-foreground">Total invoices</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push("/tenant-portal/maintenance")}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="size-5" />
                  Maintenance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{maintenanceRequests.length}</p>
                <p className="text-sm text-muted-foreground">Total requests</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push("/tenant-portal/lease")}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="size-5" />
                  Lease
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">View lease documents</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

