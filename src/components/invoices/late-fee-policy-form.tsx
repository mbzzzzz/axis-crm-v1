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
import { toast } from "sonner";

interface LateFeePolicyFormProps {
  initialData?: any;
  onSuccess: () => void;
  onCancel?: () => void;
}

export function LateFeePolicyForm({
  initialData,
  onSuccess,
  onCancel,
}: LateFeePolicyFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "flat_fee" as "flat_fee" | "percentage",
    amount: 0,
    percentage: 0,
    gracePeriodDays: 5,
    applyAfterDays: 1,
    maxFees: 0,
    isDefault: false,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        type: initialData.type || "flat_fee",
        amount: initialData.amount || 0,
        percentage: initialData.percentage || 0,
        gracePeriodDays: initialData.gracePeriodDays || 5,
        applyAfterDays: initialData.applyAfterDays || 1,
        maxFees: initialData.maxFees || 0,
        isDefault: initialData.isDefault === 1 || false,
      });
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!formData.name) {
        throw new Error("Policy name is required");
      }

      if (formData.type === "flat_fee" && !formData.amount) {
        throw new Error("Flat fee amount is required");
      }

      if (formData.type === "percentage" && !formData.percentage) {
        throw new Error("Percentage is required");
      }

      const payload = {
        name: formData.name,
        type: formData.type,
        amount: formData.type === "flat_fee" ? formData.amount : null,
        percentage: formData.type === "percentage" ? formData.percentage : null,
        gracePeriodDays: formData.gracePeriodDays,
        applyAfterDays: formData.applyAfterDays,
        maxFees: formData.maxFees > 0 ? formData.maxFees : null,
        isDefault: formData.isDefault,
      };

      const url = initialData ? `/api/late-fee-policies/${initialData.id}` : "/api/late-fee-policies";
      const method = initialData ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save policy");
      }

      toast.success(initialData ? "Policy updated" : "Policy created");
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Failed to save policy");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Policy Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Standard Late Fee Policy"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Fee Type *</Label>
        <Select
          value={formData.type}
          onValueChange={(value) => setFormData({ ...formData, type: value as "flat_fee" | "percentage" })}
          required
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="flat_fee">Flat Fee</SelectItem>
            <SelectItem value="percentage">Percentage of Rent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {formData.type === "flat_fee" ? (
        <div className="space-y-2">
          <Label htmlFor="amount">Flat Fee Amount ($) *</Label>
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
      ) : (
        <div className="space-y-2">
          <Label htmlFor="percentage">Percentage (%) *</Label>
          <Input
            id="percentage"
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={formData.percentage}
            onChange={(e) => setFormData({ ...formData, percentage: parseFloat(e.target.value) || 0 })}
            required
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="gracePeriodDays">Grace Period (Days)</Label>
          <Input
            id="gracePeriodDays"
            type="number"
            min="0"
            value={formData.gracePeriodDays}
            onChange={(e) => setFormData({ ...formData, gracePeriodDays: parseInt(e.target.value) || 0 })}
          />
          <p className="text-xs text-muted-foreground">Days before late fee applies</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="applyAfterDays">Apply After (Days)</Label>
          <Input
            id="applyAfterDays"
            type="number"
            min="1"
            value={formData.applyAfterDays}
            onChange={(e) => setFormData({ ...formData, applyAfterDays: parseInt(e.target.value) || 1 })}
          />
          <p className="text-xs text-muted-foreground">Days after due date</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="maxFees">Maximum Late Fees ($)</Label>
        <Input
          id="maxFees"
          type="number"
          min="0"
          step="0.01"
          value={formData.maxFees}
          onChange={(e) => setFormData({ ...formData, maxFees: parseFloat(e.target.value) || 0 })}
        />
        <p className="text-xs text-muted-foreground">Leave 0 for no maximum</p>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isDefault"
          checked={formData.isDefault}
          onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
          className="rounded border-gray-300"
        />
        <Label htmlFor="isDefault" className="cursor-pointer">
          Set as default policy
        </Label>
      </div>

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : initialData ? "Update" : "Create"} Policy
        </Button>
      </div>
    </form>
  );
}
