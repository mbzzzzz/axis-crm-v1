"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ArrowLeft, Download, Edit } from "lucide-react";
import { LeaseSignatureDialog } from "@/components/leases/lease-signature-dialog";
import { generateLeasePDF } from "@/lib/lease-pdf-generator";
import { LeaseTerms } from "@/lib/lease-templates";

interface Lease {
  id: number;
  tenantId: number;
  propertyId: number;
  leaseType: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  deposit?: number;
  currency?: string;
  terms: LeaseTerms | null;
  status: string;
  signedByTenant: number;
  signedByOwner: number;
  signedAt?: string;
  documentUrl?: string;
  tenant?: { id: number; name: string; email: string };
  property?: { id: number; title?: string; address: string };
  ownerSignature?: string | null;
  tenantSignature?: string | null;
}

export default function LeaseDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const leaseId = params.id as string;
  const [lease, setLease] = useState<Lease | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSignDialogOpen, setIsSignDialogOpen] = useState(false);
  const [signerType, setSignerType] = useState<"tenant" | "owner">("owner");

  useEffect(() => {
    if (leaseId) {
      fetchLease();
    }
  }, [leaseId]);

  const fetchLease = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/leases/${leaseId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch lease");
      }
      const data = await response.json();
      setLease(data);
    } catch (error) {
      console.error("Error fetching lease:", error);
      toast.error("Failed to load lease");
      router.push("/leases");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSign = async (signatureDataUrl: string) => {
    try {
      // Generate PDF with signature
      if (!lease || !lease.terms) {
        toast.error("Lease terms not found");
        return;
      }

      const leaseNumber = `LEASE-${lease.id}`;
      const pdf = generateLeasePDF(lease.terms, leaseNumber, {
        tenantName: lease.tenant?.name,
        tenantEmail: lease.tenant?.email,
        propertyTitle: lease.property?.title,
        propertyAddress: lease.property?.address,
        leaseType: lease.leaseType,
        startDate: new Date(lease.startDate).toLocaleDateString(),
        endDate: new Date(lease.endDate).toLocaleDateString(),
        monthlyRent: lease.monthlyRent,
        deposit: lease.deposit ?? null,
        currency: lease.currency || "USD",
        ownerSignatureDataUrl: lease.ownerSignature || undefined,
        tenantSignatureDataUrl: lease.tenantSignature || undefined,
      });
      
      // Convert PDF to buffer for upload
      const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));

      const response = await fetch(`/api/leases/${leaseId}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signerType,
          signatureDataUrl,
          // PDF will be uploaded to Supabase Storage by the API
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to sign lease");
      }

      const result = await response.json();
      toast.success("Lease signed successfully");
      
      if (result.fullySigned) {
        toast.success("Lease is now fully signed and active!");
      }

      setIsSignDialogOpen(false);
      fetchLease();
    } catch (error: any) {
      toast.error(error.message || "Failed to sign lease");
    }
  };

  const handleDownloadPDF = () => {
    if (!lease || !lease.terms) {
      toast.error("Lease terms not found");
      return;
    }

    const leaseNumber = `LEASE-${lease.id}`;
    const pdf = generateLeasePDF(lease.terms, leaseNumber, {
      tenantName: lease.tenant?.name,
      tenantEmail: lease.tenant?.email,
      propertyTitle: lease.property?.title,
      propertyAddress: lease.property?.address,
      leaseType: lease.leaseType,
      startDate: new Date(lease.startDate).toLocaleDateString(),
      endDate: new Date(lease.endDate).toLocaleDateString(),
      monthlyRent: lease.monthlyRent,
      deposit: lease.deposit ?? null,
      currency: lease.currency || "USD",
      ownerSignatureDataUrl: lease.ownerSignature || undefined,
      tenantSignatureDataUrl: lease.tenantSignature || undefined,
    });
    pdf.save(`lease-${leaseNumber}.pdf`);
    toast.success("Lease PDF downloaded");
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!lease) {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <p>Lease not found</p>
      </div>
    );
  }

  const isFullySigned = lease.signedByTenant === 1 && lease.signedByOwner === 1;

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 size-4" />
          Back
        </Button>
        <div className="space-y-2 flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Lease Details</h1>
          <p className="text-muted-foreground">Lease #{lease.id}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownloadPDF}>
            <Download className="mr-2 size-4" />
            Download PDF
          </Button>
          {!isFullySigned && (
            <>
              {lease.signedByOwner === 0 && (
                <Button
                  onClick={() => {
                    setSignerType("owner");
                    setIsSignDialogOpen(true);
                  }}
                >
                  Sign as Owner
                </Button>
              )}
              {lease.signedByTenant === 0 && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSignerType("tenant");
                    setIsSignDialogOpen(true);
                  }}
                >
                  Sign as Tenant
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Lease Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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

            <div>
              <label className="text-sm font-medium text-muted-foreground">Tenant</label>
              <p className="mt-1 font-medium">{lease.tenant?.name || "Unknown"}</p>
              <p className="text-sm text-muted-foreground">{lease.tenant?.email}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Property</label>
              <p className="mt-1 font-medium">
                {lease.property?.title || lease.property?.address || "Unknown"}
              </p>
            </div>

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
              <p className="mt-1 font-semibold">
                {(lease.currency || "USD")} {lease.monthlyRent.toLocaleString()}
              </p>
            </div>

            {lease.deposit && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Security Deposit</label>
                <p className="mt-1 font-semibold">
                  {(lease.currency || "USD")} {lease.deposit.toLocaleString()}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Signature Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="font-medium">Owner Signature</span>
              <Badge variant={lease.signedByOwner === 1 ? "default" : "secondary"}>
                {lease.signedByOwner === 1 ? "Signed" : "Pending"}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="font-medium">Tenant Signature</span>
              <Badge variant={lease.signedByTenant === 1 ? "default" : "secondary"}>
                {lease.signedByTenant === 1 ? "Signed" : "Pending"}
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

      <LeaseSignatureDialog
        open={isSignDialogOpen}
        onOpenChange={setIsSignDialogOpen}
        onSign={handleSign}
        signerName={signerType === "owner" ? "Owner" : lease.tenant?.name || "Tenant"}
      />
    </div>
  );
}

