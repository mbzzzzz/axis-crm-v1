"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Edit, Trash2, FileText, Building2, Users, Wrench } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { PropertyDetailsDialog } from "./property-details-dialog";
import { useRouter } from "next/navigation";

interface ActivityLog {
  id: number;
  action: "create" | "update" | "delete";
  entityType: string;
  entityId?: number;
  description: string;
  createdAt: string;
  user?: {
    name?: string;
    email?: string;
  };
}

export function RecentActivity() {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [isPropertyDialogOpen, setIsPropertyDialogOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchActivities();
    // Refresh every 30 seconds to show new activities
    const interval = setInterval(() => {
      fetchActivities();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchActivities = async () => {
    try {
      const response = await fetch("/api/audit-logs?limit=5");
      if (response.ok) {
        const data = await response.json();
        setActivities(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Failed to fetch activities:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActivityClick = async (activity: ActivityLog) => {
    // Don't open dialogs for deleted items
    if (activity.action === "delete") {
      // For deleted items, just navigate to the list page
      if (activity.entityType === "property") {
        router.push("/properties");
      } else if (activity.entityType === "tenant") {
        router.push("/tenants");
      } else if (activity.entityType === "maintenance_request") {
        router.push("/maintenance");
      } else if (activity.entityType === "invoice") {
        router.push("/invoices");
      }
      return;
    }

    if (activity.entityType === "property" && activity.entityId) {
      try {
        const response = await fetch(`/api/properties?id=${activity.entityId}`);
        if (response.ok) {
          const property = await response.json();
          setSelectedProperty(property);
          setIsPropertyDialogOpen(true);
        } else if (response.status === 404) {
          // Property not found (might have been deleted)
          console.warn("Property not found, may have been deleted");
        } else {
          console.error("Failed to fetch property: Response not OK");
        }
      } catch (error) {
        console.error("Failed to fetch property:", error);
      }
    } else if (activity.entityType === "tenant" && activity.entityId) {
      router.push("/tenants");
    } else if (activity.entityType === "maintenance_request" && activity.entityId) {
      router.push(`/maintenance`);
    } else if (activity.entityType === "invoice" && activity.entityId) {
      router.push("/invoices");
    }
  };

  const getActionIcon = (action: string, entityType: string) => {
    const iconClass = "size-4";
    
    if (action === "create") {
      switch (entityType) {
        case "property":
          return <Building2 className={`${iconClass} text-green-500`} />;
        case "tenant":
          return <Users className={`${iconClass} text-green-500`} />;
        case "invoice":
          return <FileText className={`${iconClass} text-green-500`} />;
        case "maintenance_request":
          return <Wrench className={`${iconClass} text-green-500`} />;
        default:
          return <Plus className={`${iconClass} text-green-500`} />;
      }
    } else if (action === "update") {
      return <Edit className={`${iconClass} text-blue-500`} />;
    } else if (action === "delete") {
      return <Trash2 className={`${iconClass} text-red-500`} />;
    }
    return <Edit className={`${iconClass} text-gray-500`} />;
  };

  const getInitials = (description: string) => {
    // Extract name from description (e.g., "John created..." -> "J")
    const match = description.match(/^(\w+)/);
    if (match) {
      return match[1][0].toUpperCase();
    }
    return "U";
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="size-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
          <CardDescription>No recent activity</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent Activity</CardTitle>
        <CardDescription>Last 5 actions in your system</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
          
          <div className="space-y-4">
            {activities.map((activity, index) => {
              // All activities with entityId are clickable
              const isClickable = !!activity.entityId && (
                activity.entityType === "property" ||
                activity.entityType === "tenant" ||
                activity.entityType === "maintenance_request" ||
                activity.entityType === "invoice"
              );
              
              return (
                <div 
                  key={activity.id} 
                  className={`relative flex items-start gap-3 ${isClickable ? "cursor-pointer hover:bg-accent/50 rounded-lg p-2 -m-2 transition-colors" : ""}`}
                  onClick={() => isClickable && handleActivityClick(activity)}
                  role={isClickable ? "button" : undefined}
                  tabIndex={isClickable ? 0 : undefined}
                  onKeyDown={(e) => {
                    if (isClickable && (e.key === "Enter" || e.key === " ")) {
                      e.preventDefault();
                      handleActivityClick(activity);
                    }
                  }}
                >
                  {/* Timeline dot */}
                  <div className="relative z-10 flex items-center justify-center">
                    <div className="rounded-full bg-background border-2 border-border p-1">
                      {getActionIcon(activity.action, activity.entityType)}
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0 pb-4">
                    <div className="flex items-start gap-2">
                      <Avatar className="size-6">
                        <AvatarFallback className="text-xs">
                          {getInitials(activity.description)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm leading-tight ${isClickable ? "hover:text-primary transition-colors" : ""}`}>
                          <span className="font-medium">{activity.description}</span>
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-muted-foreground font-light">
                            {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                          </p>
                          <span className="text-xs text-muted-foreground font-light">•</span>
                          <p className="text-xs text-muted-foreground font-light">
                            {format(new Date(activity.createdAt), "MMM d, yyyy 'at' h:mm a")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
      {selectedProperty && (
        <PropertyDetailsDialog
          property={selectedProperty}
          open={isPropertyDialogOpen}
          onOpenChange={setIsPropertyDialogOpen}
          onUpdate={() => {
            fetchActivities();
          }}
        />
      )}
    </Card>
  );
}

