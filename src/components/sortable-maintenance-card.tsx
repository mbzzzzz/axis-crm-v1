"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MaintenanceRequest {
  id: number;
  title: string;
  description: string;
  urgency: "high" | "medium" | "low";
  location: string;
  reportedDate: string;
  status: "open" | "in_progress" | "closed";
  propertyId?: number;
}

interface SortableMaintenanceCardProps {
  request: MaintenanceRequest;
  getUrgencyColor: (urgency: string) => string;
  formatUrgency: (urgency: string) => string;
  formatDate: (dateString: string) => string;
  onStatusChange?: (newStatus: string) => void;
  availableStatuses?: string[];
}

const statusLabels: Record<string, string> = {
  open: "Open",
  in_progress: "In Progress",
  closed: "Closed",
};

export function SortableMaintenanceCard({
  request,
  getUrgencyColor,
  formatUrgency,
  formatDate,
  onStatusChange,
  availableStatuses = [],
}: SortableMaintenanceCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: request.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleMoveToStatus = (newStatus: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    if (onStatusChange) {
      onStatusChange(newStatus);
    }
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 font-semibold text-sm">
              {request.title}
            </div>
            {onStatusChange && availableStatuses.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                    }}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <MoreVertical className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {availableStatuses.map((status) => (
                    <DropdownMenuItem
                      key={status}
                      onClick={(e) => handleMoveToStatus(status, e)}
                    >
                      <ArrowRight className="mr-2 size-4" />
                      Move to {statusLabels[status] || status}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {request.description}
          </p>
          <div className="flex items-center justify-between pt-2">
            <Badge className={getUrgencyColor(request.urgency)}>
              {formatUrgency(request.urgency)}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground pt-1 space-y-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="truncate" title={request.location || "N/A"}>
                    {request.location || "N/A"}
                  </div>
                </TooltipTrigger>
                {request.location && request.location.length > 30 && (
                  <TooltipContent>
                    <p>{request.location}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
            <div>{formatDate(request.reportedDate)}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

