"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Search, Eye, Edit, Trash2, Filter, FileText, Mail, Upload, Sparkles, MessageSquare, Download, UserPlus, Copy } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { generateInvoicePDF, downloadInvoicePDF } from "@/lib/pdf-generator";
import { sendInvoiceWithCaption } from "@/app/actions/whatsapp";
import { LateFeeBadge } from "@/components/invoices/late-fee-badge";
import { formatCurrency } from "@/lib/utils";
import type { CurrencyCode } from "@/lib/currency-formatter";

type LeaseStatus = "active" | "expired" | "pending" | "terminated";

interface Tenant {
  id: number;
  name: string;
  email: string;
  phone?: string;
  property?: any;
  propertyId?: number;
  leaseStatus: LeaseStatus;
  leaseStart: string;
  leaseEnd: string;
  monthlyRent?: number;
  deposit?: number;
}

interface Invoice {
  id: number;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  totalAmount: number;
  paymentStatus: string;
  propertyId?: number;
  tenantId?: number;
  clientName: string;
  clientEmail: string;
  clientAddress?: string;
  clientPhone?: string;
  items?: any;
  subtotal?: number;
  taxRate?: number;
  taxAmount?: number;
  notes?: string;
  paymentTerms?: string;
  lateFeePolicy?: string;
  agentName?: string;
  agentAgency?: string;
  agentEmail?: string;
  agentPhone?: string;
  ownerName?: string;
  ownerEmail?: string;
  ownerPhone?: string;
  logoMode?: string;
  logoDataUrl?: string;
  logoWidth?: number;
  companyName?: string;
  companyTagline?: string;
}

function TenantsPageContent() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [properties, setProperties] = useState<Array<{ id: number; title?: string; address?: string }>>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProperty, setSelectedProperty] = useState<string>("all");
  const [selectedLeaseStatus, setSelectedLeaseStatus] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExtractingLease, setIsExtractingLease] = useState(false);
  const [revokingTenantId, setRevokingTenantId] = useState<number | null>(null);
  const [selectedInvoiceForPreview, setSelectedInvoiceForPreview] = useState<Invoice | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [registrationLink, setRegistrationLink] = useState<string | null>(null);
  const [selectedTenantForRegistration, setSelectedTenantForRegistration] = useState<Tenant | null>(null);
  const [newTenant, setNewTenant] = useState({
    name: "",
    email: "",
    phone: "",
    propertyId: "",
    leaseStart: "",
    leaseEnd: "",
    leaseStatus: "active" as LeaseStatus,
    monthlyRent: "",
    yearlyIncreaseRate: "10",
    expectedNextYearRent: "",
    deposit: "",
  });

  // Handle lead conversion - pre-fill form when coming from leads page
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const convertLeadId = urlParams.get("convert");
    const leadName = urlParams.get("name");
    const leadPhone = urlParams.get("phone");
    const leadEmail = urlParams.get("email");

    if (convertLeadId && leadName && leadPhone) {
      // Pre-fill form with lead data
      setNewTenant((prev) => ({
        ...prev,
        name: decodeURIComponent(leadName),
        phone: decodeURIComponent(leadPhone),
        email: leadEmail ? decodeURIComponent(leadEmail) : "",
      }));
      setIsAddDialogOpen(true);

      // Archive the lead after conversion
      if (convertLeadId) {
        fetch(`/api/leads?id=${convertLeadId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "archived" }),
        }).catch((error) => {
          console.error("Failed to archive lead:", error);
        });
      }

      // Clean up URL params
      window.history.replaceState({}, "", "/tenants");
    }
  }, []);

  useEffect(() => {
    fetchTenants();
    fetchInvoices();
  }, [selectedProperty, selectedLeaseStatus]);

  const fetchInvoices = async () => {
    try {
      const response = await fetch("/api/invoices?limit=1000");
      
      if (!response.ok) {
        throw new Error(`Failed to fetch invoices: ${response.status}`);
      }
      
      const data = await response.json();
      setInvoices(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch invoices:", error);
      setInvoices([]); // Set empty array on error
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/properties?limit=100");
        
        if (!res.ok) {
          throw new Error(`Failed to fetch properties: ${res.status}`);
        }
        
        const data = await res.json();
        setProperties(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch properties:", error);
        setProperties([]);
      }
    })();
  }, []);

  useEffect(() => {
    const rent = parseFloat(newTenant.monthlyRent || "0");
    const rate = parseFloat(newTenant.yearlyIncreaseRate || "0");
    if (!isNaN(rent) && !isNaN(rate)) {
      const next = rent * (1 + rate / 100);
      setNewTenant((t) => ({ ...t, expectedNextYearRent: next ? next.toFixed(2) : "" }));
    }
  }, [newTenant.monthlyRent, newTenant.yearlyIncreaseRate]);

  const handleLeaseUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Please upload a PDF file");
      return;
    }

    setIsExtractingLease(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/ai/extract-lease", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.success && result.data) {
        const { startDate, endDate, rentAmount } = result.data;
        
        if (startDate) {
          setNewTenant((t) => ({ ...t, leaseStart: startDate }));
        }
        if (endDate) {
          setNewTenant((t) => ({ ...t, leaseEnd: endDate }));
        }
        if (rentAmount) {
          setNewTenant((t) => ({ ...t, monthlyRent: String(rentAmount) }));
        }

        toast.success("Data extracted from Lease document successfully!");
      } else {
        toast.error(result.error || "Failed to extract lease information");
      }
    } catch (error) {
      console.error("Lease extraction error:", error);
      toast.error("Failed to extract lease information. Please try again.");
    } finally {
      setIsExtractingLease(false);
      // Reset file input
      e.target.value = "";
    }
  };

  const handleRevokeLease = async (tenant: Tenant) => {
    const confirmation = window.confirm(
      `Revoke ${tenant.name}'s lease and remove their property access?`
    );
    if (!confirmation) return;

    setRevokingTenantId(tenant.id);
    try {
      const response = await fetch("/api/tenants/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: tenant.id,
          reason: "Lease terminated from dashboard",
        }),
      });

      if (response.ok) {
        toast.success("Lease revoked and tenant access updated");
        fetchTenants();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to revoke lease");
      }
    } catch (error) {
      console.error("Failed to revoke lease:", error);
      toast.error("Failed to revoke lease");
    } finally {
      setRevokingTenantId(null);
    }
  };

  const fetchTenants = async () => {
    try {
      setIsLoading(true);
      let url = "/api/tenants?";
      if (selectedProperty !== "all") {
        url += `propertyId=${selectedProperty}&`;
      }
      if (selectedLeaseStatus !== "all") {
        url += `leaseStatus=${selectedLeaseStatus}&`;
      }
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch tenants: ${response.status}`);
      }
      
      const data = await response.json();
      setTenants(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch tenants:", error);
      toast.error("Failed to load tenants. Please refresh the page.");
      setTenants([]); // Set empty array on error to prevent crashes
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTenant = async (e?: React.FormEvent) => {
    // Prevent default form submission if called from form
    if (e) {
      e.preventDefault();
    }

    // Prevent double submission
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTenant.name,
          email: newTenant.email,
          phone: newTenant.phone || null,
          propertyId: newTenant.propertyId || null,
          leaseStart: newTenant.leaseStart,
          leaseEnd: newTenant.leaseEnd,
          leaseStatus: newTenant.leaseStatus,
          monthlyRent: newTenant.monthlyRent ? parseFloat(newTenant.monthlyRent) : null,
          deposit: newTenant.deposit ? parseFloat(newTenant.deposit) : null,
          notes: newTenant.yearlyIncreaseRate || newTenant.expectedNextYearRent
            ? `increaseRate=${newTenant.yearlyIncreaseRate}%; expectedNextYear=${newTenant.expectedNextYearRent}`
            : undefined,
        }),
      });

      if (response.ok) {
        toast.success("Tenant created successfully");
        setIsAddDialogOpen(false);
        setNewTenant({
          name: "",
          email: "",
          phone: "",
          propertyId: "",
          leaseStart: "",
          leaseEnd: "",
          leaseStatus: "active",
          monthlyRent: "",
          yearlyIncreaseRate: "10",
          expectedNextYearRent: "",
          deposit: "",
        });
        fetchTenants();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to create tenant");
      }
    } catch (error) {
      toast.error("Failed to create tenant");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTenant = async (id: number) => {
    if (!confirm("Are you sure you want to delete this tenant?")) return;

    try {
      const response = await fetch(`/api/tenants?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Tenant deleted successfully");
        fetchTenants();
      } else {
        toast.error("Failed to delete tenant");
      }
    } catch (error) {
      toast.error("Failed to delete tenant");
    }
  };

  const handleGenerateInvoice = async (tenant: Tenant) => {
    if (!tenant.propertyId || !tenant.monthlyRent) {
      toast.error("Tenant must have a property and monthly rent to generate invoice");
      return;
    }

    try {
      const response = await fetch("/api/invoices/generate-rent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: tenant.id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success("Rent invoice generated successfully");
        fetchInvoices(); // Refresh local invoice list in tenant panel
        
        // Trigger invoice panel refresh if it's open in another tab/page
        // Using localStorage event to communicate across tabs
        window.localStorage.setItem('invoice_refresh_trigger', Date.now().toString());
        window.dispatchEvent(new Event('invoice_refresh'));
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to generate invoice");
      }
    } catch (error) {
      toast.error("Failed to generate invoice");
    }
  };

  const handleSendInvoice = async (tenant: Tenant) => {
    // First generate invoice if needed, then send
    if (!tenant.propertyId || !tenant.monthlyRent) {
      toast.error("Tenant must have a property and monthly rent");
      return;
    }

    try {
      // Generate invoice first
      const generateResponse = await fetch("/api/invoices/generate-rent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: tenant.id,
        }),
      });

      if (!generateResponse.ok) {
        const error = await generateResponse.json();
        // If invoice already exists, try to find it
        if (error.code === 'DUPLICATE_INVOICE' && error.invoice) {
          // Send existing invoice
          const sendResponse = await fetch("/api/invoices/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              invoiceId: error.invoice.id,
            }),
          });

          if (sendResponse.ok) {
            toast.success("Invoice sent to tenant's email");
            fetchInvoices();
          } else {
            toast.error("Failed to send invoice");
          }
        } else {
          toast.error(error.error || "Failed to generate invoice");
        }
        return;
      }

      const invoiceData = await generateResponse.json();
      
      // Send the invoice
      const sendResponse = await fetch("/api/invoices/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: invoiceData.invoice.id,
        }),
      });

      if (sendResponse.ok) {
        toast.success("Rent invoice sent to tenant's email");
        fetchInvoices();
      } else {
        toast.error("Failed to send invoice");
      }
    } catch (error) {
      toast.error("Failed to send invoice");
    }
  };

  const handleSendInvoiceWhatsApp = async (tenant: Tenant) => {
    // First generate invoice if needed, then send via WhatsApp
    if (!tenant.propertyId || !tenant.monthlyRent) {
      toast.error("Tenant must have a property and monthly rent");
      return;
    }

    if (!tenant.phone) {
      toast.error("Tenant must have a phone number to send via WhatsApp");
      return;
    }

    try {
      // Generate invoice first
      const generateResponse = await fetch("/api/invoices/generate-rent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: tenant.id,
        }),
      });

      let invoiceId: number;

      if (!generateResponse.ok) {
        const error = await generateResponse.json();
        // If invoice already exists, use that invoice ID
        if (error.code === 'DUPLICATE_INVOICE' && error.invoice) {
          invoiceId = error.invoice.id;
        } else {
          toast.error(error.error || "Failed to generate invoice");
          return;
        }
      } else {
        const invoiceData = await generateResponse.json();
        invoiceId = invoiceData.invoice.id;
      }

      // Send via WhatsApp
      const result = await sendInvoiceWithCaption(invoiceId);

      if (result.success) {
        toast.success(result.message || "Rent invoice sent via WhatsApp");
        fetchInvoices();
      } else {
        toast.error(result.error || result.message || "Failed to send invoice via WhatsApp");
      }
    } catch (error) {
      console.error("WhatsApp send error:", error);
      toast.error("Failed to send invoice via WhatsApp");
    }
  };

  const handlePreviewInvoice = async (invoice: Invoice) => {
    try {
      // Fetch full invoice details
      const response = await fetch(`/api/invoices?id=${invoice.id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch invoice details");
      }
      const fullInvoice = await response.json();
      setSelectedInvoiceForPreview(fullInvoice);
      setIsPreviewOpen(true);
    } catch (error) {
      console.error("Failed to preview invoice:", error);
      toast.error("Failed to preview invoice");
    }
  };

  const handleDownloadInvoice = async (invoice: Invoice) => {
    try {
      // Fetch full invoice details
      const response = await fetch(`/api/invoices?id=${invoice.id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch invoice details");
      }
      const fullInvoice = await response.json();

      // Fetch property details if needed
      let property = null;
      if (fullInvoice.propertyId) {
        const propertyResponse = await fetch(`/api/properties?id=${fullInvoice.propertyId}`);
        if (propertyResponse.ok) {
          property = await propertyResponse.json();
        }
      }

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
        logoMode: fullInvoice.logoMode,
        logoDataUrl: fullInvoice.logoDataUrl,
        logoWidth: fullInvoice.logoWidth,
        companyName: fullInvoice.companyName,
        companyTagline: fullInvoice.companyTagline,
        currency: (fullInvoice as any).currency || 'USD', // Include currency for PDF
      } as any;

      downloadInvoicePDF(pdfData, `invoice-${fullInvoice.invoiceNumber}.pdf`);
      toast.success("Invoice downloaded successfully");
    } catch (error) {
      console.error("Failed to download PDF:", error);
      toast.error("Failed to download PDF");
    }
  };

  const getStatusBadge = (invoice: Invoice) => {
    const statusColors: Record<string, string> = {
      paid: "bg-green-100 text-green-700",
      overdue: "bg-red-100 text-red-700",
      sent: "bg-blue-100 text-blue-700",
      draft: "bg-gray-100 text-gray-700",
      cancelled: "bg-slate-100 text-slate-700",
    };
    return (
      <Badge className={statusColors[invoice.paymentStatus] || statusColors.draft}>
        {invoice.paymentStatus.charAt(0).toUpperCase() + invoice.paymentStatus.slice(1)}
      </Badge>
    );
  };

  const getTenantInvoices = (tenantId: number) => {
    return invoices.filter(inv => inv.tenantId === tenantId);
  };

const getPaymentSummary = (tenant: Tenant) => {
    const tenantInvoices = getTenantInvoices(tenant.id);
    const overdueInvoices = tenantInvoices.filter(inv => {
      const dueDate = new Date(inv.dueDate);
      const today = new Date();
      return dueDate < today && inv.paymentStatus !== 'paid';
    });
    const totalLateFees = overdueInvoices.reduce((sum, inv) => sum + (inv.lateFeeAmount || 0), 0);
    
    // This would ideally come from invoice data
    // For now, return placeholder based on lease status
  if (tenant.leaseStatus === "pending") {
      return { summary: "Awaiting Deposit", details: `Lease starts ${new Date(tenant.leaseStart).toLocaleDateString()}`, lateFees: totalLateFees };
    }
  if (tenant.leaseStatus === "expired") {
      return { summary: "Overdue", details: "Lease expired", lateFees: totalLateFees };
    }
  if (tenant.leaseStatus === "terminated") {
    return { summary: "Lease Terminated", details: "Tenant access removed", lateFees: totalLateFees };
  }
    return { summary: "Paid", details: `Next due: ${new Date(tenant.leaseEnd).toLocaleDateString()}`, lateFees: totalLateFees };
  };

  const getLeaseStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: "bg-green-100 text-green-700",
      expired: "bg-red-100 text-red-700",
      pending: "bg-yellow-100 text-yellow-700",
    terminated: "bg-slate-200 text-slate-800",
    };
    return colors[status.toLowerCase()] || "bg-gray-100 text-gray-700";
  };

  const formatLeaseStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const filteredTenants = tenants.filter((tenant) => {
    const matchesSearch = searchQuery === "" ||
      tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Tenant Management</h1>
          <p className="text-muted-foreground">Manage all your tenants in one place.</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 size-4" />
              Add New Tenant
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Tenant</DialogTitle>
              <DialogDescription>
                Add a new tenant to your property management system
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateTenant} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={newTenant.name}
                    onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newTenant.email}
                    onChange={(e) => setNewTenant({ ...newTenant, email: e.target.value })}
                    placeholder="john@example.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={newTenant.phone}
                  onChange={(e) => setNewTenant({ ...newTenant, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="propertyId">Property</Label>
                <Select
                  value={newTenant.propertyId}
                  onValueChange={(value) => setNewTenant({ ...newTenant, propertyId: value })}
                >
                  <SelectTrigger id="propertyId">
                    <SelectValue placeholder="Select property (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.length === 0 ? (
                      <SelectItem value="">No properties</SelectItem>
                    ) : (
                      properties.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.title || p.address || `#${p.id}`}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="leasePdf">Upload Lease PDF (AI Auto-Fill)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="leasePdf"
                    type="file"
                    accept=".pdf"
                    onChange={handleLeaseUpload}
                    disabled={isExtractingLease}
                    className="flex-1"
                  />
                  {isExtractingLease && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Sparkles className="size-4 animate-pulse" />
                      Extracting...
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Upload a lease PDF to automatically extract start date, end date, and rent amount
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="leaseStart">Lease Start *</Label>
                  <Input
                    id="leaseStart"
                    type="date"
                    value={newTenant.leaseStart}
                    onChange={(e) => setNewTenant({ ...newTenant, leaseStart: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="leaseEnd">Lease End *</Label>
                  <Input
                    id="leaseEnd"
                    type="date"
                    value={newTenant.leaseEnd}
                    onChange={(e) => setNewTenant({ ...newTenant, leaseEnd: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                <Label htmlFor="leaseStatus">Lease Status *</Label>
                <Select
                  value={newTenant.leaseStatus}
                  onValueChange={(value: LeaseStatus) =>
                    setNewTenant({ ...newTenant, leaseStatus: value })
                  }
                >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="terminated">Terminated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="monthlyRent">Monthly Rent</Label>
                  <Input
                    id="monthlyRent"
                    type="number"
                    value={newTenant.monthlyRent}
                    onChange={(e) => setNewTenant({ ...newTenant, monthlyRent: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="yearlyIncreaseRate">Yearly Increase Rate (%)</Label>
                  <Input
                    id="yearlyIncreaseRate"
                    type="number"
                    value={newTenant.yearlyIncreaseRate}
                    onChange={(e) =>
                      setNewTenant({ ...newTenant, yearlyIncreaseRate: e.target.value })
                    }
                    placeholder="e.g., 10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expectedNextYearRent">Expected Next Year Rent</Label>
                  <Input
                    id="expectedNextYearRent"
                    value={newTenant.expectedNextYearRent}
                    readOnly
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Tenant"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Tenants</CardTitle>
          <CardDescription>Manage tenant information and lease details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search tenants..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={selectedProperty} onValueChange={setSelectedProperty}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by Property" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Properties</SelectItem>
                {properties.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.title || p.address || `#${p.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedLeaseStatus} onValueChange={setSelectedLeaseStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by Lease Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="terminated">Terminated</SelectItem>
              </SelectContent>
            </Select>
          </div>

            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredTenants.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {searchQuery ? "No tenants found matching your search" : "No tenants found. Add your first tenant to get started."}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>TENANT NAME</TableHead>
                    <TableHead>PROPERTY</TableHead>
                    <TableHead>LEASE STATUS</TableHead>
                    <TableHead>PAYMENT SUMMARY</TableHead>
                    <TableHead>ACTIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTenants.map((tenant) => {
                    const payment = getPaymentSummary(tenant);
                    return (
                      <TableRow key={tenant.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="size-8">
                              <AvatarFallback>{getInitials(tenant.name)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{tenant.name}</div>
                              <div className="text-sm text-muted-foreground">{tenant.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {tenant.property
                            ? `${tenant.property.title || tenant.property.address || "N/A"}${tenant.property.unit ? `, ${tenant.property.unit}` : ""}`
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          <Badge className={getLeaseStatusColor(tenant.leaseStatus)}>
                            {formatLeaseStatus(tenant.leaseStatus)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{payment.summary}</div>
                            <div className="text-sm text-muted-foreground">{payment.details}</div>
                            {payment.lateFees > 0 && (
                              <div className="mt-1">
                                <LateFeeBadge lateFeeAmount={payment.lateFees} />
                              </div>
                            )}
                          </div>
                        </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              try {
                                const res = await fetch("/api/tenants/generate-registration-link", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ tenantId: tenant.id, sendEmail: false }),
                                });
                                if (res.ok) {
                                  const data = await res.json();
                                  setRegistrationLink(data.registrationLink);
                                  setSelectedTenantForRegistration(tenant);
                                  toast.success("Registration link generated");
                                } else {
                                  toast.error("Failed to generate registration link");
                                }
                              } catch (error) {
                                toast.error("Failed to generate registration link");
                              }
                            }}
                            title="Generate Registration Link"
                          >
                            <UserPlus className="size-4" />
                          </Button>
                          {(() => {
                            const tenantInvoices = getTenantInvoices(tenant.id);
                              const latestInvoice = tenantInvoices.length > 0
                                ? tenantInvoices.sort((a, b) => 
                                    new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime()
                                  )[0]
                                : null;

                              return (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={async () => {
                                      if (latestInvoice) {
                                        handlePreviewInvoice(latestInvoice);
                                      } else {
                                        // Generate invoice first, then preview
                                        await handleGenerateInvoice(tenant);
                                        // Wait a moment for invoice to be created, then fetch and preview
                                        setTimeout(async () => {
                                          await fetchInvoices();
                                          const updatedInvoices = getTenantInvoices(tenant.id);
                                          if (updatedInvoices.length > 0) {
                                            const updatedLatest = updatedInvoices.sort((a, b) => 
                                              new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime()
                                            )[0];
                                            handlePreviewInvoice(updatedLatest);
                                          }
                                        }, 1000);
                                      }
                                    }}
                                    title="View Invoice Preview"
                                  >
                                    <Eye className="size-4 mr-1" />
                                    View Invoice
                                  </Button>
                                  {latestInvoice && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDownloadInvoice(latestInvoice)}
                                      title="Download Invoice PDF"
                                    >
                                      <Download className="size-4" />
                                    </Button>
                                  )}
                                </>
                              );
                            })()}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleGenerateInvoice(tenant)}
                              title="Generate Rent Invoice"
                            >
                              <FileText className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSendInvoice(tenant)}
                              title="Send Rent Invoice via Email"
                            >
                              <Mail className="size-4" />
                            </Button>
                            {tenant.phone && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSendInvoiceWhatsApp(tenant)}
                                title="Send Rent Invoice via WhatsApp"
                              >
                                <MessageSquare className="size-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedTenant(tenant);
                                setIsEditDialogOpen(true);
                              }}
                            >
                              <Edit className="size-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-destructive text-destructive hover:bg-destructive/10"
                              onClick={() => handleRevokeLease(tenant)}
                              disabled={revokingTenantId === tenant.id || tenant.leaseStatus === "terminated"}
                              title={
                                tenant.leaseStatus === "terminated"
                                  ? "Lease already terminated"
                                  : "Terminate lease and remove tenant property access"
                              }
                            >
                              {revokingTenantId === tenant.id
                                ? "Revoking..."
                                : tenant.leaseStatus === "terminated"
                                  ? "Terminated"
                                  : "Terminate"}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteTenant(tenant.id)}
                            >
                              <Trash2 className="size-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
        </CardContent>
      </Card>

      {/* Invoice Preview Modal */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="relative">
            <DialogTitle className="pr-8">
              Invoice #{selectedInvoiceForPreview?.invoiceNumber || "N/A"}
            </DialogTitle>
            <DialogDescription>
              {selectedInvoiceForPreview && getStatusBadge(selectedInvoiceForPreview)}
            </DialogDescription>
          </DialogHeader>
          
          {selectedInvoiceForPreview && (
            <div className="space-y-6 mt-4">
              {/* Bill To Section */}
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Bill To</h3>
                <div className="space-y-1 text-sm">
                  <p className="font-medium">{selectedInvoiceForPreview.clientName}</p>
                  {selectedInvoiceForPreview.clientAddress && (
                    <p className="text-muted-foreground">{selectedInvoiceForPreview.clientAddress}</p>
                  )}
                  {selectedInvoiceForPreview.clientEmail && (
                    <p className="text-muted-foreground">{selectedInvoiceForPreview.clientEmail}</p>
                  )}
                  {selectedInvoiceForPreview.clientPhone && (
                    <p className="text-muted-foreground">{selectedInvoiceForPreview.clientPhone}</p>
                  )}
                </div>
              </div>

              {/* Invoice Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Issue Date</p>
                  <p className="font-medium">
                    {new Date(selectedInvoiceForPreview.invoiceDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Due Date</p>
                  <p className="font-medium">
                    {new Date(selectedInvoiceForPreview.dueDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedInvoiceForPreview.items && Array.isArray(selectedInvoiceForPreview.items) && selectedInvoiceForPreview.items.length > 0 ? (
                      selectedInvoiceForPreview.items.map((item: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>
                            {item.description || item.name || "Item"}
                            {item.quantity && item.rate && (
                              <span className="text-muted-foreground text-xs ml-2">
                                (Qty: {item.quantity} × ${item.rate})
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ${(item.amount || item.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center text-muted-foreground">
                          No line items
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Totals */}
              <div className="space-y-2 border-t pt-4">
                {selectedInvoiceForPreview.subtotal !== undefined && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">
                      {formatCurrency(
                        selectedInvoiceForPreview.subtotal,
                        ((selectedInvoiceForPreview as any).currency || "USD") as CurrencyCode,
                        { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                      )}
                    </span>
                  </div>
                )}
                {selectedInvoiceForPreview.taxRate !== undefined && selectedInvoiceForPreview.taxRate > 0 && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Tax ({selectedInvoiceForPreview.taxRate}%)
                      </span>
                      <span className="font-medium">
                        {formatCurrency(
                          selectedInvoiceForPreview.taxAmount || 0,
                          ((selectedInvoiceForPreview as any).currency || "USD") as CurrencyCode,
                          { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                        )}
                      </span>
                    </div>
                  </>
                )}
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total Amount</span>
                  <span>
                    {formatCurrency(
                      selectedInvoiceForPreview.totalAmount,
                      ((selectedInvoiceForPreview as any).currency || "USD") as CurrencyCode,
                      { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                    )}
                  </span>
                </div>
              </div>

              {/* Notes */}
              {selectedInvoiceForPreview.notes && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Notes</h4>
                  <p className="text-sm text-muted-foreground">{selectedInvoiceForPreview.notes}</p>
                </div>
              )}

              {/* Download Button */}
              <div className="flex justify-end pt-4 border-t">
                <Button
                  onClick={() => handleDownloadInvoice(selectedInvoiceForPreview)}
                  variant="outline"
                >
                  <Download className="size-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Registration Link Dialog */}
      <Dialog open={!!registrationLink} onOpenChange={(open) => !open && setRegistrationLink(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tenant Registration Link</DialogTitle>
            <DialogDescription>
              Share this link with {selectedTenantForRegistration?.name || "the tenant"} to allow them to create their portal account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Registration Link</Label>
              <div className="flex gap-2">
                <Input
                  value={registrationLink || ""}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (registrationLink) {
                      navigator.clipboard.writeText(registrationLink);
                      toast.success("Link copied to clipboard");
                    }
                  }}
                >
                  <Copy className="size-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                This link expires in 7 days. The tenant can use it to create their account.
              </p>
            </div>
            {selectedTenantForRegistration?.email && (
              <Button
                className="w-full"
                onClick={async () => {
                  try {
                    const res = await fetch("/api/tenants/generate-registration-link", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        tenantId: selectedTenantForRegistration.id,
                        sendEmail: true,
                      }),
                    });
                    if (res.ok) {
                      toast.success("Registration email sent to tenant");
                      setRegistrationLink(null);
                    } else {
                      toast.error("Failed to send email");
                    }
                  } catch (error) {
                    toast.error("Failed to send email");
                  }
                }}
              >
                <Mail className="mr-2 size-4" />
                Send Registration Email to {selectedTenantForRegistration.email}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Prevent static generation since this page uses client-side data fetching
export const dynamic = 'force-dynamic';

// Wrap component to catch any rendering errors
function TenantsPage() {
  return <TenantsPageContent />;
}

export default TenantsPage;
