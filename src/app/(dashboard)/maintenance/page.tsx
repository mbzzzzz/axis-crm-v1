"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus, Search, Clipboard, CheckCircle2, AlertCircle } from "lucide-react";
import { SortableMaintenanceCard } from "@/components/sortable-maintenance-card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/empty-state";
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

export default function MaintenancePage() {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProperty, setSelectedProperty] = useState<string>("all");
  const [selectedUrgency, setSelectedUrgency] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newRequest, setNewRequest] = useState({
    title: "",
    description: "",
    urgency: "medium" as "high" | "medium" | "low",
    location: "",
    propertyId: "",
    tenantName: "",
    tenantEmail: "",
    tenantPhone: "",
  });

  useEffect(() => {
    fetchRequests();
    fetchProperties();
  }, [selectedProperty, selectedUrgency]);

  const fetchProperties = async () => {
    try {
      // Fetch properties with tenant information
      const response = await fetch("/api/properties/with-tenants");
      const data = await response.json();
      setProperties(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch properties:", error);
      // Fallback to regular properties endpoint
      try {
        const fallbackResponse = await fetch("/api/properties");
        const fallbackData = await fallbackResponse.json();
        setProperties(Array.isArray(fallbackData) ? fallbackData : []);
      } catch (fallbackError) {
        console.error("Failed to fetch properties (fallback):", fallbackError);
      }
    }
  };

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      let url = "/api/maintenance?";
      if (selectedProperty !== "all") {
        url += `propertyId=${selectedProperty}&`;
      }
      if (selectedUrgency !== "all") {
        url += `urgency=${selectedUrgency}&`;
      }
      const response = await fetch(url);
      const data = await response.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch maintenance requests:", error);
      toast.error("Failed to load maintenance requests");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateDescription = async () => {
    if (!newRequest.title) {
      toast.error("Please enter a title first");
      return;
    }

    setIsGeneratingDescription(true);
    try {
      const selectedPropertyData = properties.find(
        (p) => p.id === parseInt(newRequest.propertyId)
      );

      const response = await fetch("/api/maintenance/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newRequest.title,
          urgency: newRequest.urgency,
          location: newRequest.location || selectedPropertyData?.address,
          propertyAddress: selectedPropertyData?.address,
          propertyType: selectedPropertyData?.propertyType,
          tenantName: selectedPropertyData?.tenant?.name,
          tenantEmail: selectedPropertyData?.tenant?.email,
          tenantPhone: selectedPropertyData?.tenant?.phone,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setNewRequest({ ...newRequest, description: data.description });
        toast.success("Description generated successfully");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to generate description");
      }
    } catch (error) {
      toast.error("Failed to generate description");
      console.error(error);
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  const handleCreateRequest = async () => {
    // Validate required fields
    if (!newRequest.propertyId) {
      toast.error("Please select a property");
      return;
    }

    if (!newRequest.title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    if (!newRequest.description.trim()) {
      toast.error("Please enter a description or use Auto Generate");
      return;
    }

    try {
      const selectedProperty = properties.find(
        (p) => p.id === parseInt(newRequest.propertyId)
      );
      
      // Build location: property address + specific location if provided
      let fullLocation = selectedProperty?.address || newRequest.location;
      if (selectedProperty?.address && newRequest.location && newRequest.location !== selectedProperty.address) {
        // If user added specific location, combine them
        fullLocation = `${selectedProperty.address}, ${newRequest.location}`;
      }
      
      // Build notes with tenant contact information if available
      let notes = "";
      if (selectedProperty?.tenant) {
        notes = `Tenant Contact Information:\n`;
        notes += `Name: ${selectedProperty.tenant.name}\n`;
        notes += `Email: ${selectedProperty.tenant.email}\n`;
        if (selectedProperty.tenant.phone) {
          notes += `Phone: ${selectedProperty.tenant.phone}\n`;
        }
      }

      const response = await fetch("/api/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newRequest.title,
          description: newRequest.description,
          urgency: newRequest.urgency,
          location: fullLocation,
          status: "open",
          propertyId: newRequest.propertyId || null,
          reportedDate: new Date().toISOString().split('T')[0],
          notes: notes || null,
        }),
      });

      if (response.ok) {
        toast.success("Maintenance request created successfully");
        setIsAddDialogOpen(false);
        setNewRequest({
          title: "",
          description: "",
          urgency: "medium",
          location: "",
          propertyId: "",
          tenantName: "",
          tenantEmail: "",
          tenantPhone: "",
        });
        fetchRequests();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to create request");
      }
    } catch (error) {
      toast.error("Failed to create maintenance request");
    }
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/maintenance?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        // Optimistically update the UI
        setRequests((prev) =>
          prev.map((req) =>
            req.id === id ? { ...req, status: newStatus as "open" | "in_progress" | "closed" } : req
          )
        );
        toast.success("Status updated successfully");
      } else {
        toast.error("Failed to update status");
        fetchRequests(); // Revert on error
      }
    } catch (error) {
      toast.error("Failed to update status");
      fetchRequests(); // Revert on error
    }
  };

  const updateTicketStatus = async (ticketId: number, newStatus: string) => {
    await handleStatusChange(ticketId, newStatus);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement before dragging starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id as number;
    const overId = over.id;

    // Find the request being dragged
    const activeRequest = requests.find((req) => req.id === activeId);
    if (!activeRequest) return;

    // Check if dropped on a column (status)
    const targetColumn = columns.find((col) => col.id === overId);
    if (targetColumn && targetColumn.status !== activeRequest.status) {
      updateTicketStatus(activeId, targetColumn.status);
      return;
    }

    // Check if dropped on another card
    const overRequest = requests.find((req) => req.id === overId);
    if (overRequest && overRequest.status !== activeRequest.status) {
      updateTicketStatus(activeId, overRequest.status);
      return;
    }
  };

  const getUrgencyColor = (urgency: string) => {
    const colors: Record<string, string> = {
      high: "bg-red-100 text-red-700",
      medium: "bg-orange-100 text-orange-700",
      low: "bg-blue-100 text-blue-700",
    };
    return colors[urgency.toLowerCase()] || "bg-gray-100 text-gray-700";
  };

  const formatUrgency = (urgency: string) => {
    return urgency.charAt(0).toUpperCase() + urgency.slice(1);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const columns = [
    { id: "open", title: "Open", status: "open" as const },
    { id: "in-progress", title: "In Progress", status: "in_progress" as const },
    { id: "closed", title: "Closed", status: "closed" as const },
  ];

  const getRequestsByStatus = (status: string) => {
    const filtered = requests.filter((req) => {
      const matchesStatus = req.status === status;
      const matchesSearch = searchQuery === "" || 
        req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (req.location && req.location.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesStatus && matchesSearch;
    });
    return filtered;
  };

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Maintenance Requests</h1>
          <p className="text-muted-foreground">Track and manage all maintenance issues.</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 size-4" />
              New Request
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Maintenance Request</DialogTitle>
              <DialogDescription>
                Add a new maintenance request to track
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newRequest.title}
                  onChange={(e) => setNewRequest({ ...newRequest, title: e.target.value })}
                  placeholder="e.g., Leaky Faucet in Apt 4B"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="description">Description</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateDescription}
                    disabled={isGeneratingDescription || !newRequest.title}
                    className="text-xs"
                  >
                    {isGeneratingDescription ? "Generating..." : "✨ Auto Generate"}
                  </Button>
                </div>
                <Textarea
                  id="description"
                  value={newRequest.description}
                  onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
                  placeholder="Describe the issue or click 'Auto Generate' to create one using AI"
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="urgency">Urgency</Label>
                <Select
                  value={newRequest.urgency}
                  onValueChange={(value: "high" | "medium" | "low") =>
                    setNewRequest({ ...newRequest, urgency: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="propertyId">Select Property *</Label>
                <Select
                  value={newRequest.propertyId}
                  onValueChange={(value) => {
                    const property = properties.find((p) => p.id === parseInt(value));
                    if (property) {
                      // Auto-fill property address and tenant information
                      setNewRequest({
                        ...newRequest,
                        propertyId: value,
                        location: property.address || newRequest.location,
                        tenantName: property.tenant?.name || "",
                        tenantEmail: property.tenant?.email || "",
                        tenantPhone: property.tenant?.phone || "",
                      });
                    } else {
                      // Clear tenant info if no property selected
                      setNewRequest({
                        ...newRequest,
                        propertyId: value,
                        tenantName: "",
                        tenantEmail: "",
                        tenantPhone: "",
                      });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a property from your listings" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.length === 0 ? (
                      <SelectItem value="" disabled>No properties available. Create a property first.</SelectItem>
                    ) : (
                      properties.map((property) => (
                        <SelectItem key={property.id} value={property.id.toString()}>
                          {property.title} - {property.address}
                          {property.tenant && ` (${property.tenant.name})`}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {newRequest.propertyId && (() => {
                  const selectedProperty = properties.find((p) => p.id === parseInt(newRequest.propertyId));
                  return selectedProperty?.tenant ? (
                    <p className="text-xs text-muted-foreground">
                      ✓ Tenant: {selectedProperty.tenant.name} ({selectedProperty.tenant.email})
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      ℹ No active tenant for this property
                    </p>
                  );
                })()}
              </div>

              {/* Auto-filled Property Information */}
              {newRequest.propertyId && (() => {
                const selectedProperty = properties.find((p) => p.id === parseInt(newRequest.propertyId));
                if (!selectedProperty) return null;
                
                return (
                  <div className="rounded-lg border bg-muted/50 p-3 space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">Property Information</div>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Address:</span>
                        <span>{selectedProperty.address}</span>
                      </div>
                      {selectedProperty.city && selectedProperty.state && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Location:</span>
                          <span>{selectedProperty.city}, {selectedProperty.state}</span>
                        </div>
                      )}
                      {selectedProperty.tenant && (
                        <>
                          <div className="pt-2 border-t">
                            <div className="font-medium text-muted-foreground mb-1">Tenant Information</div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Name:</span>
                              <span>{selectedProperty.tenant.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Email:</span>
                              <span>{selectedProperty.tenant.email}</span>
                            </div>
                            {selectedProperty.tenant.phone && (
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Phone:</span>
                                <span>{selectedProperty.tenant.phone}</span>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })()}

              <div className="space-y-2">
                <Label htmlFor="location">Specific Location/Room</Label>
                <Input
                  id="location"
                  value={newRequest.location}
                  onChange={(e) => setNewRequest({ ...newRequest, location: e.target.value })}
                  placeholder={newRequest.propertyId ? "e.g., Kitchen, Bathroom, Unit 4B" : "e.g., 123 Main St, Kitchen"}
                />
                <p className="text-xs text-muted-foreground">
                  {newRequest.propertyId 
                    ? "Property address auto-filled. Add specific room/area details here."
                    : "Enter full address or specific location/room"}
                </p>
              </div>
              <Button onClick={handleCreateRequest} className="w-full">
                Create Request
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search requests..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={selectedProperty} onValueChange={setSelectedProperty}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Properties" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Properties</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedUrgency} onValueChange={setSelectedUrgency}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Any Urgency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any Urgency</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Kanban Board */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
            {columns.map((column) => {
              const columnRequests = getRequestsByStatus(column.status);
              const columnIcon =
                column.status === "open"
                  ? AlertCircle
                  : column.status === "in_progress"
                  ? Clipboard
                  : CheckCircle2;
              const columnDescription =
                column.status === "open"
                  ? "New maintenance requests that need attention"
                  : column.status === "in_progress"
                  ? "Requests currently being worked on"
                  : "Completed maintenance requests";

              return (
                <Card key={column.id} className="flex flex-col" id={column.id}>
                  <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">{column.title}</CardTitle>
                      <Badge variant="outline">{columnRequests.length}</Badge>
                    </div>
                    <Button variant="ghost" size="sm">⋯</Button>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-3 overflow-y-auto max-h-[600px]">
                    <SortableContext
                      items={columnRequests.map((req) => req.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {columnRequests.map((request) => (
                        <SortableMaintenanceCard
                          key={request.id}
                          request={request}
                          getUrgencyColor={getUrgencyColor}
                          formatUrgency={formatUrgency}
                          formatDate={formatDate}
                        />
                      ))}
                    </SortableContext>
                    {columnRequests.length === 0 && (
                      <EmptyState
                        icon={columnIcon}
                        title={`No ${column.title.toLowerCase()} requests`}
                        description={columnDescription}
                      />
                    )}
                  </CardContent>
                </Card>
              );
            })}
            <Card className="flex items-center justify-center border-dashed">
              <Button variant="ghost" className="flex flex-col h-full w-full">
                <Plus className="size-6 mb-2" />
                <span>Add Column</span>
              </Button>
            </Card>
          </div>
        </DndContext>
      )}
    </div>
  );
}

