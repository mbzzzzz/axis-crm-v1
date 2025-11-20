"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Search, FileText, Download, Eye, Edit, Trash2, Upload, Mail } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ImportExportDialog } from "@/components/import-export-dialog";
import { InvoiceForm } from "@/components/invoice-form";
import { downloadInvoicePDF } from "@/lib/pdf-generator";

interface Invoice {
  id: number;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  invoiceDate: string;
  dueDate: string;
  totalAmount: number;
  paymentStatus: string;
  items?: any[];
  subtotal?: number;
  taxRate?: number;
  taxAmount?: number;
  clientAddress?: string;
  clientPhone?: string;
  agentName?: string;
  agentAgency?: string;
  agentEmail?: string;
  agentPhone?: string;
  ownerName?: string;
  ownerEmail?: string;
  ownerPhone?: string;
  paymentTerms?: string;
  lateFeePolicy?: string;
  notes?: string;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const fetchInvoices = async () => {
    try {
      const response = await fetch("/api/invoices");
      const data = await response.json();
      
      // CRITICAL: Check if response is an error or not an array
      if (!response.ok || !Array.isArray(data)) {
        console.error("Failed to fetch invoices:", data);
        toast.error(data?.error || "Failed to load invoices");
        setInvoices([]);
        setFilteredInvoices([]);
        return;
      }
      
      setInvoices(data);
      setFilteredInvoices(data);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      toast.error("Failed to load invoices");
      setInvoices([]);
      setFilteredInvoices([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  useEffect(() => {
    const filtered = invoices.filter(
      (invoice) =>
        invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.clientEmail.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredInvoices(filtered);
  }, [searchQuery, invoices]);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this invoice?")) return;

    try {
      const response = await fetch(`/api/invoices?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Invoice deleted successfully");
        fetchInvoices();
      } else {
        toast.error("Failed to delete invoice");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const handleDownloadPDF = async (invoice: Invoice) => {
    try {
      // Fetch full invoice details if items are missing
      let fullInvoice = invoice;
      if (!invoice.items) {
        const response = await fetch(`/api/invoices?id=${invoice.id}`);
        fullInvoice = await response.json();
      }

      // Fetch property details
      const propertyResponse = await fetch(`/api/properties?id=${(fullInvoice as any).propertyId}`);
      const property = await propertyResponse.json();

      const pdfData = {
        invoiceNumber: fullInvoice.invoiceNumber,
        invoiceDate: fullInvoice.invoiceDate,
        dueDate: fullInvoice.dueDate,
        propertyAddress: property?.address,
        propertyUnit: property?.unit,
        propertyType: property?.propertyType,
        clientName: fullInvoice.clientName,
        clientEmail: fullInvoice.clientEmail,
        clientAddress: fullInvoice.clientAddress,
        clientPhone: fullInvoice.clientPhone,
        agentName: fullInvoice.agentName,
        agentAgency: fullInvoice.agentAgency,
        agentEmail: fullInvoice.agentEmail,
        agentPhone: fullInvoice.agentPhone,
        ownerName: fullInvoice.ownerName,
        ownerEmail: fullInvoice.ownerEmail,
        ownerPhone: fullInvoice.ownerPhone,
        items: fullInvoice.items || [],
        subtotal: fullInvoice.subtotal || 0,
        taxRate: fullInvoice.taxRate || 0,
        taxAmount: fullInvoice.taxAmount || 0,
        totalAmount: fullInvoice.totalAmount,
        paymentTerms: fullInvoice.paymentTerms,
        lateFeePolicy: fullInvoice.lateFeePolicy,
        notes: fullInvoice.notes,
        // Branding
        logoMode: (fullInvoice as any).logoMode,
        logoDataUrl: (fullInvoice as any).logoDataUrl,
        logoWidth: (fullInvoice as any).logoWidth,
        companyName: (fullInvoice as any).companyName,
        companyTagline: (fullInvoice as any).companyTagline,
      } as any;

      downloadInvoicePDF(pdfData, `invoice-${fullInvoice.invoiceNumber}.pdf`);
      toast.success("Invoice PDF downloaded");
    } catch (error) {
      console.error("Failed to download PDF:", error);
      toast.error("Failed to download PDF");
    }
  };

  const handleSendInvoice = async (invoice: Invoice) => {
    try {
      const response = await fetch("/api/invoices/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: invoice.id,
        }),
      });

      if (response.ok) {
        toast.success("Invoice sent to " + invoice.clientEmail);
        fetchInvoices(); // Refresh to update status
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to send invoice");
      }
    } catch (error) {
      toast.error("Failed to send invoice");
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: "bg-gray-500",
      sent: "bg-blue-500",
      paid: "bg-green-500",
      overdue: "bg-red-500",
      cancelled: "bg-orange-500",
    };
    return colors[status] || "bg-gray-500";
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string }> = {
      paid: { bg: "bg-green-100", text: "text-green-700" },
      overdue: { bg: "bg-red-100", text: "text-red-700" },
      sent: { bg: "bg-blue-100", text: "text-blue-700" },
      draft: { bg: "bg-gray-100", text: "text-gray-700" },
    };
    const config = statusConfig[status.toLowerCase()] || statusConfig.draft;
    return (
      <Badge className={`${config.bg} ${config.text} border-0`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Invoicing</h1>
          <p className="text-muted-foreground">Manage and track all tenant invoices.</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 size-4" />
              Create Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Invoice</DialogTitle>
              <DialogDescription>
                Generate a professional invoice for your property
              </DialogDescription>
            </DialogHeader>
            <InvoiceForm
              onSuccess={() => {
                setIsAddDialogOpen(false);
                fetchInvoices();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by tenant..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              All Statuses
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>All Statuses</DropdownMenuItem>
            <DropdownMenuItem>Paid</DropdownMenuItem>
            <DropdownMenuItem>Overdue</DropdownMenuItem>
            <DropdownMenuItem>Sent</DropdownMenuItem>
            <DropdownMenuItem>Draft</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Input type="date" className="w-40" placeholder="mm/dd/yyyy" />
      </div>


      {isLoading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/4" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : filteredInvoices.length === 0 ? (
        <Card className="flex min-h-[400px] items-center justify-center">
          <CardContent className="text-center">
            <FileText className="mx-auto size-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No invoices found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {searchQuery
                ? "Try adjusting your search"
                : "Create your first invoice to get started"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Invoices</CardTitle>
            <CardDescription>A list of all your invoices</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>TENANT</TableHead>
                  <TableHead>PROPERTY</TableHead>
                  <TableHead>ISSUE DATE</TableHead>
                  <TableHead>DUE DATE</TableHead>
                  <TableHead>AMOUNT</TableHead>
                  <TableHead>STATUS</TableHead>
                  <TableHead>ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.clientName}</TableCell>
                    <TableCell>{invoice.clientAddress || "N/A"}</TableCell>
                    <TableCell>{new Date(invoice.invoiceDate).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(invoice.dueDate).toLocaleDateString()}</TableCell>
                    <TableCell className="font-semibold">
                      ${invoice.totalAmount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(invoice.paymentStatus)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadPDF(invoice)}
                        >
                          <Download className="size-4" />
                        </Button>
                        {(invoice.paymentStatus === "overdue" || invoice.paymentStatus === "draft" || invoice.paymentStatus === "sent") && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSendInvoice(invoice)}
                            title="Send invoice via email"
                          >
                            <Mail className="size-4" />
                          </Button>
                        )}
                        {invoice.paymentStatus === "draft" && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedInvoice(invoice);
                                setIsViewDialogOpen(true);
                              }}
                            >
                              <Edit className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(invoice.id)}
                            >
                              <Trash2 className="size-4 text-destructive" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                        >
                          <span className="text-muted-foreground">⋯</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex items-center justify-between px-4 py-4">
              <div className="text-sm text-muted-foreground">
                Showing 1 to {filteredInvoices.length} of {invoices.length} results
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled>
                  Previous
                </Button>
                <Button variant="outline" size="sm">
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* View/Edit Invoice Dialog */}
      {selectedInvoice && (
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Invoice Details</DialogTitle>
              <DialogDescription>
                View and edit invoice information
              </DialogDescription>
            </DialogHeader>
            <InvoiceForm
              invoice={selectedInvoice}
              onSuccess={() => {
                setIsViewDialogOpen(false);
                setSelectedInvoice(null);
                fetchInvoices();
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      <ImportExportDialog
        open={isImportExportOpen}
        onOpenChange={setIsImportExportOpen}
        type="invoices"
        data={invoices}
        onImportSuccess={fetchInvoices}
      />
    </div>
  );
}