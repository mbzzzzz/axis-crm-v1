"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TenantHeader } from "@/components/tenant-portal/tenant-header";
import { Download, FileText } from "lucide-react";
import { toast } from "sonner";
import { downloadInvoicePDF } from "@/lib/pdf-generator";

interface Invoice {
  id: number;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  totalAmount: number;
  paymentStatus: string;
  lateFeeAmount?: number;
  items?: any[];
}

export default function TenantInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tenant, setTenant] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("tenant_token");
      
      if (!token) {
        return;
      }

      // First, fetch tenant data to get email
      const tenantRes = await fetch("/api/auth/tenant/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!tenantRes.ok) {
        throw new Error("Failed to fetch tenant data");
      }

      const tenantData = await tenantRes.json();
      setTenant(tenantData.tenant);

      // Then fetch invoices using tenant email
      const response = await fetch(`/api/invoices/mobile?tenantEmail=${encodeURIComponent(tenantData.tenant.email)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setInvoices(Array.isArray(data) ? data : []);
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.error || "Failed to load invoices");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load invoices");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPDF = async (invoice: Invoice) => {
    try {
      const token = localStorage.getItem("tenant_token");
      if (!token) {
        toast.error("Not authenticated");
        return;
      }

      // Fetch full invoice details with tenant authentication
      const response = await fetch(`/api/invoices?id=${invoice.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch invoice details");
      }
      
      const fullInvoice = await response.json();
      await downloadInvoicePDF(fullInvoice);
      toast.success("Invoice downloaded successfully");
    } catch (error) {
      console.error("Failed to download PDF:", error);
      toast.error("Failed to download invoice");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      paid: "bg-green-100 text-green-700",
      overdue: "bg-red-100 text-red-700",
      sent: "bg-blue-100 text-blue-700",
      draft: "bg-gray-100 text-gray-700",
    };
    return (
      <Badge className={statusColors[status] || statusColors.draft}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const isOverdue = (invoice: Invoice) => {
    const dueDate = new Date(invoice.dueDate);
    const today = new Date();
    return dueDate < today && invoice.paymentStatus !== "paid";
  };

  return (
    <div className="min-h-screen bg-background">
      <TenantHeader />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Invoices</h1>
            <p className="text-muted-foreground mt-2">View and download your invoices</p>
          </div>

          {isLoading ? (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : invoices.length === 0 ? (
            <Card className="flex min-h-[400px] items-center justify-center">
              <CardContent className="text-center">
                <FileText className="mx-auto size-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No invoices found</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Your invoices will appear here once they are generated
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {invoices.map((invoice) => {
                const overdue = isOverdue(invoice);
                return (
                  <Card key={invoice.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{invoice.invoiceNumber}</h3>
                            {getStatusBadge(invoice.paymentStatus)}
                            {overdue && (
                              <Badge variant="destructive">Overdue</Badge>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Issue Date: </span>
                              <span>{new Date(invoice.invoiceDate).toLocaleDateString()}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Due Date: </span>
                              <span className={overdue ? "text-red-600 font-medium" : ""}>
                                {new Date(invoice.dueDate).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div>
                              <span className="text-sm text-muted-foreground">Total Amount: </span>
                              <span className="font-semibold text-lg">
                                ${invoice.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                            {invoice.lateFeeAmount && invoice.lateFeeAmount > 0 && (
                              <div>
                                <span className="text-sm text-muted-foreground">Late Fee: </span>
                                <span className="font-semibold text-red-600">
                                  ${invoice.lateFeeAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => handleDownloadPDF(invoice)}
                        >
                          <Download className="mr-2 size-4" />
                          Download PDF
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

