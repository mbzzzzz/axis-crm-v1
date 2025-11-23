"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Building2, Users, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface Property {
  id: number;
  title: string;
  address: string;
  city?: string;
  state?: string;
}

interface Tenant {
  id: number;
  name: string;
  email: string;
  property?: {
    title?: string;
    address?: string;
  };
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();

  useEffect(() => {
    if (open && searchQuery.length > 0) {
      const fetchResults = async () => {
        setIsLoading(true);
        try {
          // Fetch properties and tenants in parallel
          const [propertiesRes, tenantsRes] = await Promise.all([
            fetch(`/api/properties?search=${encodeURIComponent(searchQuery)}&limit=5`),
            fetch(`/api/tenants?search=${encodeURIComponent(searchQuery)}&limit=5`),
          ]);

          const propertiesData = await propertiesRes.json();
          const tenantsData = await tenantsRes.json();

          setProperties(Array.isArray(propertiesData) ? propertiesData : []);
          setTenants(Array.isArray(tenantsData) ? tenantsData : []);
        } catch (error) {
          console.error("Failed to fetch search results:", error);
        } finally {
          setIsLoading(false);
        }
      };

      const debounceTimer = setTimeout(fetchResults, 300);
      return () => clearTimeout(debounceTimer);
    } else {
      setProperties([]);
      setTenants([]);
    }
  }, [searchQuery, open]);

  useEffect(() => {
    if (!open) {
      setSearchQuery("");
      setSelectedIndex(0);
    }
  }, [open]);

  const allResults = [
    ...properties.map((p) => ({ type: "property" as const, data: p })),
    ...tenants.map((t) => ({ type: "tenant" as const, data: t })),
  ];

  const handleSelect = (item: typeof allResults[0]) => {
    if (item.type === "property") {
      router.push(`/properties`);
      // You could navigate to a specific property detail page if you have one
      // router.push(`/properties/${item.data.id}`);
    } else if (item.type === "tenant") {
      router.push(`/tenants`);
      // You could navigate to a specific tenant detail page if you have one
      // router.push(`/tenants/${item.data.id}`);
    }
    onOpenChange(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % allResults.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + allResults.length) % allResults.length);
    } else if (e.key === "Enter" && allResults[selectedIndex]) {
      e.preventDefault();
      handleSelect(allResults[selectedIndex]);
    } else if (e.key === "Escape") {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden border-0 bg-background/95 backdrop-blur-md shadow-2xl">
        <div className="flex flex-col">
          <div className="flex items-center border-b px-4 py-3">
            <Search className="mr-2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search properties and tenants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
              autoFocus
            />
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            {isLoading ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Searching...
              </div>
            ) : searchQuery.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Start typing to search for properties and tenants...
              </div>
            ) : allResults.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No results found for "{searchQuery}"
              </div>
            ) : (
              <div className="py-2">
                {properties.length > 0 && (
                  <div>
                    <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Properties
                    </div>
                    {properties.map((property, index) => {
                      const resultIndex = index;
                      return (
                        <button
                          key={property.id}
                          onClick={() => handleSelect({ type: "property", data: property })}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-accent transition-colors",
                            selectedIndex === resultIndex && "bg-accent"
                          )}
                          onMouseEnter={() => setSelectedIndex(resultIndex)}
                        >
                          <div className="flex items-center justify-center size-10 rounded-lg bg-primary/10">
                            <Building2 className="size-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{property.title}</div>
                            <div className="text-sm text-muted-foreground truncate">
                              {property.address}
                              {property.city && property.state && `, ${property.city}, ${property.state}`}
                            </div>
                          </div>
                          <ArrowRight className="size-4 text-muted-foreground shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                )}
                {tenants.length > 0 && (
                  <div>
                    <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Tenants
                    </div>
                    {tenants.map((tenant, index) => {
                      const resultIndex = properties.length + index;
                      return (
                        <button
                          key={tenant.id}
                          onClick={() => handleSelect({ type: "tenant", data: tenant })}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-accent transition-colors",
                            selectedIndex === resultIndex && "bg-accent"
                          )}
                          onMouseEnter={() => setSelectedIndex(resultIndex)}
                        >
                          <div className="flex items-center justify-center size-10 rounded-lg bg-primary/10">
                            <Users className="size-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{tenant.name}</div>
                            <div className="text-sm text-muted-foreground truncate">
                              {tenant.email}
                              {tenant.property && ` • ${tenant.property.title || tenant.property.address}`}
                            </div>
                          </div>
                          <ArrowRight className="size-4 text-muted-foreground shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="border-t px-4 py-2 text-xs text-muted-foreground flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-muted rounded border">↑↓</kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-muted rounded border">↵</kbd>
                Select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-muted rounded border">Esc</kbd>
                Close
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

