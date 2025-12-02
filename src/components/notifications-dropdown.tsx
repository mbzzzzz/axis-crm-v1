"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { MaintenanceRequestPreviewDialog } from "./maintenance-request-preview-dialog";

interface MaintenanceRequest {
  id: number;
  title: string;
  description: string;
  urgency: "high" | "medium" | "low";
  location: string;
  reportedDate: string;
  status: "open" | "in_progress" | "closed";
  propertyId?: number;
  property?: {
    id: number;
    address: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
}

export function NotificationsDropdown() {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    fetchMaintenanceRequests();
    // Refresh every 30 seconds
    const interval = setInterval(fetchMaintenanceRequests, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchMaintenanceRequests = async () => {
    try {
      const response = await fetch("/api/maintenance?status=open&limit=10&includeProperty=true");
      if (response.ok) {
        const data = await response.json();
        setRequests(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Failed to fetch maintenance requests:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "high":
        return "bg-red-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  const handleRequestClick = (request: MaintenanceRequest) => {
    setSelectedRequest(request);
    setIsPreviewOpen(true);
  };

  const openRequests = requests.filter((r) => r.status === "open" || r.status === "in_progress");
  const unreadCount = openRequests.length;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="relative rounded-full p-1.5 sm:p-2 hover:bg-muted transition-colors"
            aria-label="Notifications"
          >
            <Bell className="size-4 sm:size-5" />
            {unreadCount > 0 && (
              <span className="absolute right-0.5 sm:right-1 top-0.5 sm:top-1 size-1.5 sm:size-2 rounded-full bg-red-500" />
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80 sm:w-96">
          <DropdownMenuLabel className="flex items-center justify-between">
            <span>Maintenance Requests</span>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : openRequests.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground text-center">
                No pending maintenance requests
              </div>
            ) : (
              openRequests.map((request) => (
                <DropdownMenuItem
                  key={request.id}
                  className="flex flex-col items-start p-3 cursor-pointer"
                  onClick={() => handleRequestClick(request)}
                >
                  <div className="flex items-start justify-between w-full gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1">{request.title}</p>
                      {request.property && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          {request.property.address}
                          {request.property.city && `, ${request.property.city}`}
                          {request.property.state && ` ${request.property.state}`}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(request.reportedDate), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`size-2 rounded-full ${getUrgencyColor(request.urgency)}`}
                        title={request.urgency}
                      />
                    </div>
                  </div>
                </DropdownMenuItem>
              ))
            )}
          </div>
          {openRequests.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-center justify-center cursor-pointer"
                onClick={() => (window.location.href = "/maintenance")}
              >
                View All Requests
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {selectedRequest && (
        <MaintenanceRequestPreviewDialog
          requestId={selectedRequest.id}
          open={isPreviewOpen}
          onOpenChange={setIsPreviewOpen}
        />
      )}
    </>
  );
}

