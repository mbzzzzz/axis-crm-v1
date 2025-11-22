"use client";

import { useState } from "react";
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
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";
import { CurrencyInput } from "@/components/currency-input";
import { ImageUpload } from "@/components/image-upload";
import { CURRENCIES, type CurrencyCode } from "@/lib/currency-formatter";

interface PropertyFormProps {
  property?: any;
  onSuccess: () => void;
}

export function PropertyForm({ property, onSuccess }: PropertyFormProps) {
  const { data: session } = useSession();
  const userId = session?.user?.id || "";
  
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [formData, setFormData] = useState({
    title: property?.title || "",
    description: property?.description || "",
    address: property?.address || "",
    city: property?.city || "",
    state: property?.state || "",
    zipCode: property?.zipCode || "",
    propertyType: property?.propertyType || "residential",
    status: property?.status || "available",
    price: property?.price || 0,
    currency: (property?.currency as CurrencyCode) || "USD",
    sizeSqft: property?.sizeSqft || "",
    bedrooms: property?.bedrooms || "",
    bathrooms: property?.bathrooms || "",
    yearBuilt: property?.yearBuilt || "",
    purchasePrice: property?.purchasePrice || 0,
    estimatedValue: property?.estimatedValue || 0,
    monthlyExpenses: property?.monthlyExpenses || 0,
    commissionRate: property?.commissionRate || "",
    amenities: Array.isArray(property?.amenities) ? property.amenities : [],
    images: Array.isArray(property?.images) ? property.images : [],
  });

  const AMENITY_OPTIONS = [
    "Swimming Pool",
    "Gym",
    "Garden",
    "Parking",
    "Security",
    "Play Area",
    "Club House",
    "Elevator",
    "Fireplace",
    "Balcony",
    "Near Schools",
    "Near Hospital",
    "Near Supermarkets",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!userId) {
      toast.error("Please log in to continue");
      return;
    }

    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        propertyType: formData.propertyType,
        status: formData.status,
        price: typeof formData.price === "number" ? formData.price : parseFloat(formData.price as string),
        currency: formData.currency,
        sizeSqft: formData.sizeSqft ? parseInt(formData.sizeSqft as string) : undefined,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms as string) : undefined,
        bathrooms: formData.bathrooms ? parseFloat(formData.bathrooms as string) : undefined,
        yearBuilt: formData.yearBuilt ? parseInt(formData.yearBuilt as string) : undefined,
        purchasePrice: typeof formData.purchasePrice === "number" ? formData.purchasePrice : (formData.purchasePrice ? parseFloat(formData.purchasePrice as string) : undefined),
        estimatedValue: typeof formData.estimatedValue === "number" ? formData.estimatedValue : (formData.estimatedValue ? parseFloat(formData.estimatedValue as string) : undefined),
        monthlyExpenses: typeof formData.monthlyExpenses === "number" ? formData.monthlyExpenses : (formData.monthlyExpenses ? parseFloat(formData.monthlyExpenses as string) : undefined),
        commissionRate: formData.commissionRate
          ? parseFloat(formData.commissionRate as string)
          : undefined,
        amenities: formData.amenities,
        images: formData.images,
      };

      const url = property ? `/api/properties?id=${property.id}` : "/api/properties";
      const method = property ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const updatedProperty = await response.json();
        toast.success(property ? "Property updated successfully" : "Property added successfully");
        onSuccess();
      } else {
        const error = await response.json();
        const errorMessage = error.error || error.message || "Failed to save property";
        toast.error(errorMessage);
        console.error("Property save error:", error);
      }
    } catch (error) {
      console.error("Property save exception:", error);
      const errorMessage = error instanceof Error ? error.message : "An error occurred";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateDescription = async () => {
    // Validate required fields for description generation
    if (!formData.title || !formData.address || !formData.city || !formData.state || !formData.propertyType || !formData.price) {
      toast.error("Please fill in title, address, city, state, property type, and price before generating description");
      return;
    }

    setIsGeneratingDescription(true);
    try {
      const response = await fetch('/api/properties/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          propertyType: formData.propertyType,
          price: typeof formData.price === "number" ? formData.price : parseFloat(formData.price as string),
          currency: formData.currency,
          sizeSqft: formData.sizeSqft ? parseInt(formData.sizeSqft as string) : undefined,
          bedrooms: formData.bedrooms ? parseInt(formData.bedrooms as string) : undefined,
          bathrooms: formData.bathrooms ? parseFloat(formData.bathrooms as string) : undefined,
          yearBuilt: formData.yearBuilt ? parseInt(formData.yearBuilt as string) : undefined,
          amenities: formData.amenities,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setFormData({ ...formData, description: data.description });
        toast.success("Description generated successfully!");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to generate description");
      }
    } catch (error) {
      toast.error("An error occurred while generating description");
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="font-semibold">Basic Information</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="title">Property Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="propertyType">Property Type *</Label>
            <Select
              value={formData.propertyType}
              onValueChange={(value) => setFormData({ ...formData, propertyType: value })}
            >
              <SelectTrigger id="propertyType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="residential">Residential</SelectItem>
                <SelectItem value="commercial">Commercial</SelectItem>
                <SelectItem value="land">Land</SelectItem>
                <SelectItem value="multi_family">Multi-Family</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="description">Description</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGenerateDescription}
              disabled={isGeneratingDescription || !formData.title || !formData.address || !formData.city || !formData.state || !formData.propertyType || !formData.price}
              className="text-xs"
            >
              {isGeneratingDescription ? "Generating..." : "✨ Auto Generate"}
            </Button>
          </div>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            placeholder="Enter property description or click 'Auto Generate' to create one using AI"
          />
        </div>
      </div>

      {/* Location */}
      <div className="space-y-4">
        <h3 className="font-semibold">Location</h3>
        <div className="space-y-2">
          <Label htmlFor="address">Address *</Label>
          <Input
            id="address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            required
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="city">City *</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">State *</Label>
            <Input
              id="state"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="zipCode">ZIP Code *</Label>
            <Input
              id="zipCode"
              value={formData.zipCode}
              onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
              required
            />
          </div>
        </div>
      </div>

      {/* Property Details */}
      <div className="space-y-4">
        <h3 className="font-semibold">Property Details</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="currency">Currency *</Label>
            <Select
              value={formData.currency}
              onValueChange={(value) => setFormData({ ...formData, currency: value as CurrencyCode })}
            >
              <SelectTrigger id="currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(CURRENCIES).map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    {currency.symbol} {currency.name} ({currency.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <CurrencyInput
              id="price"
              label="Listing Price *"
              value={formData.price}
              onChange={(value) => setFormData({ ...formData, price: value })}
              currency={formData.currency}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status *</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="under_contract">Under Contract</SelectItem>
                <SelectItem value="sold">Sold</SelectItem>
                <SelectItem value="rented">Rented</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sizeSqft">Size (sqft)</Label>
            <Input
              id="sizeSqft"
              type="number"
              value={formData.sizeSqft}
              onChange={(e) => setFormData({ ...formData, sizeSqft: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="yearBuilt">Year Built</Label>
            <Input
              id="yearBuilt"
              type="number"
              value={formData.yearBuilt}
              onChange={(e) => setFormData({ ...formData, yearBuilt: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bedrooms">Bedrooms</Label>
            <Input
              id="bedrooms"
              type="number"
              value={formData.bedrooms}
              onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bathrooms">Bathrooms</Label>
            <Input
              id="bathrooms"
              type="number"
              step="0.5"
              value={formData.bathrooms}
              onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
            />
          </div>
        </div>

        {/* Amenities */}
        <div className="space-y-2">
          <Label>Amenities</Label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {AMENITY_OPTIONS.map((amenity) => {
              const checked = (formData.amenities as string[]).includes(amenity);
              return (
                <label key={amenity} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={checked}
                    onChange={(e) => {
                      const next = new Set(formData.amenities as string[]);
                      if (e.target.checked) next.add(amenity);
                      else next.delete(amenity);
                      setFormData({ ...formData, amenities: Array.from(next) });
                    }}
                  />
                  {amenity}
                </label>
              );
            })}
          </div>
        </div>

        {/* Property Images */}
        {userId && (
          <ImageUpload
            images={formData.images as string[]}
            onChange={(images) => setFormData({ ...formData, images })}
            userId={userId}
            propertyId={property?.id}
            maxImages={10}
          />
        )}
      </div>

      {/* Financial Information */}
      <div className="space-y-4">
        <h3 className="font-semibold">Financial Information</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <CurrencyInput
            id="purchasePrice"
            label="Purchase Price"
            value={formData.purchasePrice}
            onChange={(value) => setFormData({ ...formData, purchasePrice: value })}
            currency={formData.currency}
          />
          <CurrencyInput
            id="estimatedValue"
            label="Estimated Value"
            value={formData.estimatedValue}
            onChange={(value) => setFormData({ ...formData, estimatedValue: value })}
            currency={formData.currency}
          />
          <CurrencyInput
            id="monthlyExpenses"
            label="Monthly Expenses"
            value={formData.monthlyExpenses}
            onChange={(value) => setFormData({ ...formData, monthlyExpenses: value })}
            currency={formData.currency}
          />
          <div className="space-y-2">
            <Label htmlFor="commissionRate">Commission Rate (%)</Label>
            <Input
              id="commissionRate"
              type="number"
              step="0.01"
              value={formData.commissionRate}
              onChange={(e) => setFormData({ ...formData, commissionRate: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : property ? "Update Property" : "Add Property"}
        </Button>
      </div>
    </form>
  );
}
