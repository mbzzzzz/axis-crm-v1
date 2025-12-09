"use client";

import { useEffect, useState } from "react";
import { PublicPropertyCard } from "@/components/property/PublicPropertyCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

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

export function FeaturedProperties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedProperties = async () => {
      try {
        // Fetch 6 featured public properties
        const response = await fetch("/api/public/properties?limit=6");
        const data = await response.json();

        if (response.ok && data.properties) {
          setProperties(data.properties.slice(0, 6));
        }
      } catch (error) {
        console.error("Error fetching featured properties:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeaturedProperties();
  }, []);

  if (isLoading) {
    return (
      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4">
          <div className="mb-8 text-center">
            <Skeleton className="h-8 w-64 mx-auto mb-2" />
            <Skeleton className="h-4 w-96 mx-auto" />
          </div>
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
            {[...Array(6)].map((_, i) => (
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
        </div>
      </section>
    );
  }

  if (properties.length === 0) {
    return null; // Don't show section if no properties
  }

  return (
    <section className="py-16 sm:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="mb-8 sm:mb-12 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Featured Properties
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover our handpicked selection of premium properties available for sale and rent.
          </p>
        </div>

        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 mb-8">
          {properties.map((property) => (
            <PublicPropertyCard key={property.id} property={property} />
          ))}
        </div>

        <div className="text-center">
          <Link href="/listings">
            <Button size="lg" variant="outline">
              Browse All Properties
              <ArrowRight className="ml-2 size-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

