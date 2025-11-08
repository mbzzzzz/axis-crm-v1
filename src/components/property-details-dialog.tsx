"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building2,
  MapPin,
  DollarSign,
  TrendingUp,
  Calendar,
  Ruler,
  Bed,
  Bath,
  Edit,
} from "lucide-react";
import { PropertyForm } from "./property-form";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface PropertyDetailsDialogProps {
  property: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export function PropertyDetailsDialog({
  property,
  open,
  onOpenChange,
  onUpdate,
}: PropertyDetailsDialogProps) {
  const [isEditing, setIsEditing] = useState(false);

  // Calculate financial metrics
  const purchasePrice = property.purchasePrice || 0;
  const currentValue = property.estimatedValue || property.price;
  const profit = currentValue - purchasePrice;
  const roi = purchasePrice > 0 ? ((profit / purchasePrice) * 100).toFixed(2) : "0.00";
  const commission = property.price * ((property.commissionRate || 0) / 100);
  const annualExpenses = (property.monthlyExpenses || 0) * 12;
  const netProfit = profit - annualExpenses;

  // Chart data
  const financialData = [
    { name: "Purchase", value: purchasePrice, color: "#3b82f6" },
    { name: "Current Value", value: currentValue, color: "#10b981" },
    { name: "Commission", value: commission, color: "#f59e0b" },
    { name: "Annual Expenses", value: annualExpenses, color: "#ef4444" },
  ];

  const profitData = [
    { name: "Gross Profit", value: Math.max(0, profit), color: "#10b981" },
    { name: "Net Profit", value: Math.max(0, netProfit), color: "#3b82f6" },
  ];

  const handleSuccess = () => {
    setIsEditing(false);
    onUpdate();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{property.title}</span>
            {!isEditing && (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Edit className="mr-2 size-4" />
                Edit
              </Button>
            )}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            <MapPin className="size-4" />
            {property.address}, {property.city}, {property.state} {property.zipCode}
          </DialogDescription>
        </DialogHeader>

        {isEditing ? (
          <div className="mt-4">
            <PropertyForm property={property} onSuccess={handleSuccess} />
            <div className="mt-4 flex justify-end">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Tabs defaultValue="details" className="mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="financial">Financial</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4">
              {/* Images */}
              {property.images && property.images.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2">
                  {property.images.slice(0, 4).map((image: string, index: number) => (
                    <div
                      key={index}
                      className="h-48 rounded-lg bg-cover bg-center"
                      style={{ backgroundImage: `url(${image})` }}
                    />
                  ))}
                </div>
              )}

              {/* Property Information */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Property Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Type</span>
                      <Badge variant="outline">
                        {property.propertyType.replace(/_/g, " ").toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <Badge>{property.status.replace(/_/g, " ").toUpperCase()}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Price</span>
                      <span className="font-semibold">${property.price.toLocaleString()}</span>
                    </div>
                    {property.sizeSqft && (
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Ruler className="size-4" />
                          Size
                        </span>
                        <span className="font-semibold">
                          {property.sizeSqft.toLocaleString()} sqft
                        </span>
                      </div>
                    )}
                    {property.bedrooms && (
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Bed className="size-4" />
                          Bedrooms
                        </span>
                        <span className="font-semibold">{property.bedrooms}</span>
                      </div>
                    )}
                    {property.bathrooms && (
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Bath className="size-4" />
                          Bathrooms
                        </span>
                        <span className="font-semibold">{property.bathrooms}</span>
                      </div>
                    )}
                    {property.yearBuilt && (
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="size-4" />
                          Year Built
                        </span>
                        <span className="font-semibold">{property.yearBuilt}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {property.description || "No description available"}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="financial" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Purchase Price</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${purchasePrice.toLocaleString()}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Current Value</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${currentValue.toLocaleString()}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">ROI</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <div className="text-2xl font-bold">{roi}%</div>
                      {parseFloat(roi) > 0 && <TrendingUp className="size-5 text-green-500" />}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Commission</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${commission.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      {property.commissionRate || 0}% rate
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Profit Analysis</CardTitle>
                  <CardDescription>Breakdown of potential profits and expenses</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <span className="text-sm text-muted-foreground">Gross Profit</span>
                      <div className="text-2xl font-bold text-green-600">
                        ${profit.toLocaleString()}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <span className="text-sm text-muted-foreground">Annual Expenses</span>
                      <div className="text-2xl font-bold text-red-600">
                        ${annualExpenses.toLocaleString()}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <span className="text-sm text-muted-foreground">Net Profit</span>
                      <div className="text-2xl font-bold text-blue-600">
                        ${netProfit.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Financial Overview</CardTitle>
                  <CardDescription>Visual breakdown of property finances</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={financialData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                      <Bar dataKey="value">
                        {financialData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Profit Comparison</CardTitle>
                  <CardDescription>Gross vs. net profit analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={profitData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                      <Bar dataKey="value">
                        {profitData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
