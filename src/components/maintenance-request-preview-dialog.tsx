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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, MapPin, Calendar, AlertCircle, Wrench, DollarSign, Mail, Loader2 } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { toast } from "sonner";

interface MaintenanceRequest {
  id: number;
  title: string;
  description: string;
  urgency: "high" | "medium" | "low";
  location: string;
  reportedDate: string;
  completedDate?: string;
  status: "open" | "in_progress" | "closed";
  cost?: number;
  notes?: string;
  propertyId?: number;
  property?: {
    id: number;
    address: string;
    city?: string;
    state?: string;
    zipCode?: string;
    title?: string;
  };
}

interface MaintenanceRequestPreviewDialogProps {
  requestId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange?: (requestId: number, newStatus: string) => void;
  onRefresh?: () => void;
}

export function MaintenanceRequestPreviewDialog({
  requestId,
  open,
  onOpenChange,
  onStatusChange,
  onRefresh,
}: MaintenanceRequestPreviewDialogProps) {
  const [request, setRequest] = useState<MaintenanceRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [workerEmail, setWorkerEmail] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    if (open && requestId) {
      fetchRequestDetails();
    }
  }, [open, requestId]);

  const fetchRequestDetails = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/maintenance?id=${requestId}`);
      if (response.ok) {
        const data = await response.json();
        // Fetch property details if propertyId exists
        if (data.propertyId) {
          try {
            const propertyResponse = await fetch(`/api/properties?id=${data.propertyId}`);
            if (propertyResponse.ok) {
              const property = await propertyResponse.json();
              setRequest({ ...data, property });
            } else {
              setRequest(data);
            }
          } catch (error) {
            console.error("Failed to fetch property:", error);
            setRequest(data);
          }
        } else {
          setRequest(data);
        }
      }
    } catch (error) {
      console.error("Failed to fetch maintenance request:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      open: "destructive",
      in_progress: "default",
      closed: "secondary",
    };
    return (
      <Badge variant={variants[status] || "default"} className="capitalize">
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const getUrgencyBadge = (urgency: string) => {
    const colors: Record<string, string> = {
      high: "bg-red-500 hover:bg-red-600",
      medium: "bg-yellow-500 hover:bg-yellow-600",
      low: "bg-blue-500 hover:bg-blue-600",
    };
    return (
      <Badge className={`${colors[urgency] || "bg-gray-500"} text-white capitalize`}>
        {urgency}
      </Badge>
    );
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!request) return;
    
    setIsUpdatingStatus(true);
    try {
      const response = await fetch(`/api/maintenance?id=${request.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: newStatus,
          ...(newStatus === "closed" && !request.completedDate ? { completedDate: new Date().toISOString().split('T')[0] } : {})
        }),
      });

      if (response.ok) {
        toast.success(`Status updated to ${newStatus.replace("_", " ")}`);
        if (onStatusChange) {
          onStatusChange(request.id, newStatus);
        }
        // Refresh the request data
        fetchRequestDetails();
        if (onRefresh) {
          onRefresh();
        }
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update status");
      }
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error("Failed to update status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSendEmail = async () => {
    if (!request || !workerEmail.trim()) {
      toast.error("Please enter a valid email address");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(workerEmail.trim())) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsSendingEmail(true);
    try {
      const response = await fetch("/api/maintenance/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: request.id,
          to: workerEmail.trim(),
        }),
      });

      if (response.ok) {
        toast.success(`Maintenance request sent to ${workerEmail.trim()}`);
        setWorkerEmail("");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to send email");
      }
    } catch (error) {
      console.error("Failed to send email:", error);
      toast.error("Failed to send email");
    } finally {
      setIsSendingEmail(false);
    }
  };

  const getAvailableStatuses = () => {
    if (!request) return [];
    const allStatuses = ["open", "in_progress", "closed"];
    return allStatuses.filter((s) => s !== request.status);
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
        ) : request ? (
          <>
            <DialogHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <DialogTitle className="text-xl">{request.title}</DialogTitle>
                  <DialogDescription className="mt-2 flex items-center gap-2">
                    {getStatusBadge(request.status)}
                    {getUrgencyBadge(request.urgency)}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-6 mt-4">
              {/* Property Information */}
              {request.property && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Building2 className="size-4" />
                      Property Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-start gap-2">
                      <MapPin className="size-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium">{request.property.title || request.property.address}</p>
                        <p className="text-sm text-muted-foreground">
                          {request.property.address}
                          {request.property.city && `, ${request.property.city}`}
                          {request.property.state && ` ${request.property.state}`}
                          {request.property.zipCode && ` ${request.property.zipCode}`}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Request Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Wrench className="size-4" />
                    Request Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-1">Description</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {request.description}
                    </p>
                  </div>

                  {request.location && (
                    <div>
                      <p className="text-sm font-medium mb-1">Location</p>
                      <p className="text-sm text-muted-foreground">{request.location}</p>
                    </div>
                  )}

                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium mb-1 flex items-center gap-2">
                        <Calendar className="size-4" />
                        Reported Date
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(request.reportedDate), "PPP")}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(request.reportedDate), { addSuffix: true })}
                      </p>
                    </div>

                    {request.completedDate && (
                      <div>
                        <p className="text-sm font-medium mb-1 flex items-center gap-2">
                          <Calendar className="size-4" />
                          Completed Date
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(request.completedDate), "PPP")}
                        </p>
                      </div>
                    )}

                    {request.cost !== null && request.cost !== undefined && (
                      <div>
                        <p className="text-sm font-medium mb-1 flex items-center gap-2">
                          <DollarSign className="size-4" />
                          Cost
                        </p>
                        <p className="text-sm text-muted-foreground">
                          ${request.cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              {request.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertCircle className="size-4" />
                      Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {request.notes}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Status Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Status Change Buttons */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Change Status</Label>
                    <div className="flex flex-wrap gap-2">
                      {getAvailableStatuses().map((status) => (
                        <Button
                          key={status}
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(status)}
                          disabled={isUpdatingStatus}
                        >
                          {isUpdatingStatus ? (
                            <Loader2 className="mr-2 size-4 animate-spin" />
                          ) : null}
                          Move to {status.replace("_", " ")}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Send Email */}
                  <div className="space-y-2">
                    <Label htmlFor="worker-email" className="text-sm font-medium">
                      Send to Worker/Handler
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="worker-email"
                        type="email"
                        placeholder="worker@example.com"
                        value={workerEmail}
                        onChange={(e) => setWorkerEmail(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !isSendingEmail) {
                            handleSendEmail();
                          }
                        }}
                      />
                      <Button
                        onClick={handleSendEmail}
                        disabled={isSendingEmail || !workerEmail.trim()}
                      >
                        {isSendingEmail ? (
                          <>
                            <Loader2 className="mr-2 size-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Mail className="mr-2 size-4" />
                            Send
                          </>
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Send this maintenance request to a worker or handler via email
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Failed to load maintenance request details</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

