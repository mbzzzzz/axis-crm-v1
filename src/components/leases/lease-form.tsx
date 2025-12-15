"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { LeaseTemplateSelector } from "./lease-template-selector";
import { LeaseTerms } from "@/lib/lease-templates";

interface LeaseFormProps {
  tenantId?: number;
  propertyId?: number;
  onSuccess: () => void;
  onCancel?: () => void;
  initialData?: any;
}

export function LeaseForm({
  tenantId,
  propertyId,
  onSuccess,
  onCancel,
  initialData,
}: LeaseFormProps) {
  const [tenants, setTenants] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<LeaseTerms | null>(null);
  const [formData, setFormData] = useState({
    tenantId: tenantId || "",
    propertyId: propertyId || "",
    leaseType: "residential",
    startDate: new Date(),
    endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
    monthlyRent: 0,
    deposit: 0,
    currency: "USD",
    terms: null as any,
  });

  useEffect(() => {
    fetchTenants();
    fetchProperties();
    if (initialData) {
      setFormData({
        tenantId: initialData.tenantId || "",
        propertyId: initialData.propertyId || "",
        leaseType: initialData.leaseType || "residential",
        startDate: initialData.startDate ? new Date(initialData.startDate) : new Date(),
        endDate: initialData.endDate ? new Date(initialData.endDate) : new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        monthlyRent: initialData.monthlyRent || 0,
        deposit: initialData.deposit || 0,
        currency: initialData.currency || "USD",
        terms: initialData.terms || null,
      });
      if (initialData.terms) {
        setSelectedTemplate(initialData.terms);
      }
    }
  }, [tenantId, propertyId, initialData]);

  const fetchTenants = async () => {
    try {
      const res = await fetch("/api/tenants");
      const data = await res.json();
      if (Array.isArray(data)) {
        setTenants(data);
      }
    } catch (error) {
      console.error("Error fetching tenants:", error);
    }
  };

  const fetchProperties = async () => {
    try {
      const res = await fetch("/api/properties");
      const data = await res.json();
      if (Array.isArray(data)) {
        setProperties(data);
      }
    } catch (error) {
      console.error("Error fetching properties:", error);
    }
  };

  const handleTemplateSelect = (template: LeaseTerms) => {
    setSelectedTemplate(template);
    setFormData({
      ...formData,
      monthlyRent: template.monthlyRent || formData.monthlyRent,
      deposit: template.deposit || template.securityDeposit || formData.deposit,
      terms: template,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!formData.tenantId || !formData.propertyId || !formData.monthlyRent || !formData.currency) {
        throw new Error("Please fill in all required fields");
      }

      const payload = {
        tenantId: parseInt(formData.tenantId as string),
        propertyId: parseInt(formData.propertyId as string),
        leaseType: formData.leaseType,
        startDate: formData.startDate.toISOString(),
        endDate: formData.endDate.toISOString(),
        monthlyRent: formData.monthlyRent,
        deposit: formData.deposit || null,
        currency: formData.currency,
        terms: selectedTemplate || formData.terms,
      };

      const url = initialData ? `/api/leases/${initialData.id}` : "/api/leases";
      const method = initialData ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save lease");
      }

      toast.success(initialData ? "Lease updated" : "Lease created");
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Failed to save lease");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <LeaseTemplateSelector
        leaseType={formData.leaseType}
        onSelect={handleTemplateSelect}
      />

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="tenantId">Tenant *</Label>
          <Select
            value={formData.tenantId.toString()}
            onValueChange={(value) => setFormData({ ...formData, tenantId: value })}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select tenant" />
            </SelectTrigger>
            <SelectContent>
              {tenants.map((tenant) => (
                <SelectItem key={tenant.id} value={tenant.id.toString()}>
                  {tenant.name} ({tenant.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="propertyId">Property *</Label>
          <Select
            value={formData.propertyId.toString()}
            onValueChange={(value) => setFormData({ ...formData, propertyId: value })}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select property" />
            </SelectTrigger>
            <SelectContent>
              {properties.map((property) => (
                <SelectItem key={property.id} value={property.id.toString()}>
                  {property.title || property.address}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="leaseType">Lease Type *</Label>
        <Select
          value={formData.leaseType}
          onValueChange={(value) => setFormData({ ...formData, leaseType: value })}
          required
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="residential">Residential</SelectItem>
            <SelectItem value="commercial">Commercial</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Start Date *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.startDate ? format(formData.startDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.startDate}
                onSelect={(date) => date && setFormData({ ...formData, startDate: date })}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>End Date *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.endDate ? format(formData.endDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.endDate}
                onSelect={(date) => date && setFormData({ ...formData, endDate: date || formData.endDate })}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="monthlyRent">Monthly Rent ($) *</Label>
          <Input
            id="monthlyRent"
            type="number"
            min="0"
            step="0.01"
            value={formData.monthlyRent}
            onChange={(e) => setFormData({ ...formData, monthlyRent: parseFloat(e.target.value) || 0 })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="deposit">Security Deposit ($)</Label>
          <Input
            id="deposit"
            type="number"
            min="0"
            step="0.01"
            value={formData.deposit}
            onChange={(e) => setFormData({ ...formData, deposit: parseFloat(e.target.value) || 0 })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="currency">Currency *</Label>
        <Select
          value={formData.currency}
          onValueChange={(value) => setFormData({ ...formData, currency: value })}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Select currency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="USD">USD - US Dollar</SelectItem>
            <SelectItem value="PKR">PKR - Pakistani Rupee</SelectItem>
            <SelectItem value="INR">INR - Indian Rupee</SelectItem>
            <SelectItem value="EUR">EUR - Euro</SelectItem>
            <SelectItem value="GBP">GBP - British Pound</SelectItem>
            <SelectItem value="AED">AED - UAE Dirham</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : initialData ? "Update" : "Create"} Lease
        </Button>
      </div>
    </form>
  );
}

