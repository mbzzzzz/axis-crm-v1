"use client";

import { useState, useEffect, DragEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Eye, ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import { generateInvoicePDF } from "@/lib/pdf-generator";

interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface InvoiceFormProps {
  invoice?: any;
  onSuccess: () => void;
}

export function InvoiceForm({ invoice, onSuccess }: InvoiceFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [properties, setProperties] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    invoiceNumber: invoice?.invoiceNumber || `INV-${Date.now()}`,
    propertyId: invoice?.propertyId || "",
    tenantId: invoice?.tenantId || "",
    clientName: invoice?.clientName || "",
    clientEmail: invoice?.clientEmail || "",
    clientAddress: invoice?.clientAddress || "",
    clientPhone: invoice?.clientPhone || "",
    agentName: invoice?.agentName || "",
    agentAgency: invoice?.agentAgency || "",
    agentEmail: invoice?.agentEmail || "",
    agentPhone: invoice?.agentPhone || "",
    ownerName: invoice?.ownerName || "",
    ownerEmail: invoice?.ownerEmail || "",
    ownerPhone: invoice?.ownerPhone || "",
    invoiceDate: invoice?.invoiceDate || new Date().toISOString().split("T")[0],
    dueDate: invoice?.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    taxRate: invoice?.taxRate || 0,
    paymentStatus: invoice?.paymentStatus || "draft",
    paymentTerms: invoice?.paymentTerms || "Payment due within 30 days",
    lateFeePolicy: invoice?.lateFeePolicy || "A late fee of 5% will be applied to unpaid balances after the due date",
    notes: invoice?.notes || "",
    // Branding
    logoMode: (invoice?.logoMode as "image" | "text") || "text",
    companyName: invoice?.companyName || "AXIS CRM",
    companyTagline: invoice?.companyTagline || "Real Estate Management",
    logoDataUrl: invoice?.logoDataUrl || "",
    logoWidth: invoice?.logoWidth || 40, // px width in PDF header
  });

  const [items, setItems] = useState<InvoiceItem[]>(
    invoice?.items || [
      { description: "Monthly Rent", quantity: 1, rate: 0, amount: 0 },
    ]
  );

  useEffect(() => {
    fetchProperties();
    fetchTenants();
  }, []);

  useEffect(() => {
    if (formData.propertyId) {
      const property = properties.find((p) => p.id === parseInt(formData.propertyId));
      setSelectedProperty(property);
    }
  }, [formData.propertyId, properties]);

  useEffect(() => {
    if (formData.tenantId) {
      const tenant = tenants.find((t) => t.id === parseInt(formData.tenantId));
      setSelectedTenant(tenant);
      if (tenant) {
        // Auto-fill client details from tenant
        setFormData(prev => ({
          ...prev,
          clientName: prev.clientName || tenant.name,
          clientEmail: prev.clientEmail || tenant.email,
          clientPhone: prev.clientPhone || tenant.phone || "",
          propertyId: prev.propertyId || String(tenant.propertyId || ""),
        }));
      }
    }
  }, [formData.tenantId, tenants]);

  const fetchTenants = async () => {
    try {
      const response = await fetch("/api/tenants");
      const data = await response.json();
      setTenants(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch tenants:", error);
    }
  };

  const fetchProperties = async () => {
    try {
      const response = await fetch("/api/properties");
      const data = await response.json();
      setProperties(Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : []);
    } catch (error) {
      console.error("Failed to fetch properties:", error);
    }
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = (subtotal * (Number(formData.taxRate) || 0)) / 100;
    const totalAmount = subtotal + taxAmount;
    return { subtotal, taxAmount, totalAmount };
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Auto-calculate amount
    if (field === "quantity" || field === "rate") {
      newItems[index].amount = (Number(newItems[index].quantity) || 0) * (Number(newItems[index].rate) || 0);
    }
    
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { description: "", quantity: 1, rate: 0, amount: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handlePreview = () => {
    const { subtotal, taxAmount, totalAmount } = calculateTotals();
    
    const pdfData = {
      ...formData,
      propertyAddress: selectedProperty?.address,
      propertyUnit: selectedProperty?.unit,
      propertyType: selectedProperty?.propertyType,
      items,
      subtotal,
      taxAmount,
      totalAmount,
    } as any;
    
    const pdf = generateInvoicePDF(pdfData);
    pdf.output('dataurlnewwindow');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { subtotal, taxAmount, totalAmount } = calculateTotals();

      const payload = {
        ...formData,
        propertyId: parseInt(formData.propertyId as any),
        userId: 1, // In real app, get from session
        subtotal,
        taxRate: parseFloat(formData.taxRate as any) || 0,
        taxAmount,
        totalAmount,
        items,
      };

      const url = invoice ? `/api/invoices?id=${invoice.id}` : "/api/invoices";
      const method = invoice ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success(invoice ? "Invoice updated successfully" : "Invoice created successfully");
        onSuccess();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to save invoice");
      }
    } catch (error) {
      toast.error("An error occurred");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const { subtotal, taxAmount, totalAmount } = calculateTotals();

  // Branding upload handlers
  const onFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({ ...prev, logoDataUrl: String(reader.result), logoMode: "image" }));
      toast.success("Logo uploaded");
    };
    reader.onerror = () => toast.error("Failed to read file");
    reader.readAsDataURL(file);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) onFileSelect(file);
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Branding */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Branding</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="logoMode">Logo Type</Label>
              <Select
                value={formData.logoMode}
                onValueChange={(value) => setFormData({ ...formData, logoMode: value as any })}
              >
                <SelectTrigger id="logoMode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text Logo</SelectItem>
                  <SelectItem value="image">Image Logo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="logoWidth">Logo Size (px)</Label>
              <Input
                id="logoWidth"
                type="number"
                min={24}
                max={120}
                value={formData.logoWidth}
                onChange={(e) => setFormData({ ...formData, logoWidth: Math.max(24, Math.min(120, Number(e.target.value) || 40)) })}
              />
            </div>
          </div>

          {formData.logoMode === "text" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company / Brand Name</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyTagline">Tagline (optional)</Label>
                <Input
                  id="companyTagline"
                  value={formData.companyTagline}
                  onChange={(e) => setFormData({ ...formData, companyTagline: e.target.value })}
                />
              </div>
            </div>
          ) : (
            <div>
              <Label>Upload Logo</Label>
              <div
                onDrop={onDrop}
                onDragOver={onDragOver}
                className="mt-2 flex h-36 w-full cursor-pointer flex-col items-center justify-center rounded-md border border-dashed p-4 text-center hover:bg-muted/50"
                onClick={() => document.getElementById("logo-input-hidden")?.click()}
              >
                {formData.logoDataUrl ? (
                  <div className="relative">
                    <img
                      src={formData.logoDataUrl}
                      alt="Logo preview"
                      className="max-h-24 object-contain"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute -right-2 -top-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFormData((prev) => ({ ...prev, logoDataUrl: "" }));
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-sm text-muted-foreground">
                    <ImagePlus className="mb-2 h-6 w-6" />
                    <p>
                      Drag and drop your logo here, or <span className="font-medium text-primary">browse</span>
                    </p>
                    <p className="text-xs">PNG, JPG, or SVG up to 2MB</p>
                  </div>
                )}
              </div>
              <input
                id="logo-input-hidden"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onFileSelect(file);
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice Header */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="invoiceNumber">Invoice Number *</Label>
          <Input
            id="invoiceNumber"
            value={formData.invoiceNumber}
            onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="invoiceDate">Invoice Date *</Label>
          <Input
            id="invoiceDate"
            type="date"
            value={formData.invoiceDate}
            onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dueDate">Due Date *</Label>
          <Input
            id="dueDate"
            type="date"
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            required
          />
        </div>
      </div>

      {/* Tenant Selection (Optional - auto-fills client details) */}
      <div className="space-y-2">
        <Label htmlFor="tenantId">Select Tenant (Optional)</Label>
        <Select
          value={formData.tenantId}
          onValueChange={(value) => setFormData({ ...formData, tenantId: value })}
        >
          <SelectTrigger id="tenantId">
            <SelectValue placeholder="Choose a tenant to auto-fill details" />
          </SelectTrigger>
          <SelectContent>
            {tenants.map((tenant) => (
              <SelectItem key={tenant.id} value={tenant.id.toString()}>
                {tenant.name} - {tenant.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Selecting a tenant will auto-fill client name, email, and property
        </p>
      </div>

      {/* Property Selection */}
      <div className="space-y-2">
        <Label htmlFor="propertyId">Select Property *</Label>
        <Select
          value={formData.propertyId}
          onValueChange={(value) => setFormData({ ...formData, propertyId: value })}
        >
          <SelectTrigger id="propertyId">
            <SelectValue placeholder="Choose a property" />
          </SelectTrigger>
          <SelectContent>
            {properties.map((property) => (
              <SelectItem key={property.id} value={property.id.toString()}>
                {property.title} - {property.address}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Client Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Client / Tenant Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="clientName">Client Name *</Label>
              <Input
                id="clientName"
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientEmail">Client Email *</Label>
              <Input
                id="clientEmail"
                type="email"
                value={formData.clientEmail}
                onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientAddress">Client Address</Label>
              <Input
                id="clientAddress"
                value={formData.clientAddress}
                onChange={(e) => setFormData({ ...formData, clientAddress: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientPhone">Client Phone</Label>
              <Input
                id="clientPhone"
                type="tel"
                value={formData.clientPhone}
                onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agent Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Agent / Realtor Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="agentName">Agent Name</Label>
              <Input
                id="agentName"
                value={formData.agentName}
                onChange={(e) => setFormData({ ...formData, agentName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="agentAgency">Agency</Label>
              <Input
                id="agentAgency"
                value={formData.agentAgency}
                onChange={(e) => setFormData({ ...formData, agentAgency: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="agentEmail">Agent Email</Label>
              <Input
                id="agentEmail"
                type="email"
                value={formData.agentEmail}
                onChange={(e) => setFormData({ ...formData, agentEmail: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="agentPhone">Agent Phone</Label>
              <Input
                id="agentPhone"
                type="tel"
                value={formData.agentPhone}
                onChange={(e) => setFormData({ ...formData, agentPhone: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Owner Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Property Owner Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ownerName">Owner Name</Label>
              <Input
                id="ownerName"
                value={formData.ownerName}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ownerEmail">Owner Email</Label>
              <Input
                id="ownerEmail"
                type="email"
                value={formData.ownerEmail}
                onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ownerPhone">Owner Phone</Label>
              <Input
                id="ownerPhone"
                type="tel"
                value={formData.ownerPhone}
                onChange={(e) => setFormData({ ...formData, ownerPhone: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Invoice Items</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="mr-2 size-4" />
              Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Description"
                  value={item.description}
                  onChange={(e) => handleItemChange(index, "description", e.target.value)}
                  required
                />
              </div>
              <div className="w-20">
                <Input
                  type="number"
                  placeholder="Qty"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, "quantity", parseInt(e.target.value) || 1)}
                  required
                />
              </div>
              <div className="w-28">
                <Input
                  type="number"
                  placeholder="Rate"
                  step="0.01"
                  min="0"
                  value={item.rate}
                  onChange={(e) => handleItemChange(index, "rate", parseFloat(e.target.value) || 0)}
                  required
                />
              </div>
              <div className="w-28">
                <Input
                  type="number"
                  placeholder="Amount"
                  value={item.amount.toFixed(2)}
                  readOnly
                  className="bg-muted"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeItem(index)}
                disabled={items.length === 1}
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Totals */}
      <Card>
        <CardContent className="pt-6">
          <div className="ml-auto max-w-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Subtotal:</span>
              <span className="font-semibold">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="taxRate" className="text-sm text-muted-foreground">Tax Rate (%):</Label>
              <Input
                id="taxRate"
                type="number"
                step="0.01"
                min="0"
                value={formData.taxRate}
                onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
                className="w-20 text-right"
              />
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Tax Amount:</span>
              <span className="font-semibold">${taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-lg font-bold">Total:</span>
              <span className="text-lg font-bold text-primary">${totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Additional Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="paymentStatus">Payment Status *</Label>
            <Select
              value={formData.paymentStatus}
              onValueChange={(value) => setFormData({ ...formData, paymentStatus: value })}
            >
              <SelectTrigger id="paymentStatus">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="paymentTerms">Payment Terms</Label>
            <Textarea
              id="paymentTerms"
              value={formData.paymentTerms}
              onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lateFeePolicy">Late Fee Policy</Label>
            <Textarea
              id="lateFeePolicy"
              value={formData.lateFeePolicy}
              onChange={(e) => setFormData({ ...formData, lateFeePolicy: e.target.value })}
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={handlePreview}>
          <Eye className="mr-2 size-4" />
          Preview PDF
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : invoice ? "Update Invoice" : "Create Invoice"}
        </Button>
      </div>
    </form>
  );
}