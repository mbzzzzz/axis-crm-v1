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
import { Plus, Search, Eye, Edit, Trash2, Filter, FileText, Mail, Upload, Sparkles, MessageSquare } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { generateInvoicePDF } from "@/lib/pdf-generator";
import { sendInvoiceWithCaption } from "@/app/actions/whatsapp";

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
        fetchInvoices();
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
      // Fetch property details if needed
      let property = null;
      if (invoice.propertyId) {
        const propertyResponse = await fetch(`/api/properties?id=${invoice.propertyId}`);
        if (propertyResponse.ok) {
          property = await propertyResponse.json();
        }
      }

      const pdfData = {
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: invoice.invoiceDate,
        dueDate: invoice.dueDate,
        propertyAddress: property?.address,
        propertyUnit: property?.unit,
        propertyType: property?.propertyType,
        clientName: invoice.clientName,
        clientEmail: invoice.clientEmail,
        clientAddress: invoice.clientAddress,
        clientPhone: invoice.clientPhone,
        agentName: invoice.agentName,
        agentAgency: invoice.agentAgency,
        agentEmail: invoice.agentEmail,
        agentPhone: invoice.agentPhone,
        ownerName: invoice.ownerName,
        ownerEmail: invoice.ownerEmail,
        ownerPhone: invoice.ownerPhone,
        items: invoice.items || [],
        subtotal: invoice.subtotal || 0,
        taxRate: invoice.taxRate || 0,
        taxAmount: invoice.taxAmount || 0,
        totalAmount: invoice.totalAmount,
        paymentTerms: invoice.paymentTerms,
        lateFeePolicy: invoice.lateFeePolicy,
        notes: invoice.notes,
        logoMode: invoice.logoMode,
        logoDataUrl: invoice.logoDataUrl,
        logoWidth: invoice.logoWidth,
        companyName: invoice.companyName,
        companyTagline: invoice.companyTagline,
      } as any;

      const pdf = generateInvoicePDF(pdfData);
      pdf.output('dataurlnewwindow');
    } catch (error) {
      console.error("Failed to preview invoice:", error);
      toast.error("Failed to preview invoice");
    }
  };

  const getTenantInvoices = (tenantId: number) => {
    return invoices.filter(inv => inv.tenantId === tenantId);
  };

const getPaymentSummary = (tenant: Tenant) => {
    // This would ideally come from invoice data
    // For now, return placeholder based on lease status
  if (tenant.leaseStatus === "pending") {
      return { summary: "Awaiting Deposit", details: `Lease starts ${new Date(tenant.leaseStart).toLocaleDateString()}` };
    }
  if (tenant.leaseStatus === "expired") {
      return { summary: "Overdue", details: "Lease expired" };
    }
  if (tenant.leaseStatus === "terminated") {
    return { summary: "Lease Terminated", details: "Tenant access removed" };
  }
    return { summary: "Paid", details: `Next due: ${new Date(tenant.leaseEnd).toLocaleDateString()}` };
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
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                const tenantInvoices = getTenantInvoices(tenant.id);
                                if (tenantInvoices.length > 0) {
                                  if (tenantInvoices.length === 1) {
                                    handlePreviewInvoice(tenantInvoices[0]);
                                  } else {
                                    // Show dialog with list of invoices
                                    toast.info(`${tenantInvoices.length} invoices found. Previewing the latest.`);
                                    const latestInvoice = tenantInvoices.sort((a, b) => 
                                      new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime()
                                    )[0];
                                    handlePreviewInvoice(latestInvoice);
                                  }
                                } else {
                                  // Generate invoice first, then preview
                                  await handleGenerateInvoice(tenant);
                                  // Wait a moment for invoice to be created, then fetch and preview
                                  setTimeout(async () => {
                                    await fetchInvoices();
                                    const updatedInvoices = getTenantInvoices(tenant.id);
                                    if (updatedInvoices.length > 0) {
                                      const latestInvoice = updatedInvoices.sort((a, b) => 
                                        new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime()
                                      )[0];
                                      handlePreviewInvoice(latestInvoice);
                                    }
                                  }, 1000);
                                }
                              }}
                              title="View Invoice Preview"
                            >
                              <Eye className="size-4 mr-1" />
                              View Invoice
                            </Button>
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
