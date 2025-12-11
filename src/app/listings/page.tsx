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
import { Search, Filter, X, Building2, MapPin, Bed, Bath, ArrowLeft, Home } from "lucide-react";
import { PublicPropertyCard } from "@/components/property/PublicPropertyCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

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
      {/* Back Button */}
      <div className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-3">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="size-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden border-b text-white min-h-[600px] sm:min-h-[700px]">
        {/* Background Video - Always visible as background */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            objectFit: "cover",
            zIndex: 0,
            pointerEvents: "none",
            backgroundColor: "#0f172a", // Fallback color while video loads
          }}
          onLoadedData={(e) => {
            // Ensure video plays even if autoplay was blocked
            const video = e.currentTarget;
            if (video.paused) {
              video.play().catch(() => {
                // Autoplay was blocked, but video will play on user interaction
              });
            }
          }}
        >
          <source src="/screenshots/video%20components/unicorn-1765390779031.mp4" type="video/mp4" />
        </video>
        
        {/* Overlay to ensure text readability - reduced opacity to show video colors */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/30 via-slate-800/25 to-slate-900/30 z-10" />
        
        {/* Content */}
        <div className="container mx-auto px-4 py-16 sm:py-20 relative z-20">
          <div className="max-w-4xl space-y-6">
            <div className="inline-flex items-center rounded-full bg-white/10 px-4 py-1.5 text-xs font-medium backdrop-blur border border-white/20">
              Curated homes & investments
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
              Find your perfect property
            </h1>
            <p className="text-lg sm:text-xl text-white/90 max-w-2xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
              Explore verified listings with rich details, smart filters, and instant contact to agents.
            </p>
          </div>
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl">
            {highlightStats.map((item) => (
              <div key={item.label} className="rounded-xl border border-white/20 bg-white/10 p-5 backdrop-blur hover:bg-white/15 transition-colors">
                <p className="text-sm text-white/80 mb-1">{item.label}</p>
                <p className="text-3xl font-bold text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-8 lg:py-12 space-y-8">
        {/* Search & Filters */}
        <Card className="border-border/50 shadow-lg">
          <CardContent className="p-5 sm:p-6 space-y-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by address, city, or property name"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-12 h-12 text-base"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 h-12"
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
                  <Button variant="ghost" onClick={clearFilters} className="flex items-center gap-2 h-12">
                    <X className="size-4" />
                    Clear
                  </Button>
                )}
              </div>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pt-2 border-t">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Property Type</label>
                  <Select value={propertyType} onValueChange={setPropertyType}>
                    <SelectTrigger className="h-11">
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
                  <label className="text-sm font-semibold">Status</label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="h-11">
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
                    <label className="text-sm font-semibold">Min Price</label>
                    <Input
                      type="number"
                      placeholder="$"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Max Price</label>
                    <Input
                      type="number"
                      placeholder="$"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="h-11"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Min Beds</label>
                    <Input
                      type="number"
                      placeholder="Any"
                      value={minBedrooms}
                      onChange={(e) => setMinBedrooms(e.target.value)}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Min Baths</label>
                    <Input
                      type="number"
                      placeholder="Any"
                      value={minBathrooms}
                      onChange={(e) => setMinBathrooms(e.target.value)}
                      className="h-11"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold">City</label>
                  <Input
                    placeholder="Any city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold">State</label>
                  <Input
                    placeholder="Any state"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold">Area / Neighborhood</label>
                  <Input
                    placeholder="e.g., DHA, Bahria Town"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="h-11"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results header */}
        <div className="flex flex-wrap items-center gap-4 justify-between pb-2">
          <div className="flex items-center gap-2">
            <Building2 className="size-5 text-muted-foreground" />
            <span className="text-base font-semibold">
              {isLoading ? "Loading listings..." : `${total} ${total === 1 ? "property" : "properties"} found`}
            </span>
          </div>
          {(area || city || minBedrooms || minBathrooms) && (
            <div className="flex items-center gap-2 flex-wrap">
              {area && (
                <Badge variant="secondary" className="px-3 py-1.5">
                  <MapPin className="size-3.5 mr-1.5" />
                  {area}
                </Badge>
              )}
              {city && !area && (
                <Badge variant="secondary" className="px-3 py-1.5">
                  <MapPin className="size-3.5 mr-1.5" />
                  {city}
                </Badge>
              )}
              {minBedrooms && (
                <Badge variant="secondary" className="px-3 py-1.5">
                  <Bed className="size-3.5 mr-1.5" />
                  {minBedrooms}+ beds
                </Badge>
              )}
              {minBathrooms && (
                <Badge variant="secondary" className="px-3 py-1.5">
                  <Bath className="size-3.5 mr-1.5" />
                  {minBathrooms}+ baths
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Properties Grid */}
        {isLoading ? (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-56 w-full" />
                <CardContent className="p-5 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-7 w-1/3" />
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : properties.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-12 sm:p-16 text-center">
              <Building2 className="size-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-xl font-semibold mb-2">No properties found</p>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Try adjusting your search or filters to find more properties that match your criteria.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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

