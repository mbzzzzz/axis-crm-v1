"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrencyCompact, type CurrencyCode } from "@/lib/currency-formatter";
import { Eye } from "lucide-react";

// Fix for default marker icons in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface Property {
  id: number;
  title: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  price: number;
  images?: string[];
  currency?: string;
}

interface PropertyMapViewProps {
  properties: Property[];
  onPropertyClick: (property: Property) => void;
}

// Component to fit map bounds to all markers
function FitBounds({ properties }: { properties: Property[] }) {
  const map = useMap();

  useEffect(() => {
    if (properties.length === 0) return;

    // Try to geocode addresses, fallback to default center
    const bounds = L.latLngBounds(
      properties.map((prop) => {
        // Default to Lahore coordinates if geocoding fails
        // In production, you'd use a geocoding service
        return [31.5204, 74.3587] as [number, number]; // Lahore coordinates
      })
    );

    if (properties.length === 1) {
      map.setView([31.5204, 74.3587], 13);
    } else {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [properties, map]);

  return null;
}

export function PropertyMapView({ properties, onPropertyClick }: PropertyMapViewProps) {
  // Default center: Lahore, Pakistan
  const defaultCenter: [number, number] = [31.5204, 74.3587];
  const defaultZoom = 12;

  // Create custom icon
  const createCustomIcon = (color: string = "#3b82f6") => {
    return L.divIcon({
      className: "custom-marker",
      html: `
        <div style="
          background-color: ${color};
          width: 30px;
          height: 30px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        ">
          <div style="
            transform: rotate(45deg);
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 12px;
          "></div>
        </div>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 30],
      popupAnchor: [0, -30],
    });
  };

  return (
    <div className="w-full h-[600px] rounded-lg overflow-hidden border">
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds properties={properties} />
        {properties.map((property) => {
          // For now, use default coordinates. In production, geocode addresses
          const position: [number, number] = [31.5204, 74.3587];
          const currency = (property.currency || "USD") as CurrencyCode;

          return (
            <Marker
              key={property.id}
              position={position}
              icon={createCustomIcon("#3b82f6")}
            >
              <Popup>
                <Card className="w-64 border-0 shadow-none p-0">
                  <CardContent className="p-0">
                    {property.images && property.images.length > 0 && (
                      <div className="w-full h-32 rounded-t-lg overflow-hidden mb-2">
                        <img
                          src={property.images[0]}
                          alt={property.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-3 space-y-2">
                      <h3 className="font-semibold text-sm line-clamp-1">{property.title}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {property.address}, {property.city}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm">
                          {formatCurrencyCompact(property.price, currency, {
                            compact: true,
                            showDecimals: false,
                          })}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => onPropertyClick(property)}
                        >
                          <Eye className="size-3 mr-1" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

