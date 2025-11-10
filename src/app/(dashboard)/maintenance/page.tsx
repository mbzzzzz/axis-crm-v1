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
import { Plus, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
  const [isLoading, setIsLoading] = useState(true);
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
  });

  useEffect(() => {
    fetchRequests();
  }, [selectedProperty, selectedUrgency]);

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

  const handleCreateRequest = async () => {
    try {
      const response = await fetch("/api/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newRequest.title,
          description: newRequest.description,
          urgency: newRequest.urgency,
          location: newRequest.location,
          status: "open",
          propertyId: newRequest.propertyId || null,
          reportedDate: new Date().toISOString().split('T')[0],
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
        toast.success("Status updated successfully");
        fetchRequests();
      } else {
        toast.error("Failed to update status");
      }
    } catch (error) {
      toast.error("Failed to update status");
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
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newRequest.description}
                  onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
                  placeholder="Describe the issue..."
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
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={newRequest.location}
                  onChange={(e) => setNewRequest({ ...newRequest, location: e.target.value })}
                  placeholder="e.g., The Grand Plaza"
                />
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
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
          {columns.map((column) => {
            const columnRequests = getRequestsByStatus(column.status);
            return (
              <Card key={column.id} className="flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">{column.title}</CardTitle>
                    <Badge variant="outline">{columnRequests.length}</Badge>
                  </div>
                  <Button variant="ghost" size="sm">⋯</Button>
                </CardHeader>
                <CardContent className="flex-1 space-y-3 overflow-y-auto max-h-[600px]">
                  {columnRequests.map((request) => (
                    <Card
                      key={request.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => {
                        // Cycle through statuses on click
                        const statusOrder = ["open", "in_progress", "closed"];
                        const currentIndex = statusOrder.indexOf(request.status);
                        const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];
                        handleStatusChange(request.id, nextStatus);
                      }}
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
                        <div className="text-xs text-muted-foreground pt-1">
                          <div>{request.location || "N/A"}</div>
                          <div>{formatDate(request.reportedDate)}</div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {columnRequests.length === 0 && (
                    <div className="text-sm text-muted-foreground text-center py-8">
                      No {column.title.toLowerCase()} requests
                    </div>
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
      )}
    </div>
  );
}

