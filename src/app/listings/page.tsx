"use client";

import { Suspense, useEffect, useMemo, useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, X, Building2, MapPin, Bed, Bath, ArrowLeft, ChevronLeft, ChevronRight, Menu, LayoutGrid, Map as MapIcon, List as ListIcon } from "lucide-react";
import { PublicPropertyCard } from "@/components/property/PublicPropertyCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import Image from "next/image";
import { AxisLogo } from "@/components/axis-logo";

// Dynamic import for Map to avoid SSR issues
const PropertyMap = dynamic(() => import("@/components/property/PropertyMap"), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-[600px] rounded-lg" />,
});

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
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [availableCount, setAvailableCount] = useState(0);

  // Trending Properties
  const [trendingProperties, setTrendingProperties] = useState<Property[]>([]);
  const [isTrendingLoading, setIsTrendingLoading] = useState(true);

  // View & UI States
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [activeTab, setActiveTab] = useState<"buy" | "rent" | "sold">("buy");
  const [sort, setSort] = useState(searchParams.get("sort") || "newest");

  // Filter states
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [propertyType, setPropertyType] = useState(searchParams.get("type") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "available");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const [minBedrooms, setMinBedrooms] = useState(searchParams.get("minBedrooms") || "");
  const [minBathrooms, setMinBathrooms] = useState(searchParams.get("minBathrooms") || "");
  const [city, setCity] = useState(searchParams.get("city") || "");
  const [state, setState] = useState(searchParams.get("state") || "");
  const [area, setArea] = useState(searchParams.get("area") || "");

  const [showFilters, setShowFilters] = useState(false);
  const [activeFilterCount, setActiveFilterCount] = useState(0);

  // Sync Tab with Status logic
  useEffect(() => {
    if (activeTab === "buy") setStatus("available");
    if (activeTab === "rent") setStatus("rented");
    if (activeTab === "sold") setStatus("sold");
  }, [activeTab]);

  // Calculate active filters
  useEffect(() => {
    let count = 0;
    if (propertyType) count++;
    if (status && status !== "available") count++; // Don't count default
    if (minPrice || maxPrice) count++;
    if (minBedrooms) count++;
    if (minBathrooms) count++;
    if (city) count++;
    if (state) count++;
    if (area) count++;
    setActiveFilterCount(count);
  }, [propertyType, status, minPrice, maxPrice, minBedrooms, minBathrooms, city, state, area]);

  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchProperties = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const newController = new AbortController();
    abortControllerRef.current = newController;
    const signal = newController.signal;

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
      if (sort) params.set("sort", sort);

      // Update URL silently
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });

      const response = await fetch(`/api/public/properties?${params.toString()}`, { signal });
      const data = await response.json();

      if (response.ok) {
        setProperties(data.properties || []);
        setTotal(data.total || 0);
        setAvailableCount(data.total);
      } else {
        console.error("Failed to fetch properties:", data.error);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.error("Error fetching properties:", error);
    } finally {
      if (newController === abortControllerRef.current) {
        setIsLoading(false);
      }
    }
  };

  const fetchTrendingProperties = async () => {
    setIsTrendingLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("city", "Lahore");
      params.set("limit", "4");

      const response = await fetch(`/api/public/properties?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setTrendingProperties(data.properties || []);
      }
    } catch (error) {
      console.error("Error fetching trending properties:", error);
    } finally {
      setIsTrendingLoading(false);
    }
  };

  // Immediate update
  useEffect(() => {
    fetchProperties();
  }, [propertyType, status, sort, activeTab]);

  // Fetch trending on mount
  useEffect(() => {
    fetchTrendingProperties();
  }, []);

  // Debounced update
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProperties();
    }, 400);
    return () => clearTimeout(timer);
  }, [search, minPrice, maxPrice, minBedrooms, minBathrooms, city, state, area]);

  const clearFilters = () => {
    setSearch("");
    setPropertyType("");
    setStatus("available");
    setActiveTab("buy");
    setMinPrice("");
    setMaxPrice("");
    setMinBedrooms("");
    setMinBathrooms("");
    setCity("");
    setState("");
    setArea("");
    setSort("newest");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navigation - Zillow style */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-24 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
            <div className="hidden md:flex items-center gap-6 text-sm font-medium">
              <Link href="/listings?activeTab=buy" className="hover:text-primary transition-colors">Buy</Link>
              <Link href="/listings?activeTab=rent" className="hover:text-primary transition-colors">Rent</Link>
              <Link href="/solutions/list-your-property" className="hover:text-primary transition-colors">Sell</Link>
              <Link href="/solutions/invoicing" className="hover:text-primary transition-colors">Home Loans</Link>
              <Link href="/solutions/tenant-management" className="hover:text-primary transition-colors">Agent finder</Link>
            </div>
          </div>

          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <Link href="/" className="flex items-center">
              <AxisLogo variant="full" size="xl" />
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-6 text-sm font-medium">
              <Link href="/tenant-portal/login" className="hover:text-primary transition-colors">Manage Rentals</Link>
              <Link href="/solutions/list-your-property" className="hover:text-primary transition-colors">Advertise</Link>
              <Link href="/blog" className="hover:text-primary transition-colors">Help</Link>
            </div>
            <Link href="/login">
              <Button variant="ghost" className="font-medium">Sign In</Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1 flex flex-col">
        {/* Full Width Hero Search */}
        <div className="relative w-full h-[450px] flex flex-col items-center justify-center p-6 text-white overflow-hidden">
          {/* Background Video */}
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
              backgroundColor: "#0f172a",
            }}
            onLoadedData={(e) => {
              const video = e.currentTarget;
              if (video.paused) {
                video.play().catch(() => { });
              }
            }}
          >
            <source src="/screenshots/video%20components/unicorn-1765390779031.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-black/50 z-0" />

          <div className="relative z-10 w-full max-w-4xl space-y-8 animate-in fade-in zoom-in duration-700">
            <h1 className="text-4xl md:text-6xl font-black text-center tracking-tight drop-shadow-lg leading-tight">
              Discover Your Dream<br className="md:hidden" /> Property in Pakistan
            </h1>

            {/* Intelligent Search Tabs */}
            <div className="flex justify-center">
              <div className="inline-flex bg-black/40 backdrop-blur-md p-1 rounded-full border border-white/20">
                {(['buy', 'rent', 'sold'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "px-8 py-2 rounded-full text-sm font-bold transition-all duration-300 capitalize",
                      activeTab === tab
                        ? "bg-white text-black shadow-lg scale-105"
                        : "text-white hover:bg-white/10"
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Big Search Bar */}
            <div className="relative max-w-2xl mx-auto group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-blue-600 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
              <div className="relative flex items-center bg-white rounded-full shadow-2xl overflow-hidden h-16 transition-transform transform group-hover:scale-[1.01]">
                <Search className="ml-6 h-6 w-6 text-gray-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Address, neighborhood, city, or ZIP"
                  className="border-none shadow-none text-lg h-full px-4 text-gray-900 placeholder:text-gray-400 focus-visible:ring-0"
                />
                <button className="mr-2 p-3 bg-primary rounded-full text-white hover:bg-primary/90 transition-colors">
                  <Search className="h-6 w-6" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Trending Homes Carousel */}
        <div className="container py-8 px-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Trending Homes in Lahore</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" className="h-8 w-8 rounded-full"><ChevronLeft className="h-4 w-4" /></Button>
              <Button variant="outline" size="icon" className="h-8 w-8 rounded-full"><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
            {isTrendingLoading ? (
              [1, 2, 3, 4].map(i => (
                <div key={i} className="min-w-[300px]">
                  <Skeleton className="h-[280px] w-full rounded-xl" />
                </div>
              ))
            ) : trendingProperties.length > 0 ? (
              trendingProperties.map((property) => (
                <div key={property.id} className="min-w-[300px] w-[300px]">
                  <PublicPropertyCard property={property} />
                </div>
              ))
            ) : (
              <div className="w-full text-center py-8 text-muted-foreground">
                No trending properties found in Lahore at the moment.
              </div>
            )}
          </div>
        </div>

        {/* Control Bar & Results */}
        <div className="bg-background border-b sticky top-24 z-40 shadow-sm">
          <div className="container py-3 px-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 no-scrollbar">
              {/* Filter Trigger */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(true)}
                className="h-10 border-dashed border-primary/50 hover:border-primary bg-primary/5 hover:bg-primary/10 text-primary font-semibold gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1 rounded-full text-[10px] flex items-center justify-center bg-primary text-primary-foreground">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>

              <div className="h-6 w-px bg-border mx-2" />

              {/* Quick Filters (Pills) */}
              <Select value={propertyType} onValueChange={setPropertyType}>
                <SelectTrigger className="h-10 w-[140px] rounded-full border-border/60 hover:border-border"><SelectValue placeholder="Home Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="house">Houses</SelectItem>
                  <SelectItem value="apartment">Apartments</SelectItem>
                  <SelectItem value="condo">Condos</SelectItem>
                  <SelectItem value="townhouse">Townhomes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              {/* Sort Dropdown */}
              <Select value={sort} onValueChange={(val) => setSort(val)}>
                <SelectTrigger className="w-[180px] h-10 border-transparent hover:bg-muted/50 font-medium">
                  <span className="text-muted-foreground mr-2 font-normal">Sort:</span> <SelectValue />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="price_asc">Price (Low to High)</SelectItem>
                  <SelectItem value="price_desc">Price (High to Low)</SelectItem>
                  <SelectItem value="bedrooms">Bedrooms</SelectItem>
                  <SelectItem value="sqft">Square Feet</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center bg-muted/50 p-1 rounded-lg border">
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="h-8 w-8 p-0"
                >
                  <ListIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "map" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("map")}
                  className="h-8 w-8 p-0"
                >
                  <MapIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 container px-4 py-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            {activeTab === 'buy' ? 'Real Estate & Homes For Sale' : activeTab === 'rent' ? 'Rental Listings' : 'Sold Properties'}
            <Badge variant="outline" className="ml-2 text-base font-normal px-3 py-0.5 h-7">
              {total.toLocaleString()} results
            </Badge>
          </h2>

          {viewMode === "map" ? (
            <div className="h-[calc(100vh-250px)] w-full rounded-xl overflow-hidden border shadow-inner relative z-0">
              <PropertyMap properties={properties} />
            </div>
          ) : (
            <>
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={i} className="flex flex-col space-y-3">
                      <Skeleton className="h-[300px] w-full rounded-xl" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-[250px]" />
                        <Skeleton className="h-4 w-[200px]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : properties.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in duration-500">
                  {properties.map((property) => (
                    <PublicPropertyCard key={property.id} property={property} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center animate-in zoom-in duration-300">
                  <div className="bg-muted/30 p-8 rounded-full mb-6">
                    <Building2 className="h-16 w-16 text-muted-foreground/50" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">No homes found</h3>
                  <p className="text-muted-foreground max-w-md mx-auto mb-8">
                    We couldn't find any properties matching your search. Try adjusting your filters or search area.
                  </p>
                  <Button onClick={clearFilters} size="lg" className="rounded-full shadow-lg hover:shadow-xl transition-all">
                    Clear all filters
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Filter Sidebar (Overlay) */}
      <div className={cn(
        "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity duration-300",
        showFilters ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      )} onClick={() => setShowFilters(false)} />

      <div className={cn(
        "fixed inset-y-0 right-0 z-50 w-full max-w-md bg-background shadow-2xl transition-transform duration-300 ease-out flex flex-col",
        showFilters ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold">Filters</h2>
          <Button variant="ghost" size="icon" onClick={() => setShowFilters(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Property Type */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Property Type</h3>
            <div className="grid grid-cols-2 gap-3">
              {['House', 'Apartment', 'Condo', 'Townhouse', 'Land', 'Multi-family'].map((type) => (
                <button
                  key={type}
                  onClick={() => setPropertyType(propertyType === type.toLowerCase() ? "" : type.toLowerCase())}
                  className={cn(
                    "py-3 px-4 rounded-lg border text-sm font-medium transition-all hover:border-primary/50",
                    propertyType === type.toLowerCase()
                      ? "bg-primary/10 border-primary text-primary"
                      : "bg-muted/10 border-border hover:bg-muted/30"
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Price Range</h3>
            <div className="flex items-center gap-4">
              <div className="space-y-1.5 flex-1">
                <label className="text-xs font-semibold text-muted-foreground">Minimum</label>
                <Input
                  type="number"
                  placeholder="No Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="h-12"
                />
              </div>
              <div className="h-px w-4 bg-border mt-6" />
              <div className="space-y-1.5 flex-1">
                <label className="text-xs font-semibold text-muted-foreground">Maximum</label>
                <Input
                  type="number"
                  placeholder="No Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="h-12"
                />
              </div>
            </div>
          </div>

          {/* Rooms */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Rooms</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-sm font-medium">Bedrooms</label>
                <Select value={minBedrooms} onValueChange={setMinBedrooms}>
                  <SelectTrigger className="h-11"><SelectValue placeholder="Any" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Any</SelectItem>
                    <SelectItem value="1">1+</SelectItem>
                    <SelectItem value="2">2+</SelectItem>
                    <SelectItem value="3">3+</SelectItem>
                    <SelectItem value="4">4+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <label className="text-sm font-medium">Bathrooms</label>
                <Select value={minBathrooms} onValueChange={setMinBathrooms}>
                  <SelectTrigger className="h-11"><SelectValue placeholder="Any" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Any</SelectItem>
                    <SelectItem value="1">1+</SelectItem>
                    <SelectItem value="2">2+</SelectItem>
                    <SelectItem value="3">3+</SelectItem>
                    <SelectItem value="4">4+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Location Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Location</h3>
            <div className="space-y-4">
              <Input
                placeholder="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="h-11"
              />
              <Input
                placeholder="Neighborhood / Area"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="h-11"
              />
            </div>
          </div>
        </div>

        <div className="p-4 border-t bg-background">
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 h-12" onClick={clearFilters}>
              Reset
            </Button>
            <Button className="flex-[2] h-12 text-lg font-bold shadow-lg shadow-primary/20" onClick={() => setShowFilters(false)}>
              Show {total} results
            </Button>
          </div>
        </div>
      </div>

      {/* Zillow-style Footer */}
      <footer className="bg-muted/30 border-t py-12 lg:py-20 mt-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12">
            <div className="col-span-2 space-y-6">
              <Link href="/" className="flex items-center gap-2">
                <Image
                  src="/landing page logo full.png"
                  alt="AXIS CRM"
                  width={140}
                  height={45}
                  className="h-10 w-auto object-contain"
                />
              </Link>
              <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                Axis CRM is the leading real estate management platform, helping you find and manage properties with ease.
              </p>
            </div>
            <div className="space-y-4">
              <h4 className="font-bold">Real Estate</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/listings?activeTab=buy" className="hover:text-foreground transition-colors">Properties for Sale</Link></li>
                <li><Link href="/listings?activeTab=rent" className="hover:text-foreground transition-colors">Rental Properties</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-bold">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition-colors">About Us</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Contact</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Help Center</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-bold">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/blog" className="hover:text-foreground transition-colors">Blog</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Guides</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Newsletter</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-20 pt-8 border-t flex flex-col md:flex-row justify-between gap-4 items-center text-xs text-muted-foreground">
            <p>© 2025 Axis CRM. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="/privacy-policy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
              <Link href="#" className="hover:text-foreground transition-colors">Terms of Use</Link>
              <Link href="#" className="hover:text-foreground transition-colors">Cookie Policy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function PublicPropertiesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
          <div className="animate-spin size-8 border-4 border-primary border-t-transparent rounded-full mb-4" />
          <span>Loading AXIS Listings...</span>
        </div>
      }
    >
      <ListingsContent />
    </Suspense>
  );
}
