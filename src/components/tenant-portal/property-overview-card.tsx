"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, Calendar, DollarSign } from "lucide-react";

interface Property {
  id: number;
  title?: string;
  address: string;
  city?: string;
  state?: string;
  zipCode?: string;
  propertyType?: string;
}

interface Tenant {
  id: number;
  name: string;
  email: string;
  monthlyRent?: number;
  leaseStart?: string;
  leaseEnd?: string;
  leaseStatus?: string;
}

interface PropertyOverviewCardProps {
  property: Property | null;
  tenant: Tenant | null;
}

export function PropertyOverviewCard({ property, tenant }: PropertyOverviewCardProps) {
  if (!property || !tenant) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Property Information</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No property assigned</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="size-5" />
          Property Overview
        </CardTitle>
        <CardDescription>Your rental property details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground">Property Address</label>
          <div className="mt-1 flex items-center gap-2">
            <MapPin className="size-4 text-muted-foreground" />
            <p className="font-medium">
              {property.title || property.address}
              {property.city && `, ${property.city}`}
              {property.state && `, ${property.state}`}
              {property.zipCode && ` ${property.zipCode}`}
            </p>
          </div>
        </div>

        {property.propertyType && (
          <div>
            <label className="text-sm font-medium text-muted-foreground">Property Type</label>
            <p className="mt-1">
              {property.propertyType.charAt(0).toUpperCase() + property.propertyType.slice(1).replace("_", " ")}
            </p>
          </div>
        )}

        {tenant.monthlyRent && (
          <div>
            <label className="text-sm font-medium text-muted-foreground">Monthly Rent</label>
            <div className="mt-1 flex items-center gap-2">
              <DollarSign className="size-4 text-muted-foreground" />
              <p className="font-semibold text-lg">${tenant.monthlyRent.toLocaleString()}</p>
            </div>
          </div>
        )}

        {tenant.leaseStart && tenant.leaseEnd && (
          <div>
            <label className="text-sm font-medium text-muted-foreground">Lease Period</label>
            <div className="mt-1 flex items-center gap-2">
              <Calendar className="size-4 text-muted-foreground" />
              <p className="text-sm">
                {new Date(tenant.leaseStart).toLocaleDateString()} - {new Date(tenant.leaseEnd).toLocaleDateString()}
              </p>
            </div>
          </div>
        )}

        {tenant.leaseStatus && (
          <div>
            <label className="text-sm font-medium text-muted-foreground">Lease Status</label>
            <div className="mt-1">
              <Badge
                className={
                  tenant.leaseStatus === "active"
                    ? "bg-green-100 text-green-700"
                    : tenant.leaseStatus === "expired"
                    ? "bg-red-100 text-red-700"
                    : "bg-gray-100 text-gray-700"
                }
              >
                {tenant.leaseStatus.charAt(0).toUpperCase() + tenant.leaseStatus.slice(1)}
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

