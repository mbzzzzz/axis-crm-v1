"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Bed, Bath, Square } from "lucide-react";
import { formatCurrency, type CurrencyCode } from "@/lib/currency-formatter";
import Link from "next/link";

interface PublicPropertyCardProps {
  property: {
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
  };
}

export function PublicPropertyCard({ property }: PublicPropertyCardProps) {
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
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-xl group border-border/50">
      <Link href={`/listings/${property.id}`} className="block">
        <div className="relative h-56 overflow-hidden bg-muted">
          <div
            className="h-full w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
            style={{
              backgroundImage: `url(${mainImage})`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <Badge
            className={`absolute top-3 right-3 ${getStatusColor(property.status)} capitalize shadow-lg`}
          >
            {getStatusLabel(property.status)}
          </Badge>
          {property.images && property.images.length > 1 && (
            <div className="absolute bottom-3 left-3 bg-black/70 text-white px-2 py-1 rounded-md text-xs font-medium backdrop-blur-sm">
              {property.images.length} Photos
            </div>
          )}
        </div>
      </Link>
      <CardContent className="p-5">
        <div className="space-y-4">
          <div>
            <Link href={`/listings/${property.id}`}>
              <h3 className="font-bold text-lg line-clamp-2 hover:text-primary transition-colors mb-2 min-h-[3.5rem]">
                {property.title || property.address}
              </h3>
            </Link>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="size-3.5 flex-shrink-0" />
              <span className="line-clamp-1">
                {property.city}, {property.state}
              </span>
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">
              {formatCurrency(
                property.price,
                (property.currency || "USD") as CurrencyCode,
                { compact: false, showDecimals: false }
              )}
            </span>
            {property.status === "rented" && (
              <span className="text-sm text-muted-foreground font-normal">/mo</span>
            )}
          </div>

          <div className="flex items-center gap-4 pt-2 border-t">
            {property.bedrooms !== null && property.bedrooms !== undefined && (
              <div className="flex items-center gap-1.5 text-sm">
                <Bed className="size-4 text-muted-foreground" />
                <span className="font-medium">{property.bedrooms}</span>
                <span className="text-muted-foreground">Bed</span>
              </div>
            )}
            {property.bathrooms !== null && property.bathrooms !== undefined && (
              <div className="flex items-center gap-1.5 text-sm">
                <Bath className="size-4 text-muted-foreground" />
                <span className="font-medium">{property.bathrooms}</span>
                <span className="text-muted-foreground">Bath</span>
              </div>
            )}
            {property.sizeSqft !== null && property.sizeSqft !== undefined && (
              <div className="flex items-center gap-1.5 text-sm">
                <Square className="size-4 text-muted-foreground" />
                <span className="font-medium">{property.sizeSqft.toLocaleString()}</span>
                <span className="text-muted-foreground">sqft</span>
              </div>
            )}
          </div>

          <Link href={`/listings/${property.id}`}>
            <Button className="w-full mt-4" variant="default">
              View Details
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

