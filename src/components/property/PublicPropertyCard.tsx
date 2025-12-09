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
    <Card className="overflow-hidden transition-shadow hover:shadow-lg group">
      <Link href={`/properties/${property.id}`}>
        <div
          className="h-48 cursor-pointer bg-cover bg-center transition-transform group-hover:scale-105"
          style={{
            backgroundImage: `url(${mainImage})`,
          }}
        />
      </Link>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <Link href={`/properties/${property.id}`}>
                <h3 className="font-semibold text-lg line-clamp-1 hover:text-primary transition-colors">
                  {property.title || property.address}
                </h3>
              </Link>
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <MapPin className="size-3 flex-shrink-0" />
                <span className="line-clamp-1">
                  {property.city}, {property.state} {property.zipCode}
                </span>
              </div>
            </div>
            <Badge
              className={`${getStatusColor(property.status)} capitalize flex-shrink-0`}
            >
              {getStatusLabel(property.status)}
            </Badge>
          </div>

          <div className="text-2xl font-bold">
            {formatCurrency(
              property.price,
              (property.currency || "USD") as CurrencyCode,
              { compact: false, showDecimals: false }
            )}
            {property.status === "rented" ? (
              <span className="text-base font-normal text-muted-foreground">/mo</span>
            ) : null}
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {property.bedrooms !== null && property.bedrooms !== undefined && (
              <div className="flex items-center gap-1">
                <Bed className="size-4" />
                <span>{property.bedrooms}</span>
              </div>
            )}
            {property.bathrooms !== null && property.bathrooms !== undefined && (
              <div className="flex items-center gap-1">
                <Bath className="size-4" />
                <span>{property.bathrooms}</span>
              </div>
            )}
            {property.sizeSqft !== null && property.sizeSqft !== undefined && (
              <div className="flex items-center gap-1">
                <Square className="size-4" />
                <span>{property.sizeSqft.toLocaleString()} sqft</span>
              </div>
            )}
          </div>

          <div className="pt-2">
            <Link href={`/properties/${property.id}`}>
              <Button className="w-full" variant="default">
                View Details
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

