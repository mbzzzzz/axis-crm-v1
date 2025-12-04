"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { TenantHeader } from "@/components/tenant-portal/tenant-header";
import { Plus, Wrench, Clock, CheckCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface MaintenanceRequest {
  id: number;
  title: string;
  description: string;
  status: string;
  urgency: string;
  reportedDate: string;
  completedDate?: string;
}

export default function TenantMaintenancePage() {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    urgency: "medium",
  });
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("tenant_token");

      if (!token) {
        return;
      }

      // First, fetch tenant data to get tenant ID
      const tenantRes = await fetch("/api/auth/tenant/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!tenantRes.ok) {
        throw new Error("Failed to fetch tenant data");
      }

      const tenantData = await tenantRes.json();
      const tenantId = tenantData.tenant.id;

      const response = await fetch(`/api/maintenance/mobile?tenantId=${tenantId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setRequests(Array.isArray(data) ? data : []);
        // If empty array, that's fine - tenant just has no requests yet
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Maintenance API error:", response.status, errorData);
        // Don't show error if tenant has no property or no requests - that's expected
        if (errorData.code !== 'NO_PROPERTY' && response.status !== 200) {
          toast.error(errorData.error || `Failed to load maintenance requests (${response.status})`);
        }
        setRequests([]); // Set empty array on error so UI shows "no requests" message
      }
    } catch (error) {
      console.error("Error fetching maintenance requests:", error);
      toast.error("Failed to load maintenance requests. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateDescription = async () => {
    if (!formData.title) {
      toast.error("Please enter a title first");
      return;
    }

    const token = localStorage.getItem("tenant_token");
    if (!token) {
      toast.error("Not authenticated");
      return;
    }

    setIsGeneratingDescription(true);
    try {
      const response = await fetch("/api/maintenance/generate-description/tenant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formData.title,
          urgency: formData.urgency,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.description) {
          setFormData({ ...formData, description: data.description });
          toast.success("Description generated successfully");
        } else {
          toast.error("No description generated. Please try again.");
        }
      } else {
        const error = await response.json().catch(() => ({}));
        console.error("Generate description API error:", response.status, error);
        toast.error(error.error || `Failed to generate description (${response.status})`);
      }
    } catch (error) {
      console.error("Error generating description:", error);
      toast.error("Failed to generate description. Please check your connection and try again.");
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("tenant_token");

    if (!token) {
      toast.error("Not authenticated");
      return;
    }

    try {
      const response = await fetch("/api/maintenance/mobile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          urgency: formData.urgency,
        }),
      });

      if (response.ok) {
        toast.success("Maintenance request submitted");
        setIsDialogOpen(false);
        setFormData({ title: "", description: "", urgency: "medium" });
        fetchRequests();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to submit request");
      }
    } catch (error) {
      console.error("Error submitting request:", error);
      toast.error("Failed to submit maintenance request");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      open: "bg-blue-100 text-blue-700",
      in_progress: "bg-yellow-100 text-yellow-700",
      closed: "bg-green-100 text-green-700",
    };
    return (
      <Badge className={statusColors[status] || statusColors.open}>
        {status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
      </Badge>
    );
  };

  const getUrgencyBadge = (urgency: string) => {
    const urgencyColors: Record<string, string> = {
      high: "bg-red-100 text-red-700",
      medium: "bg-yellow-100 text-yellow-700",
      low: "bg-green-100 text-green-700",
    };
    return (
      <Badge className={urgencyColors[urgency] || urgencyColors.medium}>
        {urgency.charAt(0).toUpperCase() + urgency.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <TenantHeader />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Maintenance Requests</h1>
              <p className="text-muted-foreground mt-2">Submit and track maintenance requests</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 size-4" />
                  Submit Request
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Submit Maintenance Request</DialogTitle>
                  <DialogDescription>
                    Describe the issue that needs attention
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., Leaky faucet in kitchen"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="description">Description *</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleGenerateDescription}
                        disabled={isGeneratingDescription || !formData.title}
                        className="gap-2"
                      >
                        <Sparkles className="size-4" />
                        {isGeneratingDescription ? "Generating..." : "Auto Generate"}
                      </Button>
                    </div>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Provide details about the issue..."
                      rows={4}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="urgency">Urgency</Label>
                    <select
                      id="urgency"
                      value={formData.urgency}
                      onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Submit Request</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {isLoading ? (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : requests.length === 0 ? (
            <Card className="flex min-h-[400px] items-center justify-center">
              <CardContent className="text-center">
                <Wrench className="mx-auto size-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No maintenance requests</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Submit a request if you need maintenance work done
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <Card key={request.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{request.title}</h3>
                          {getStatusBadge(request.status)}
                          {getUrgencyBadge(request.urgency)}
                        </div>
                        <p className="text-sm text-muted-foreground">{request.description}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="size-4" />
                            Reported: {new Date(request.reportedDate).toLocaleDateString()}
                          </div>
                          {request.completedDate && (
                            <div className="flex items-center gap-1">
                              <CheckCircle className="size-4" />
                              Completed: {new Date(request.completedDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

