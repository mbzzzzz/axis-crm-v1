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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Search, Building2, DollarSign, Home, MapPin, Edit, Trash2, Download, Upload } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { PropertyForm } from "@/components/property-form";
import { PropertyDetailsDialog } from "@/components/property-details-dialog";
import { ImportExportDialog } from "@/components/import-export-dialog";

interface Property {
  id: number;
  title: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  propertyType: string;
  status: string;
  price: number;
  sizeSqft?: number;
  bedrooms?: number;
  bathrooms?: number;
  images?: string[];
  purchasePrice?: number;
  estimatedValue?: number;
  monthlyExpenses?: number;
  commissionRate?: number;
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);

  const fetchProperties = async () => {
    try {
      const response = await fetch("/api/properties");
      const data = await response.json();
      // Ensure we always work with an array regardless of API shape
      const arr: Property[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
          ? data.data
          : [];
      setProperties(arr);
      setFilteredProperties(arr);
    } catch (error) {
      toast.error("Failed to load properties");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    const q = searchQuery.toLowerCase();
    const filtered = properties.filter((property) => {
      const title = (property.title ?? "").toLowerCase();
      const address = (property.address ?? "").toLowerCase();
      const city = (property.city ?? "").toLowerCase();
      return title.includes(q) || address.includes(q) || city.includes(q);
    });
    setFilteredProperties(filtered);
  }, [searchQuery, properties]);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this property?")) return;

    try {
      const response = await fetch(`/api/properties?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Property deleted successfully");
        fetchProperties();
      } else {
        toast.error("Failed to delete property");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      available: "bg-green-500",
      under_contract: "bg-yellow-500",
      sold: "bg-blue-500",
      rented: "bg-purple-500",
      pending: "bg-orange-500",
    };
    return colors[status] || "bg-gray-500";
  };

  const formatPropertyType = (type: string) => {
    return type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="mt-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Properties</h1>
          <p className="text-muted-foreground">Manage your real estate listings</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsImportExportOpen(true)}>
            <Upload className="mr-2 size-4" />
            Import/Export
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 size-4" />
                Add Property
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Property</DialogTitle>
                <DialogDescription>
                  Fill in the details to add a new property to your portfolio
                </DialogDescription>
              </DialogHeader>
              <PropertyForm
                onSuccess={() => {
                  setIsAddDialogOpen(false);
                  fetchProperties();
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search properties..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <Skeleton className="h-48 w-full rounded-t-lg" />
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredProperties.length === 0 ? (
        <Card className="flex min-h-[400px] items-center justify-center">
          <CardContent className="text-center">
            <Building2 className="mx-auto size-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No properties found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {searchQuery
                ? "Try adjusting your search"
                : "Add your first property to get started"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProperties.map((property) => (
            <Card key={property.id} className="overflow-hidden transition-shadow hover:shadow-lg">
              <div
                className="h-48 cursor-pointer bg-cover bg-center"
                style={{
                  backgroundImage: `url(${
                    property.images?.[0] || "https://images.unsplash.com/photo-1560518883-ce09059eeffa"
                  })`,
                }}
                onClick={() => {
                  setSelectedProperty(property);
                  setIsDetailsDialogOpen(true);
                }}
              />
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="line-clamp-1">{property.title}</CardTitle>
                    <CardDescription className="mt-1 flex items-center gap-1">
                      <MapPin className="size-3" />
                      <span className="line-clamp-1">
                        {property.city}, {property.state}
                      </span>
                    </CardDescription>
                  </div>
                  <Badge className={`${getStatusColor(property.status)} text-white`}>
                    {property.status.replace(/_/g, " ")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">
                      ${property.price.toLocaleString()}
                    </span>
                    <Badge variant="outline">{formatPropertyType(property.propertyType)}</Badge>
                  </div>
                  {property.bedrooms !== undefined && property.bathrooms !== undefined && (
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{property.bedrooms} beds</span>
                      <span>•</span>
                      <span>{property.bathrooms} baths</span>
                      {property.sizeSqft && (
                        <>
                          <span>•</span>
                          <span>{property.sizeSqft.toLocaleString()} sqft</span>
                        </>
                      )}
                    </div>
                  )}
                  <div className="mt-4 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setSelectedProperty(property);
                        setIsDetailsDialogOpen(true);
                      }}
                    >
                      <Edit className="mr-1 size-3" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(property.id)}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedProperty && (
        <PropertyDetailsDialog
          property={selectedProperty}
          open={isDetailsDialogOpen}
          onOpenChange={setIsDetailsDialogOpen}
          onUpdate={fetchProperties}
        />
      )}

      <ImportExportDialog
        open={isImportExportOpen}
        onOpenChange={setIsImportExportOpen}
        type="properties"
        data={properties}
        onImportSuccess={fetchProperties}
      />
    </div>
  );
}