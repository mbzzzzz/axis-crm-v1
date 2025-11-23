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
}

export function SortableMaintenanceCard({
  request,
  getUrgencyColor,
  formatUrgency,
  formatDate,
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

  return (
    <div ref={setNodeRef} style={style}>
      <Card
        className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
        {...attributes}
        {...listeners}
      >
        <CardContent className="p-4 space-y-2">
          <div className="font-semibold text-sm">{request.title}</div>
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

