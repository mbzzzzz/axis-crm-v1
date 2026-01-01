"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Property } from "@/types/property"; // Verify type path or redefine
import Link from "next/link";
import { formatCurrency } from "@/lib/currency-formatter";
import { Badge } from "@/components/ui/badge";

// Fix for default markers in Leaflet with Next.js
const iconUrl = "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png";
const iconRetinaUrl = "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png";
const shadowUrl = "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png";

const customIcon = new L.Icon({
    iconUrl,
    iconRetinaUrl,
    shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

interface PropertyMapProps {
    properties: any[]; // Using any to avoid strict type complex for now, match Property interface
}

function MapController({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, map.getZoom());
    }, [center, map]);
    return null;
}

export default function PropertyMap({ properties }: PropertyMapProps) {
    const [mounted, setMounted] = useState(false);

    // Default center (San Francisco or user location if available)
    const defaultCenter: [number, number] = [37.7749, -122.4194];
    const [center, setCenter] = useState<[number, number]>(defaultCenter);

    useEffect(() => {
        setMounted(true);
        // If we have properties with coordinates, center on the first one
        // Note: properties mock often lacks lat/lng, need to verify.
        // For now, we assume properties might not have lat/lng effectively.
    }, []);

    if (!mounted) return <div className="h-full w-full bg-muted/20 animate-pulse" />;

    return (
        <MapContainer
            center={center}
            zoom={12}
            style={{ height: "100%", width: "100%", borderRadius: "0.5rem", zIndex: 0 }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {properties.map((property) => {
                // Mock coordinates if missing (random scatter around SF for demo)
                // Real implementation should use property.latitude / property.longitude
                const lat = 37.7749 + (Math.random() - 0.5) * 0.1;
                const lng = -122.4194 + (Math.random() - 0.5) * 0.1;

                return (
                    <Marker key={property.id} position={[lat, lng]} icon={customIcon}>
                        <Popup>
                            <div className="min-w-[200px]">
                                <img
                                    src={property.images?.[0] || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=300"}
                                    alt={property.title}
                                    className="w-full h-32 object-cover rounded-t-md mb-2"
                                />
                                <div className="p-2">
                                    <h3 className="font-bold text-sm truncate">{property.title}</h3>
                                    <p className="font-black text-lg text-primary">
                                        {formatCurrency(property.price, property.currency || 'USD')}
                                    </p>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        {property.bedrooms} bds | {property.bathrooms} ba | {property.sizeSqft} sqft
                                    </div>
                                    <Link
                                        href={`/listings/${property.id}`}
                                        className="block w-full text-center bg-primary text-primary-foreground text-xs py-2 rounded mt-2 font-bold"
                                    >
                                        View Home
                                    </Link>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                );
            })}
        </MapContainer>
    );
}
