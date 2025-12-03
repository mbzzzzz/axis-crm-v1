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
import { Plus, Search, Building2, DollarSign, Home, MapPin, Edit, Trash2, Download, Upload, List, Map } from "lucide-react";
import { PropertyMapView } from "@/components/property-map-view";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { PropertyForm } from "@/components/property-form";
import { PropertyDetailsDialog } from "@/components/property-details-dialog";
import { ImportExportDialog } from "@/components/import-export-dialog";
import { formatCurrency, type CurrencyCode } from "@/lib/currency-formatter";

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
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  const [tenants, setTenants] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  const fetchProperties = async () => {
    try {
      const [propertiesRes, tenantsRes] = await Promise.all([
        fetch("/api/properties"),
        fetch("/api/tenants"),
      ]);
      const data = await propertiesRes.json();
      const tenantsData = await tenantsRes.json();
      
      // Ensure we always work with an array regardless of API shape
      const arr: Property[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
          ? data.data
          : [];
      setProperties(arr);
      setTenants(Array.isArray(tenantsData) ? tenantsData : []);
      applyFilters(arr, searchQuery, selectedStatus, selectedType);
    } catch (error) {
      toast.error("Failed to load properties");
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = (props: Property[], search: string, status: string, type: string) => {
    let filtered = [...props];
    
    // Search filter
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter((property) => {
        const title = (property.title ?? "").toLowerCase();
        const address = (property.address ?? "").toLowerCase();
        const city = (property.city ?? "").toLowerCase();
        return title.includes(q) || address.includes(q) || city.includes(q);
      });
    }
    
    // Status filter
    if (status !== "all") {
      const statusMap: Record<string, string> = {
        "Occupied": "rented",
        "Vacant": "available",
        "Maintenance": "pending",
      };
      filtered = filtered.filter((property) => {
        const mappedStatus = statusMap[status] || status.toLowerCase();
        return property.status.toLowerCase() === mappedStatus.toLowerCase();
      });
    }
    
    // Type filter
    if (type !== "all") {
      filtered = filtered.filter((property) => {
        return property.propertyType.toLowerCase() === type.toLowerCase();
      });
    }
    
    setFilteredProperties(filtered);
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    applyFilters(properties, searchQuery, selectedStatus, selectedType);
  }, [searchQuery, selectedStatus, selectedType, properties]);

  const getTenantForProperty = (propertyId: number) => {
    const tenant = tenants.find((t: any) => t.propertyId === propertyId);
    return tenant ? tenant.name : null;
  };

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

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      rented: "bg-green-500 text-white",
      occupied: "bg-green-500 text-white",
      available: "bg-blue-500 text-white",
      vacant: "bg-blue-500 text-white",
      pending: "bg-orange-500 text-white",
      maintenance: "bg-orange-500 text-white",
      under_contract: "bg-yellow-500 text-white",
      sold: "bg-purple-500 text-white",
    };
    return colors[status.toLowerCase()] || "bg-gray-500 text-white";
  };

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">All Properties</h1>
          <p className="text-muted-foreground">
            Manage and view all your properties in one place.
          </p>
        </div>
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

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by address or tenant..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Occupied">Occupied</SelectItem>
            <SelectItem value="Vacant">Vacant</SelectItem>
            <SelectItem value="Maintenance">Maintenance</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="residential">Residential</SelectItem>
            <SelectItem value="commercial">Commercial</SelectItem>
            <SelectItem value="multi_family">Multi Family</SelectItem>
            <SelectItem value="land">Land</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2 border rounded-lg p-1">
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
            className="h-8"
          >
            <List className="size-4 mr-1" />
            List
          </Button>
          <Button
            variant={viewMode === "map" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("map")}
            className="h-8"
          >
            <Map className="size-4 mr-1" />
            Map
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
      ) : viewMode === "map" ? (
        <PropertyMapView
          properties={filteredProperties}
          onPropertyClick={(property) => {
            setSelectedProperty(property);
            setIsDetailsDialogOpen(true);
          }}
        />
      ) : (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
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
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-1">{property.title || property.address}</CardTitle>
                      <CardDescription className="mt-1 flex items-center gap-1 text-sm">
                        <MapPin className="size-3" />
                        <span className="line-clamp-1">
                          {property.city}, {property.state} {property.zipCode}
                        </span>
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className={`${getStatusBadgeColor(property.status)} capitalize`}>
                    {property.status.replace(/_/g, " ")}
                  </Badge>
                  <div className="text-lg font-semibold">
                    {formatCurrency(
                      property.price,
                      (property.currency || "USD") as CurrencyCode,
                      { compact: false, showDecimals: false }
                    )}
                    {property.status === "rented" ? "/mo" : ""}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Tenant: {getTenantForProperty(property.id) || "N/A"}
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