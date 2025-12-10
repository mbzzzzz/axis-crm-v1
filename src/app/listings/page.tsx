"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, X, Building2, MapPin, Bed, Bath } from "lucide-react";
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

function ListingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [availableCount, setAvailableCount] = useState(0);

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
  const [area, setArea] = useState(searchParams.get("area") || "");

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
    if (area) count++;
    setActiveFilterCount(count);
  }, [propertyType, status, minPrice, maxPrice, minBedrooms, minBathrooms, city, state, area]);

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
      if (area) params.set("area", area);

      // Update URL without navigation
      const newUrl = `/listings${params.toString() ? `?${params.toString()}` : ""}`;
      window.history.pushState({}, "", newUrl);

      const response = await fetch(`/api/public/properties?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setProperties(data.properties || []);
        setTotal(data.total || 0);
        const available = (data.properties || []).filter((p: any) => p.status === "available").length;
        setAvailableCount(available);
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
    setArea("");
    router.push("/listings");
  };

  const highlightStats = useMemo(
    () => [
      { label: "Total listings", value: total },
      { label: "Available now", value: availableCount },
      { label: "Cities", value: new Set(properties.map((p) => p.city)).size || 0 },
    ],
    [availableCount, properties, total]
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden border-b bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.12),transparent_25%),radial-gradient(circle_at_80%_0%,rgba(56,189,248,0.25),transparent_30%)]" />
        <div className="container mx-auto px-4 py-12 sm:py-16 relative">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
              Curated homes & investments
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight">
              Browse verified listings tailored to your next move.
            </h1>
            <p className="text-base sm:text-lg text-white/80">
              Explore properties with rich detail, smart filters, and instant contact to agents.
            </p>
          </div>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl">
            {highlightStats.map((item) => (
              <div key={item.label} className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <p className="text-sm text-white/70">{item.label}</p>
                <p className="text-2xl font-semibold mt-1">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10 space-y-6">
        {/* Search & Filters */}
        <Card className="border-muted/50 shadow-sm">
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by address, city, or property name"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
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
                    Clear
                  </Button>
                )}
              </div>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Property Type</label>
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

                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
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

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Min Price</label>
                    <Input
                      type="number"
                      placeholder="$"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Max Price</label>
                    <Input
                      type="number"
                      placeholder="$"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Min Beds</label>
                    <Input
                      type="number"
                      placeholder="Any"
                      value={minBedrooms}
                      onChange={(e) => setMinBedrooms(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Min Baths</label>
                    <Input
                      type="number"
                      placeholder="Any"
                      value={minBathrooms}
                      onChange={(e) => setMinBathrooms(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">City</label>
                  <Input
                    placeholder="Any city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">State</label>
                  <Input
                    placeholder="Any state"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Area / Neighborhood</label>
                  <Input
                    placeholder="e.g., DHA, Bahria Town"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results header */}
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Building2 className="size-4" />
            {isLoading ? "Loading listings..." : `Showing ${total} result${total === 1 ? "" : "s"}`}
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1">
              <MapPin className="size-4" />
              {area || city || "All locations"}
            </div>
            <div className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1">
              <Bed className="size-4" />
              {minBedrooms ? `${minBedrooms}+ beds` : "Any beds"}
            </div>
            <div className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1">
              <Bath className="size-4" />
              {minBathrooms ? `${minBathrooms}+ baths` : "Any baths"}
            </div>
          </div>
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
      </section>
    </div>
  );
}

export default function PublicPropertiesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
          Loading listings...
        </div>
      }
    >
      <ListingsContent />
    </Suspense>
  );
}

