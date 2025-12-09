"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, X } from "lucide-react";
import { PublicPropertyCard } from "@/components/property/PublicPropertyCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSearchParams, useRouter } from "next/navigation";

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
  currency?: string | null;
  sizeSqft?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  images?: string[] | null;
}

export default function PublicPropertiesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);

  // Filter states
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [propertyType, setPropertyType] = useState(searchParams.get("type") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const [minBedrooms, setMinBedrooms] = useState(searchParams.get("minBedrooms") || "");
  const [minBathrooms, setMinBathrooms] = useState(searchParams.get("minBathrooms") || "");
  const [city, setCity] = useState(searchParams.get("city") || "");
  const [state, setState] = useState(searchParams.get("state") || "");

  const [showFilters, setShowFilters] = useState(false);
  const [activeFilterCount, setActiveFilterCount] = useState(0);

  // Calculate active filters
  useEffect(() => {
    let count = 0;
    if (propertyType) count++;
    if (status) count++;
    if (minPrice || maxPrice) count++;
    if (minBedrooms) count++;
    if (minBathrooms) count++;
    if (city) count++;
    if (state) count++;
    setActiveFilterCount(count);
  }, [propertyType, status, minPrice, maxPrice, minBedrooms, minBathrooms, city, state]);

  const fetchProperties = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (propertyType) params.set("type", propertyType);
      if (status) params.set("status", status);
      if (minPrice) params.set("minPrice", minPrice);
      if (maxPrice) params.set("maxPrice", maxPrice);
      if (minBedrooms) params.set("minBedrooms", minBedrooms);
      if (minBathrooms) params.set("minBathrooms", minBathrooms);
      if (city) params.set("city", city);
      if (state) params.set("state", state);

      // Update URL without navigation
      const newUrl = `/properties${params.toString() ? `?${params.toString()}` : ""}`;
      window.history.pushState({}, "", newUrl);

      const response = await fetch(`/api/public/properties?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setProperties(data.properties || []);
        setTotal(data.total || 0);
      } else {
        console.error("Failed to fetch properties:", data.error);
      }
    } catch (error) {
      console.error("Error fetching properties:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [search, propertyType, status, minPrice, maxPrice, minBedrooms, minBathrooms, city, state]);

  const clearFilters = () => {
    setSearch("");
    setPropertyType("");
    setStatus("");
    setMinPrice("");
    setMaxPrice("");
    setMinBedrooms("");
    setMinBathrooms("");
    setCity("");
    setState("");
    router.push("/properties");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-12 sm:py-16">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
              Find Your Perfect Property
            </h1>
            <p className="text-lg text-muted-foreground">
              Browse thousands of properties for sale and rent. Your dream home is just a click away.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Search and Filters */}
        <div className="space-y-4 mb-8">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by location, address, or property name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filter Toggle */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="size-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
            {activeFilterCount > 0 && (
              <Button variant="ghost" onClick={clearFilters} className="flex items-center gap-2">
                <X className="size-4" />
                Clear All
              </Button>
            )}
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <Card>
              <CardContent className="p-4 sm:p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Property Type</label>
                    <Select value={propertyType} onValueChange={setPropertyType}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Types</SelectItem>
                        <SelectItem value="residential">Residential</SelectItem>
                        <SelectItem value="commercial">Commercial</SelectItem>
                        <SelectItem value="land">Land</SelectItem>
                        <SelectItem value="multi_family">Multi-Family</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Status</label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Statuses</SelectItem>
                        <SelectItem value="available">For Sale</SelectItem>
                        <SelectItem value="rented">For Rent</SelectItem>
                        <SelectItem value="under_contract">Under Contract</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Min Price</label>
                    <Input
                      type="number"
                      placeholder="Min"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Max Price</label>
                    <Input
                      type="number"
                      placeholder="Max"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Min Bedrooms</label>
                    <Input
                      type="number"
                      placeholder="Any"
                      value={minBedrooms}
                      onChange={(e) => setMinBedrooms(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Min Bathrooms</label>
                    <Input
                      type="number"
                      placeholder="Any"
                      value={minBathrooms}
                      onChange={(e) => setMinBathrooms(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">City</label>
                    <Input
                      placeholder="Any city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">State</label>
                    <Input
                      placeholder="Any state"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Results */}
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Loading..." : `Found ${total} ${total === 1 ? "property" : "properties"}`}
          </p>
        </div>

        {/* Properties Grid */}
        {isLoading ? (
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <Card key={i}>
                <Skeleton className="h-48 w-full" />
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-6 w-1/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : properties.length === 0 ? (
          <Card>
            <CardContent className="p-8 sm:p-12 text-center">
              <p className="text-lg text-muted-foreground mb-4">No properties found</p>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search or filters to find more properties.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {properties.map((property) => (
              <PublicPropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

