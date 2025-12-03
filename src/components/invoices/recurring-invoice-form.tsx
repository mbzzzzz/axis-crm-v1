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

interface RecurringInvoiceFormProps {
  initialData?: any;
  onSuccess: () => void;
  onCancel?: () => void;
}

export function RecurringInvoiceForm({
  initialData,
  onSuccess,
  onCancel,
}: RecurringInvoiceFormProps) {
  const [tenants, setTenants] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    tenantId: "",
    propertyId: "",
    amount: 0,
    description: "",
    frequency: "monthly",
    startDate: new Date(),
    dayOfMonth: new Date().getDate(),
  });

  useEffect(() => {
    fetchTenants();
    fetchProperties();
    if (initialData) {
      setFormData({
        tenantId: initialData.tenantId?.toString() || "",
        propertyId: initialData.propertyId?.toString() || "",
        amount: initialData.amount || 0,
        description: initialData.description || "",
        frequency: initialData.frequency || "monthly",
        startDate: initialData.startDate ? new Date(initialData.startDate) : new Date(),
        dayOfMonth: initialData.dayOfMonth || new Date().getDate(),
      });
    }
  }, [initialData]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!formData.tenantId || !formData.propertyId || !formData.amount || !formData.description) {
        throw new Error("Please fill in all required fields");
      }

      // Calculate next invoice date
      const nextDate = new Date(formData.startDate);
      nextDate.setDate(formData.dayOfMonth);
      if (nextDate < new Date()) {
        // If the day has passed this month, move to next month
        nextDate.setMonth(nextDate.getMonth() + 1);
      }

      const payload = {
        tenantId: parseInt(formData.tenantId),
        propertyId: parseInt(formData.propertyId),
        amount: formData.amount,
        description: formData.description,
        frequency: formData.frequency,
        startDate: formData.startDate.toISOString(),
        nextInvoiceDate: nextDate.toISOString(),
        dayOfMonth: formData.dayOfMonth,
      };

      const url = initialData ? `/api/invoices/recurring/${initialData.id}` : "/api/invoices/recurring";
      const method = initialData ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save recurring invoice");
      }

      toast.success(initialData ? "Recurring invoice updated" : "Recurring invoice created");
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Failed to save recurring invoice");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="tenantId">Tenant *</Label>
          <Select
            value={formData.tenantId}
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
            value={formData.propertyId}
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
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="e.g., Monthly rent payment"
          required
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount ($) *</Label>
          <Input
            id="amount"
            type="number"
            min="0"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="frequency">Frequency *</Label>
          <Select
            value={formData.frequency}
            onValueChange={(value) => setFormData({ ...formData, frequency: value })}
            required
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>
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
          <Label htmlFor="dayOfMonth">Day of Month *</Label>
          <Input
            id="dayOfMonth"
            type="number"
            min="1"
            max="31"
            value={formData.dayOfMonth}
            onChange={(e) => setFormData({ ...formData, dayOfMonth: parseInt(e.target.value) || 1 })}
            required
          />
          <p className="text-xs text-muted-foreground">Day of month to generate invoice (1-31)</p>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : initialData ? "Update" : "Create"} Recurring Invoice
        </Button>
      </div>
    </form>
  );
}
