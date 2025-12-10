"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Bed, Bath, Square, Calendar, ArrowLeft, Share2, Phone, Mail, Heart, Download, Printer } from "lucide-react";
import { formatCurrency, type CurrencyCode } from "@/lib/currency-formatter";
import { ImageGallery } from "@/components/property/ImageGallery";
import { AgentContactCard } from "@/components/property/AgentContactCard";
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
  yearBuilt?: number | null;
  description?: string | null;
  images?: string[] | null;
  amenities?: any;
  userId: string;
}

interface AgentInfo {
  name?: string;
  email?: string;
  phone?: string;
  agency?: string;
  image?: string;
}

export default function PublicPropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.id as string;
  const [property, setProperty] = useState<Property | null>(null);
  const [agentInfo, setAgentInfo] = useState<AgentInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const response = await fetch(`/api/public/properties/${propertyId}`);
        if (response.ok) {
          const data = await response.json();
          setProperty(data.property);
          setAgentInfo(data.agentInfo || {});
        } else {
          router.push("/listings");
        }
      } catch (error) {
        console.error("Error fetching property:", error);
        router.push("/listings");
      } finally {
        setIsLoading(false);
      }
    };

    if (propertyId) {
      fetchProperty();
    }
  }, [propertyId, router]);

  const handleShare = async () => {
    if (navigator.share && property) {
      try {
        await navigator.share({
          title: property.title,
          text: property.description || `Check out this property: ${property.title}`,
          url: window.location.href,
        });
      } catch (error) {
        // User cancelled or error occurred
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-12 w-64 mb-4" />
          <div className="grid md:grid-cols-2 gap-8">
            <Skeleton className="h-96 w-full" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-lg mb-4">Property not found</p>
            <Link href="/listings">
              <Button>Browse Properties</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const propertyImages = property.images && property.images.length > 0
    ? property.images
    : ["https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800"];

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      available: "For Sale",
      rented: "For Rent",
      under_contract: "Under Contract",
      sold: "Sold",
      pending: "Pending",
    };
    return labels[status] || status.replace(/_/g, " ");
  };

  const getStatusColor = (status: string) => {
    // Match the exact colors from dashboard properties page
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
    <div className="min-h-screen bg-background">
      {/* Header Bar */}
      <div className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/listings">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 size-4" />
                Back to Properties
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsFavorite(!isFavorite)}
                className={isFavorite ? "text-red-500" : ""}
              >
                <Heart className={`size-4 ${isFavorite ? "fill-current" : ""}`} />
              </Button>
              <Button variant="outline" size="icon" onClick={handleShare}>
                <Share2 className="size-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => window.print()}>
                <Printer className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 lg:py-8">
        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column - Images & Details (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <ImageGallery images={propertyImages} title={property.title || property.address} />

            {/* Property Header */}
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={`${getStatusColor(property.status)} text-sm px-3 py-1`}>
                    {getStatusLabel(property.status)}
                  </Badge>
                  <span className="text-sm text-muted-foreground">{property.propertyType}</span>
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold mb-2">
                  {property.title || property.address}
                </h1>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="size-4 flex-shrink-0" />
                  <span className="text-base">
                    {property.address}, {property.city}, {property.state} {property.zipCode}
                  </span>
                </div>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-2">
                <span className="text-4xl lg:text-5xl font-bold">
                  {formatCurrency(
                    property.price,
                    (property.currency || "USD") as CurrencyCode,
                    { compact: false, showDecimals: false }
                  )}
                </span>
                {property.status === "rented" && (
                  <span className="text-xl text-muted-foreground">/month</span>
                )}
              </div>
            </div>

            {/* Key Features */}
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {property.bedrooms !== null && property.bedrooms !== undefined && (
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-3">
                        <Bed className="size-6 text-primary" />
                      </div>
                      <div className="text-2xl font-bold">{property.bedrooms}</div>
                      <div className="text-sm text-muted-foreground">Bedrooms</div>
                    </div>
                  )}
                  {property.bathrooms !== null && property.bathrooms !== undefined && (
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-3">
                        <Bath className="size-6 text-primary" />
                      </div>
                      <div className="text-2xl font-bold">{property.bathrooms}</div>
                      <div className="text-sm text-muted-foreground">Bathrooms</div>
                    </div>
                  )}
                  {property.sizeSqft !== null && property.sizeSqft !== undefined && (
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-3">
                        <Square className="size-6 text-primary" />
                      </div>
                      <div className="text-2xl font-bold">{property.sizeSqft.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">Sq Ft</div>
                    </div>
                  )}
                  {property.yearBuilt && (
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-3">
                        <Calendar className="size-6 text-primary" />
                      </div>
                      <div className="text-2xl font-bold">{property.yearBuilt}</div>
                      <div className="text-sm text-muted-foreground">Year Built</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            {property.description && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">About this property</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {property.description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Amenities */}
            {property.amenities && Array.isArray(property.amenities) && property.amenities.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Amenities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {property.amenities.map((amenity: string, index: number) => (
                      <Badge key={index} variant="secondary" className="text-sm px-3 py-1.5">
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Agent Contact Card (1/3 width) */}
          <div className="lg:col-span-1">
            {property && agentInfo && (
              <AgentContactCard
                agentInfo={agentInfo}
                propertyId={property.id}
                propertyTitle={property.title || property.address}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

