"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MoreVertical, ArrowRight, Phone, Mail, Edit, Trash2, UserPlus } from "lucide-react";

interface Lead {
  id: number;
  name: string;
  phone: string;
  email?: string;
  budget?: number;
  preferredLocation?: string;
  source: string;
  status: "inquiry" | "viewing" | "application" | "signed" | "archived";
  notes?: string;
  propertyId?: number;
  createdAt: string;
  updatedAt: string;
}

interface SortableLeadCardProps {
  lead: Lead;
  onEdit: (lead: Lead) => void;
  onDelete: (id: number) => void;
  onConvert: (lead: Lead) => void;
  onStatusChange?: (newStatus: string) => void;
  availableStatuses?: string[];
  statusColors: Record<string, string>;
  statusLabels: Record<string, string>;
  sourceLabels: Record<string, string>;
}

const STATUS_LABELS_INTERNAL: Record<string, string> = {
  inquiry: "Inquiry",
  viewing: "Viewing",
  application: "Application",
  signed: "Signed",
  archived: "Archived",
};

export function SortableLeadCard({
  lead,
  onEdit,
  onDelete,
  onConvert,
  onStatusChange,
  availableStatuses = [],
  statusColors,
  statusLabels,
  sourceLabels,
}: SortableLeadCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleMoveToStatus = (newStatus: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onStatusChange) {
      onStatusChange(newStatus);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate">{lead.name}</h3>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <a
                  href={`tel:${lead.phone}`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 hover:text-primary transition-colors"
                >
                  <Phone className="size-3" />
                  <span className="truncate">{lead.phone}</span>
                </a>
              </div>
              {lead.email && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <a
                    href={`mailto:${lead.email}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 hover:text-primary transition-colors truncate"
                  >
                    <Mail className="size-3 shrink-0" />
                    <span className="truncate">{lead.email}</span>
                  </a>
                </div>
              )}
            </div>
            {onStatusChange && availableStatuses.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                    }}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <MoreVertical className="size-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {availableStatuses.map((status) => (
                    <DropdownMenuItem
                      key={status}
                      onClick={(e) => handleMoveToStatus(status, e)}
                    >
                      <ArrowRight className="mr-2 size-4" />
                      Move to {STATUS_LABELS_INTERNAL[status] || status}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(lead);
                    }}
                  >
                    <Edit className="mr-2 size-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(lead.id);
                    }}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 size-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {lead.budget && (
            <div className="flex items-center gap-1 text-xs font-medium">
              <span className="text-muted-foreground">Budget:</span>
              <span>{formatCurrency(lead.budget)}</span>
            </div>
          )}

          {lead.preferredLocation && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span className="truncate">{lead.preferredLocation}</span>
                  </div>
                </TooltipTrigger>
                {lead.preferredLocation.length > 30 && (
                  <TooltipContent>
                    <p>{lead.preferredLocation}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          )}

          <div className="flex items-center justify-between pt-2">
            <Badge className={statusColors[lead.status] || "bg-gray-100 text-gray-700"}>
              {statusLabels[lead.status] || lead.status}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {sourceLabels[lead.source] || lead.source}
            </Badge>
          </div>

          <div className="text-xs text-muted-foreground pt-1">
            {formatDate(lead.createdAt)}
          </div>

          {lead.status !== "signed" && lead.status !== "archived" && (
            <Button
              size="sm"
              variant="outline"
              className="w-full mt-2"
              onClick={(e) => {
                e.stopPropagation();
                onConvert(lead);
              }}
            >
              <UserPlus className="mr-2 size-3" />
              Convert to Tenant
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

