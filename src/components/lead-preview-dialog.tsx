"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { 
  Building2, 
  MapPin, 
  Calendar, 
  Phone, 
  Mail, 
  DollarSign, 
  User, 
  MessageSquare,
  ArrowRight,
  Loader2,
  FileText
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { toast } from "sonner";

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
  property?: {
    id: number;
    title?: string;
    address: string;
    city?: string;
    state?: string;
    zipCode?: string;
    price?: number;
  };
}

interface LeadPreviewDialogProps {
  leadId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange?: (leadId: number, newStatus: Lead["status"]) => void;
  onRefresh?: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  inquiry: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  viewing: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  application: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  signed: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  archived: "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300",
};

const STATUS_LABELS: Record<string, string> = {
  inquiry: "Inquiry",
  viewing: "Viewing",
  application: "Application",
  signed: "Signed",
  archived: "Archived",
};

const SOURCE_LABELS: Record<string, string> = {
  zameen: "Zameen",
  olx: "OLX",
  referral: "Referral",
  website: "Website",
  other: "Other",
  bayut: "Bayut",
  propertyfinder: "Property Finder",
  dubizzle: "Dubizzle",
  propsearch: "PropSearch",
  zillow: "Zillow",
  realtor: "Realtor.com",
};

const STATUS_FLOW: Lead["status"][] = ["inquiry", "viewing", "application", "signed"];

export function LeadPreviewDialog({
  leadId,
  open,
  onOpenChange,
  onStatusChange,
  onRefresh,
}: LeadPreviewDialogProps) {
  const [lead, setLead] = useState<Lead | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    if (open && leadId) {
      fetchLeadDetails();
    }
  }, [open, leadId]);

  const fetchLeadDetails = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/leads?id=${leadId}`);
      if (response.ok) {
        const data = await response.json();
        // Fetch property details if propertyId exists
        if (data.propertyId) {
          try {
            const propertyResponse = await fetch(`/api/properties?id=${data.propertyId}`);
            if (propertyResponse.ok) {
              const propertyData = await propertyResponse.json();
              const property = Array.isArray(propertyData) ? propertyData[0] : propertyData;
              setLead({ ...data, property });
            } else {
              setLead(data);
            }
          } catch (error) {
            console.error("Failed to fetch property:", error);
            setLead(data);
          }
        } else {
          setLead(data);
        }
      } else {
        toast.error("Failed to load lead details");
      }
    } catch (error) {
      console.error("Failed to fetch lead:", error);
      toast.error("Failed to load lead details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: Lead["status"]) => {
    if (!lead) return;

    setIsUpdatingStatus(true);
    try {
      const response = await fetch(`/api/leads?id=${lead.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        const updatedLead = await response.json();
        setLead(updatedLead);
        toast.success(`Lead moved to ${STATUS_LABELS[newStatus]}`);
        
        if (onStatusChange) {
          onStatusChange(lead.id, newStatus);
        }
        
        if (onRefresh) {
          onRefresh();
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to update lead status");
      }
    } catch (error) {
      console.error("Failed to update lead status:", error);
      toast.error("Failed to update lead status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getNextStatus = (): Lead["status"] | null => {
    if (!lead) return null;
    const currentIndex = STATUS_FLOW.indexOf(lead.status);
    if (currentIndex < STATUS_FLOW.length - 1) {
      return STATUS_FLOW[currentIndex + 1];
    }
    return null;
  };

  const getPreviousStatus = (): Lead["status"] | null => {
    if (!lead) return null;
    const currentIndex = STATUS_FLOW.indexOf(lead.status);
    if (currentIndex > 0) {
      return STATUS_FLOW[currentIndex - 1];
    }
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : lead ? (
          <>
            <DialogHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <DialogTitle className="text-xl flex items-center gap-2">
                    <User className="size-5" />
                    {lead.name}
                  </DialogTitle>
                  <DialogDescription className="mt-2 flex items-center gap-2">
                    <Badge className={STATUS_COLORS[lead.status]}>
                      {STATUS_LABELS[lead.status]}
                    </Badge>
                    <Badge variant="outline">
                      {SOURCE_LABELS[lead.source] || lead.source}
                    </Badge>
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-6 mt-4">
              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Phone className="size-4" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Phone className="size-4 text-muted-foreground" />
                    <a
                      href={`tel:${lead.phone}`}
                      className="text-sm font-medium hover:text-primary transition-colors"
                    >
                      {lead.phone}
                    </a>
                  </div>
                  {lead.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="size-4 text-muted-foreground" />
                      <a
                        href={`mailto:${lead.email}`}
                        className="text-sm font-medium hover:text-primary transition-colors break-all"
                      >
                        {lead.email}
                      </a>
                    </div>
                  )}
                  {lead.preferredLocation && (
                    <div className="flex items-center gap-3">
                      <MapPin className="size-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {lead.preferredLocation}
                      </span>
                    </div>
                  )}
                  {lead.budget && (
                    <div className="flex items-center gap-3">
                      <DollarSign className="size-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {lead.budget.toLocaleString()} PKR
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Property Information */}
              {lead.property && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Building2 className="size-4" />
                      Property Inquiry
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-start gap-2">
                      <MapPin className="size-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium">
                          {lead.property.title || lead.property.address}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {lead.property.address}
                          {lead.property.city && `, ${lead.property.city}`}
                          {lead.property.state && ` ${lead.property.state}`}
                          {lead.property.zipCode && ` ${lead.property.zipCode}`}
                        </p>
                        {lead.property.price && (
                          <p className="text-sm font-medium mt-1">
                            {lead.property.price.toLocaleString()} PKR
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Lead Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="size-4" />
                    Lead Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium mb-1 flex items-center gap-2">
                        <Calendar className="size-4" />
                        Created
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(lead.createdAt), "PPP")}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-1 flex items-center gap-2">
                        <Calendar className="size-4" />
                        Last Updated
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(lead.updatedAt), "PPP")}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(lead.updatedAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              {lead.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <MessageSquare className="size-4" />
                      Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {lead.notes}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Status Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Move Lead</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Next Stage Button */}
                  {getNextStatus() && (
                    <Button
                      className="w-full"
                      onClick={() => handleStatusChange(getNextStatus()!)}
                      disabled={isUpdatingStatus}
                    >
                      {isUpdatingStatus ? (
                        <>
                          <Loader2 className="mr-2 size-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          Move to {STATUS_LABELS[getNextStatus()!]}
                          <ArrowRight className="ml-2 size-4" />
                        </>
                      )}
                    </Button>
                  )}

                  {/* Previous Stage Button */}
                  {getPreviousStatus() && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => handleStatusChange(getPreviousStatus()!)}
                      disabled={isUpdatingStatus}
                    >
                      Move back to {STATUS_LABELS[getPreviousStatus()!]}
                    </Button>
                  )}

                  {/* Status is at the end */}
                  {!getNextStatus() && (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      Lead has reached the final stage
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Lead not found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

