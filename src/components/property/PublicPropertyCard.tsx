"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Bed, Bath, Square, Heart } from "lucide-react";
import { formatCurrency, type CurrencyCode } from "@/lib/currency-formatter";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

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
  const [isLiked, setIsLiked] = useState(false);

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
      rented: "bg-green-500",
      occupied: "bg-green-500",
      available: "bg-blue-600",
      vacant: "bg-blue-600",
      pending: "bg-orange-500",
      maintenance: "bg-orange-500",
      under_contract: "bg-yellow-600",
      sold: "bg-purple-600",
    };
    return colors[status.toLowerCase()] || "bg-gray-500";
  };

  return (
    <Card className="group relative overflow-hidden border-none bg-muted/20 hover:bg-muted/30 transition-all duration-500 shadow-sm hover:shadow-2xl h-full flex flex-col">
      <Link href={`/listings/${property.id}`} className="block relative aspect-[4/3] overflow-hidden">
        {/* Image Section */}
        <Image
          src={mainImage}
          alt={property.title || property.address}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

        {/* Status Badge */}
        <div className="absolute top-4 left-4 z-10">
          <Badge className={cn("px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white border-none", getStatusColor(property.status))}>
            {getStatusLabel(property.status)}
          </Badge>
        </div>

        {/* Like Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsLiked(!isLiked);
          }}
          className="absolute top-4 right-4 size-9 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white hover:text-red-500 transition-all z-20"
        >
          <Heart className={cn("size-5", isLiked && "fill-current text-red-500")} />
        </button>

        {/* Price Overlay */}
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <p className="text-2xl font-black text-white drop-shadow-md">
            {formatCurrency(
              property.price,
              (property.currency || "USD") as CurrencyCode,
              { compact: false, showDecimals: false }
            )}
            {property.status === "rented" && <span className="text-sm font-normal opacity-80 ml-1">/mo</span>}
          </p>
        </div>
      </Link>

      {/* Content Section */}
      <CardContent className="p-5 space-y-3 flex-1 flex flex-col justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">
            {property.bedrooms !== null && (
              <span className="flex items-center gap-1">
                <span className="text-foreground">{property.bedrooms}</span> Bds
              </span>
            )}
            {property.bathrooms !== null && (
              <span className="flex items-center gap-1">
                <span className="text-foreground">{property.bathrooms}</span> Ba
              </span>
            )}
            {property.sizeSqft !== null && (
              <span className="flex items-center gap-1">
                <span className="text-foreground">{property.sizeSqft.toLocaleString()}</span> Sqft
              </span>
            )}
          </div>

          <div className="space-y-1">
            <Link href={`/listings/${property.id}`} className="block">
              <h3 className="font-bold text-lg line-clamp-1 group-hover:text-primary transition-colors">
                {property.title || property.address}
              </h3>
            </Link>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <MapPin className="size-3" />
              {property.city}, {property.state} {property.zipCode}
            </p>
          </div>
        </div>

        <div className="pt-4 mt-auto flex items-center justify-between border-t border-border/50">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
            Listing by AXIS
          </span>
          <div className="flex -space-x-2">
            {[1].map((i) => (
              <div key={i} className="size-6 rounded-full border-2 border-background bg-muted overflow-hidden relative">
                {/* Fallback avatar if no agent image */}
                <div className="size-full bg-slate-300 flex items-center justify-center text-[8px] font-bold text-slate-600">
                  AX
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

