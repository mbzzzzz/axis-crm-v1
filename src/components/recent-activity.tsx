"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Edit, Trash2, FileText, Building2, Users, Wrench } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { PropertyDetailsDialog } from "./property-details-dialog";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

// Helper functions shared across compact sidebar view and full preview dialog
function getActionIcon(action: string, entityType: string) {
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
}

function getInitials(description: string) {
  // Extract name from description (e.g., "John created..." -> "J")
  const match = description.match(/^(\w+)/);
  if (match) {
    return match[1][0].toUpperCase();
  }
  return "U";
}

export function RecentActivity() {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [isPropertyDialogOpen, setIsPropertyDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
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
        <CardHeader className="cursor-pointer" onClick={() => setIsPreviewOpen(true)}>
          <CardTitle className="text-base">Recent Activity</CardTitle>
          <CardDescription>No recent activity yet</CardDescription>
        </CardHeader>
        <ActivityPreviewDialog
          open={isPreviewOpen}
          onOpenChange={setIsPreviewOpen}
          activities={activities}
          onActivityClick={handleActivityClick}
          selectedProperty={selectedProperty}
          isPropertyDialogOpen={isPropertyDialogOpen}
          setIsPropertyDialogOpen={setIsPropertyDialogOpen}
          fetchActivities={fetchActivities}
        />
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        className="cursor-pointer hover:bg-accent/40 transition-colors rounded-t-xl"
        onClick={() => setIsPreviewOpen(true)}
      >
        <CardTitle className="text-sm font-semibold">Recent Activity</CardTitle>
        <CardDescription className="text-xs">
          Click to view full history
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.slice(0, 2).map((activity) => (
            <div key={activity.id} className="flex items-start gap-2">
              <Avatar className="size-6">
                <AvatarFallback className="text-xs">
                  {getInitials(activity.description)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="truncate text-xs font-medium">
                  {activity.description}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
          {activities.length > 2 && (
            <p className="text-[11px] text-muted-foreground">
              +{activities.length - 2} more actions
            </p>
          )}
        </div>
      </CardContent>

      {/* Full activity history preview dialog */}
      <ActivityPreviewDialog
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        activities={activities}
        onActivityClick={handleActivityClick}
        selectedProperty={selectedProperty}
        isPropertyDialogOpen={isPropertyDialogOpen}
        setIsPropertyDialogOpen={setIsPropertyDialogOpen}
        fetchActivities={fetchActivities}
      />
    </Card>
  );
}

interface ActivityPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activities: ActivityLog[];
  onActivityClick: (activity: ActivityLog) => void;
  selectedProperty: any;
  isPropertyDialogOpen: boolean;
  setIsPropertyDialogOpen: (open: boolean) => void;
  fetchActivities: () => void;
}

function ActivityPreviewDialog({
  open,
  onOpenChange,
  activities,
  onActivityClick,
  selectedProperty,
  isPropertyDialogOpen,
  setIsPropertyDialogOpen,
  fetchActivities,
}: ActivityPreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Activity History</DialogTitle>
          <DialogDescription>
            Last activities across properties, tenants, invoices, and maintenance.
          </DialogDescription>
        </DialogHeader>

        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent activity.</p>
        ) : (
          <div className="relative mt-2">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
            <div className="space-y-4">
              {activities.map((activity) => {
                const isClickable =
                  !!activity.entityId &&
                  (activity.entityType === "property" ||
                    activity.entityType === "tenant" ||
                    activity.entityType === "maintenance_request" ||
                    activity.entityType === "invoice");

                return (
                  <div
                    key={activity.id}
                    className={`relative flex items-start gap-3 ${
                      isClickable
                        ? "cursor-pointer rounded-lg p-2 -m-2 transition-colors hover:bg-accent/50"
                        : ""
                    }`}
                    onClick={() => isClickable && onActivityClick(activity)}
                    role={isClickable ? "button" : undefined}
                    tabIndex={isClickable ? 0 : undefined}
                    onKeyDown={(e) => {
                      if (isClickable && (e.key === "Enter" || e.key === " ")) {
                        e.preventDefault();
                        onActivityClick(activity);
                      }
                    }}
                  >
                    <div className="relative z-10 flex items-center justify-center">
                      <div className="rounded-full bg-background border-2 border-border p-1">
                        {getActionIcon(activity.action, activity.entityType)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 pb-4">
                      <div className="flex items-start gap-2">
                        <Avatar className="size-6">
                          <AvatarFallback className="text-xs">
                            {getInitials(activity.description)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm leading-tight">
                            <span className="font-medium">{activity.description}</span>
                          </p>
                          <div className="mt-1 flex items-center gap-2">
                            <p className="text-xs font-light text-muted-foreground">
                              {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                            </p>
                            <span className="text-xs font-light text-muted-foreground">•</span>
                            <p className="text-xs font-light text-muted-foreground">
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
        )}

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
      </DialogContent>
    </Dialog>
  );
}

