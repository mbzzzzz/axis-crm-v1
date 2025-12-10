"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bed, Bath, Square } from "lucide-react";
import { formatCurrency, type CurrencyCode } from "@/lib/currency-formatter";
import Link from "next/link";

interface FeaturedPropertyCardProps {
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
    createdAt?: string;
  };
}

export function FeaturedPropertyCard({ property }: FeaturedPropertyCardProps) {
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

  // Check if property is new (created within last 7 days)
  const isNew = property.createdAt
    ? new Date(property.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
    : false;

  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-xl group border-border/50">
      <Link href={`/listings/${property.id}`} className="block">
        {/* Image Section */}
        <div className="relative h-64 overflow-hidden bg-muted">
          <div
            className="h-full w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
            style={{
              backgroundImage: `url(${mainImage})`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Badges */}
          <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
            <Badge className={`${getStatusColor(property.status)} shadow-lg text-xs px-2.5 py-1`}>
              {getStatusLabel(property.status)}
            </Badge>
            {isNew && (
              <Badge className="bg-green-500 text-white shadow-lg text-xs px-2.5 py-1">
                New
              </Badge>
            )}
          </div>
        </div>
      </Link>

      <CardContent className="p-5">
        <div className="space-y-4">
          {/* Price */}
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-cyan-500">
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

          {/* Address/Title */}
          <div>
            <Link href={`/listings/${property.id}`}>
              <h3 className="font-semibold text-base line-clamp-1 hover:text-primary transition-colors">
                {property.title || property.address}
              </h3>
            </Link>
            <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
              {property.address}, {property.city}, {property.state}
            </p>
          </div>

          {/* Property Details */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2 border-t">
            {property.bedrooms !== null && property.bedrooms !== undefined && (
              <div className="flex items-center gap-1.5">
                <Bed className="size-4" />
                <span className="font-medium">{property.bedrooms}</span>
                <span>Bed</span>
              </div>
            )}
            {property.bathrooms !== null && property.bathrooms !== undefined && (
              <div className="flex items-center gap-1.5">
                <Bath className="size-4" />
                <span className="font-medium">{property.bathrooms}</span>
                <span>Bath</span>
              </div>
            )}
            {property.sizeSqft !== null && property.sizeSqft !== undefined && (
              <div className="flex items-center gap-1.5">
                <Square className="size-4" />
                <span className="font-medium">{property.sizeSqft.toLocaleString()}</span>
                <span>sqft</span>
              </div>
            )}
          </div>

          {/* View Details Button */}
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

