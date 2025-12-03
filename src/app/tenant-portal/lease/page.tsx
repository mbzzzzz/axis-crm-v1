"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TenantHeader } from "@/components/tenant-portal/tenant-header";
import { FileText, Download, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

interface Lease {
  id: number;
  leaseType: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  deposit?: number;
  status: string;
  signedByTenant: number;
  signedByOwner: number;
  signedAt?: string;
  documentUrl?: string;
  terms?: any;
}

export default function TenantLeasePage() {
  const [lease, setLease] = useState<Lease | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLease();
  }, []);

  const fetchLease = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("tenant_token");
      const tenantId = localStorage.getItem("tenant_id");

      if (!token || !tenantId) {
        return;
      }

      // Fetch leases for this tenant
      const response = await fetch(`/api/leases?tenantId=${tenantId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        // Get the most recent active lease
        const activeLease = Array.isArray(data) && data.length > 0
          ? data.find((l: Lease) => l.status === "active") || data[0]
          : null;
        setLease(activeLease);
      }
    } catch (error) {
      console.error("Error fetching lease:", error);
      toast.error("Failed to load lease information");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!lease || !lease.documentUrl) {
      toast.error("Lease document not available");
      return;
    }

    // In production, this would download from Supabase Storage
    // For now, open in new tab
    window.open(lease.documentUrl, "_blank");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <TenantHeader />
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!lease) {
    return (
      <div className="min-h-screen bg-background">
        <TenantHeader />
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <Card className="flex min-h-[400px] items-center justify-center">
            <CardContent className="text-center">
              <FileText className="mx-auto size-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No lease found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Your lease information will appear here once it's created
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isFullySigned = lease.signedByTenant === 1 && lease.signedByOwner === 1;

  return (
    <div className="min-h-screen bg-background">
      <TenantHeader />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Lease Agreement</h1>
              <p className="text-muted-foreground mt-2">View your lease details and documents</p>
            </div>
            {lease.documentUrl && (
              <Button onClick={handleDownloadPDF}>
                <Download className="mr-2 size-4" />
                Download Lease PDF
              </Button>
            )}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Lease Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Lease Type</label>
                  <p className="mt-1">
                    {lease.leaseType.charAt(0).toUpperCase() + lease.leaseType.slice(1)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Start Date</label>
                  <p className="mt-1">{new Date(lease.startDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">End Date</label>
                  <p className="mt-1">{new Date(lease.endDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Monthly Rent</label>
                  <p className="mt-1 font-semibold text-lg">${lease.monthlyRent.toLocaleString()}</p>
                </div>
                {lease.deposit && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Security Deposit</label>
                    <p className="mt-1 font-semibold">${lease.deposit.toLocaleString()}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">
                    <Badge
                      className={
                        lease.status === "active"
                          ? "bg-green-100 text-green-700"
                          : lease.status === "expired"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-700"
                      }
                    >
                      {lease.status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Signature Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    {lease.signedByTenant === 1 ? (
                      <CheckCircle className="size-5 text-green-600" />
                    ) : (
                      <XCircle className="size-5 text-gray-400" />
                    )}
                    <span className="font-medium">Your Signature</span>
                  </div>
                  <Badge variant={lease.signedByTenant === 1 ? "default" : "secondary"}>
                    {lease.signedByTenant === 1 ? "Signed" : "Pending"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    {lease.signedByOwner === 1 ? (
                      <CheckCircle className="size-5 text-green-600" />
                    ) : (
                      <XCircle className="size-5 text-gray-400" />
                    )}
                    <span className="font-medium">Owner Signature</span>
                  </div>
                  <Badge variant={lease.signedByOwner === 1 ? "default" : "secondary"}>
                    {lease.signedByOwner === 1 ? "Signed" : "Pending"}
                  </Badge>
                </div>

                {lease.signedAt && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Fully Signed On</label>
                    <p className="mt-1">{new Date(lease.signedAt).toLocaleString()}</p>
                  </div>
                )}

                {isFullySigned && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800 font-medium">
                      ✓ Lease is fully signed and active
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {lease.terms && (
            <Card>
              <CardHeader>
                <CardTitle>Lease Terms</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {lease.terms.additionalTerms && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Additional Terms</label>
                    <p className="mt-1 whitespace-pre-wrap">{lease.terms.additionalTerms}</p>
                  </div>
                )}
                {lease.terms.utilities && lease.terms.utilities.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Utilities</label>
                    <p className="mt-1">{lease.terms.utilities.join(", ")}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

