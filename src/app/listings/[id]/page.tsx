"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Bed, Bath, Square, Calendar, ArrowLeft, Share2, Phone, Mail } from "lucide-react";
import { formatCurrency, type CurrencyCode } from "@/lib/currency-formatter";
import { ContactForm } from "@/components/property/ContactForm";
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
}

export default function PublicPropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.id as string;
  const [property, setProperty] = useState<Property | null>(null);
  const [agentInfo, setAgentInfo] = useState<AgentInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showContactForm, setShowContactForm] = useState(false);

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

  const mainImage =
    property.images && property.images.length > 0
      ? property.images[0]
      : "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800";

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
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-4">
          <Link href="/listings">
            <Button variant="ghost">
              <ArrowLeft className="mr-2 size-4" />
              Back to Properties
            </Button>
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
          {/* Left Column - Images */}
          <div className="space-y-4">
            <div className="relative aspect-video rounded-lg overflow-hidden">
              <img
                src={mainImage}
                alt={property.title}
                className="w-full h-full object-cover"
              />
            </div>
            {property.images && property.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {property.images.slice(1, 5).map((image, index) => (
                  <div
                    key={index}
                    className="aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <img
                      src={image}
                      alt={`${property.title} - Image ${index + 2}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Details */}
          <div className="space-y-6">
            <div>
              <div className="flex items-start justify-between mb-2">
                <h1 className="text-3xl font-bold">{property.title || property.address}</h1>
                <Button variant="outline" size="icon" onClick={handleShare}>
                  <Share2 className="size-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <MapPin className="size-4" />
                <span>
                  {property.address}, {property.city}, {property.state} {property.zipCode}
                </span>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <Badge className={`${getStatusColor(property.status)} text-base px-3 py-1`}>
                  {getStatusLabel(property.status)}
                </Badge>
                <span className="text-3xl font-bold">
                  {formatCurrency(
                    property.price,
                    (property.currency || "USD") as CurrencyCode,
                    { compact: false, showDecimals: false }
                  )}
                  {property.status === "rented" && (
                    <span className="text-lg font-normal text-muted-foreground">/month</span>
                  )}
                </span>
              </div>
            </div>

            {/* Key Features */}
            <Card>
              <CardHeader>
                <CardTitle>Key Features</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {property.bedrooms !== null && property.bedrooms !== undefined && (
                    <div className="text-center">
                      <Bed className="size-6 mx-auto mb-2 text-muted-foreground" />
                      <div className="font-semibold">{property.bedrooms}</div>
                      <div className="text-sm text-muted-foreground">Bedrooms</div>
                    </div>
                  )}
                  {property.bathrooms !== null && property.bathrooms !== undefined && (
                    <div className="text-center">
                      <Bath className="size-6 mx-auto mb-2 text-muted-foreground" />
                      <div className="font-semibold">{property.bathrooms}</div>
                      <div className="text-sm text-muted-foreground">Bathrooms</div>
                    </div>
                  )}
                  {property.sizeSqft !== null && property.sizeSqft !== undefined && (
                    <div className="text-center">
                      <Square className="size-6 mx-auto mb-2 text-muted-foreground" />
                      <div className="font-semibold">{property.sizeSqft.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">Sq Ft</div>
                    </div>
                  )}
                  {property.yearBuilt && (
                    <div className="text-center">
                      <Calendar className="size-6 mx-auto mb-2 text-muted-foreground" />
                      <div className="font-semibold">{property.yearBuilt}</div>
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
                  <CardTitle>Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{property.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Amenities */}
            {property.amenities && Array.isArray(property.amenities) && property.amenities.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Amenities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {property.amenities.map((amenity: string, index: number) => (
                      <Badge key={index} variant="secondary">
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Contact Section */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Agent</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {agentInfo && (agentInfo.name || agentInfo.email || agentInfo.phone) && (
                  <div className="space-y-2">
                    {agentInfo.name && (
                      <div>
                        <span className="font-semibold">Agent:</span> {agentInfo.name}
                      </div>
                    )}
                    {agentInfo.agency && (
                      <div>
                        <span className="font-semibold">Agency:</span> {agentInfo.agency}
                      </div>
                    )}
                    {agentInfo.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="size-4" />
                        <a href={`tel:${agentInfo.phone}`} className="hover:underline">
                          {agentInfo.phone}
                        </a>
                      </div>
                    )}
                    {agentInfo.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="size-4" />
                        <a href={`mailto:${agentInfo.email}`} className="hover:underline">
                          {agentInfo.email}
                        </a>
                      </div>
                    )}
                  </div>
                )}
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => setShowContactForm(!showContactForm)}
                >
                  {showContactForm ? "Hide Contact Form" : "Send Message to Agent"}
                </Button>
                {showContactForm && property && (
                  <ContactForm propertyId={property.id} propertyTitle={property.title} />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

