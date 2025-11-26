"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Phone, Mail, MapPin, DollarSign, UserPlus, Edit, Trash2, ArrowRight, MessageSquare, Calendar, Download, Upload } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableLeadCard } from "@/components/sortable-lead-card";
import { DroppableColumn } from "@/components/droppable-column";
import { EmptyState } from "@/components/empty-state";
import { logActivity } from "@/lib/audit-log";
import { ImportExportDialog } from "@/components/import-export-dialog";

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

const STATUS_COLORS: Record<string, string> = {
  inquiry: "bg-blue-100 text-blue-700",
  viewing: "bg-yellow-100 text-yellow-700",
  application: "bg-orange-100 text-orange-700",
  signed: "bg-green-100 text-green-700",
  archived: "bg-gray-100 text-gray-700",
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
};

function LeadsPageContent() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedSource, setSelectedSource] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isConvertDialogOpen, setIsConvertDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [newLead, setNewLead] = useState({
    name: "",
    phone: "",
    email: "",
    budget: "",
    preferredLocation: "",
    source: "zameen",
    status: "inquiry" as const,
    notes: "",
    propertyId: "",
  });

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const response = await fetch("/api/properties?limit=100");
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to fetch properties" }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setProperties(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch properties:", error);
      setProperties([]);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [selectedStatus, selectedSource]);

  const fetchLeads = async () => {
    try {
      setIsLoading(true);
      let url = "/api/leads?";
      if (selectedStatus !== "all") {
        url += `status=${selectedStatus}&`;
      }
      if (selectedSource !== "all") {
        url += `source=${selectedSource}&`;
      }
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to fetch leads" }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setLeads(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch leads:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to load leads";
      toast.error(errorMessage);
      setLeads([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateLead = async () => {
    if (!newLead.name.trim() || !newLead.phone.trim()) {
      toast.error("Name and phone are required");
      return;
    }

    // Validate phone format (basic)
    const phoneRegex = /^[\d\s\+\-\(\)]+$/;
    if (!phoneRegex.test(newLead.phone)) {
      toast.error("Please enter a valid phone number");
      return;
    }

    // Validate email if provided
    if (newLead.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newLead.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newLead,
          budget: newLead.budget ? parseFloat(newLead.budget) : null,
          propertyId: newLead.propertyId ? parseInt(newLead.propertyId) : null,
        }),
      });

      if (response.ok) {
        const createdLead = await response.json();
        toast.success("Lead created successfully");
        
        // Log activity
        try {
          await logActivity("create", "lead", `Created new lead: ${newLead.name}`, createdLead.id, {
            source: newLead.source,
            status: newLead.status,
          });
        } catch (logError) {
          // Silently fail - don't break the flow
          console.error("Failed to log activity:", logError);
        }

        setIsAddDialogOpen(false);
        setNewLead({
          name: "",
          phone: "",
          email: "",
          budget: "",
          preferredLocation: "",
          source: "zameen",
          status: "inquiry",
          notes: "",
          propertyId: "",
        });
        fetchLeads();
      } else {
        const error = await response.json().catch(() => ({ error: "Failed to create lead" }));
        toast.error(error.error || "Failed to create lead");
      }
    } catch (error) {
      console.error("Create lead error:", error);
      toast.error("Failed to create lead. Please try again.");
    }
  };

  const handleUpdateLead = async () => {
    if (!selectedLead) return;

    if (!newLead.name.trim() || !newLead.phone.trim()) {
      toast.error("Name and phone are required");
      return;
    }

    // Validate phone format
    const phoneRegex = /^[\d\s\+\-\(\)]+$/;
    if (!phoneRegex.test(newLead.phone)) {
      toast.error("Please enter a valid phone number");
      return;
    }

    // Validate email if provided
    if (newLead.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newLead.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    const oldStatus = selectedLead.status;
    const newStatus = newLead.status;

    try {
      const response = await fetch(`/api/leads?id=${selectedLead.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newLead,
          budget: newLead.budget ? parseFloat(newLead.budget) : null,
          propertyId: newLead.propertyId ? parseInt(newLead.propertyId) : null,
        }),
      });

      if (response.ok) {
        toast.success("Lead updated successfully");
        
        // Log activity
        try {
          if (oldStatus !== newStatus) {
            await logActivity("update", "lead", `Updated lead ${selectedLead.name}: ${STATUS_LABELS[oldStatus]} → ${STATUS_LABELS[newStatus]}`, selectedLead.id, {
              oldStatus,
              newStatus,
            });
          } else {
            await logActivity("update", "lead", `Updated lead: ${selectedLead.name}`, selectedLead.id);
          }
        } catch (logError) {
          // Silently fail
        }

        setIsEditDialogOpen(false);
        setSelectedLead(null);
        fetchLeads();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update lead");
      }
    } catch (error) {
      console.error("Update lead error:", error);
      toast.error("Failed to update lead. Please try again.");
    }
  };

  const handleDeleteLead = async (id: number) => {
    const lead = leads.find((l) => l.id === id);
    if (!confirm(`Are you sure you want to delete lead "${lead?.name}"?`)) return;

    try {
      const response = await fetch(`/api/leads?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Lead deleted successfully");
        
        // Log activity
        try {
          await logActivity("delete", "lead", `Deleted lead: ${lead?.name}`, id);
        } catch (logError) {
          // Silently fail
        }

        fetchLeads();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to delete lead");
      }
    } catch (error) {
      console.error("Delete lead error:", error);
      toast.error("Failed to delete lead. Please try again.");
    }
  };

  const handleConvertToTenant = (lead: Lead) => {
    setSelectedLead(lead);
    setIsConvertDialogOpen(true);
  };

  const handleStatusChange = async (leadId: number, newStatus: string) => {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return;

    const oldStatus = lead.status;

    try {
      const response = await fetch(`/api/leads?id=${leadId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        // Optimistically update UI
        setLeads((prev) =>
          prev.map((l) => (l.id === leadId ? { ...l, status: newStatus as Lead["status"] } : l))
        );
        
        // Log activity
        try {
          await logActivity("update", "lead", `Moved lead ${lead.name}: ${STATUS_LABELS[oldStatus]} → ${STATUS_LABELS[newStatus]}`, leadId, {
            oldStatus,
            newStatus,
          });
        } catch (logError) {
          // Silently fail
        }

        toast.success(`Lead moved to ${STATUS_LABELS[newStatus]}`);
      } else {
        toast.error("Failed to update lead status");
        fetchLeads(); // Revert on error
      }
    } catch (error) {
      console.error("Status change error:", error);
      toast.error("Failed to update lead status");
      fetchLeads(); // Revert on error
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragOver = (event: DragOverEvent) => {
    // Visual feedback handled by dnd-kit
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id as number;
    const overId = over.id;

    const activeLead = leads.find((l) => l.id === activeId);
    if (!activeLead) return;

    // Check if dropped on a column
    const targetColumn = columns.find((col) => col.id === overId);
    if (targetColumn) {
      if (targetColumn.status !== activeLead.status) {
        handleStatusChange(activeId, targetColumn.status);
        return;
      }
      return;
    }

    // Check if dropped on another card
    const overLead = leads.find((l) => l.id === overId);
    if (overLead && overLead.status !== activeLead.status) {
      handleStatusChange(activeId, overLead.status);
      return;
    }
  };

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      searchQuery === "" ||
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone.includes(searchQuery) ||
      (lead.email && lead.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (lead.preferredLocation && lead.preferredLocation.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  const getLeadsByStatus = (status: string) => {
    return filteredLeads.filter((lead) => lead.status === status);
  };

  const columns = [
    { id: "inquiry", title: "Inquiry", status: "inquiry" as const },
    { id: "viewing", title: "Viewing", status: "viewing" as const },
    { id: "application", title: "Application", status: "application" as const },
    { id: "signed", title: "Signed", status: "signed" as const },
  ];

  return (
    <div className="flex flex-1 flex-col gap-4 sm:gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <div className="space-y-1 sm:space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Leads Pipeline</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Track potential tenants from inquiry to signed lease.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsImportExportDialogOpen(true)}
          >
            <Download className="mr-2 size-4" />
            Import/Export
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 size-4" />
                Add Lead
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Lead</DialogTitle>
              <DialogDescription>
                Add a new lead to track through your sales pipeline
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={newLead.name}
                    onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    value={newLead.phone}
                    onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                    placeholder="+92 300 1234567"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newLead.email}
                  onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                  placeholder="john@example.com"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="budget">Budget</Label>
                  <Input
                    id="budget"
                    type="number"
                    value={newLead.budget}
                    onChange={(e) => setNewLead({ ...newLead, budget: e.target.value })}
                    placeholder="50000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="source">Source *</Label>
                  <Select
                    value={newLead.source}
                    onValueChange={(value) => setNewLead({ ...newLead, source: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="zameen">Zameen</SelectItem>
                      <SelectItem value="olx">OLX</SelectItem>
                      <SelectItem value="referral">Referral</SelectItem>
                      <SelectItem value="website">Website</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="preferredLocation">Preferred Location</Label>
                <Input
                  id="preferredLocation"
                  value={newLead.preferredLocation}
                  onChange={(e) => setNewLead({ ...newLead, preferredLocation: e.target.value })}
                  placeholder="Bahria Town, Lahore"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="propertyId">Linked Property (Optional)</Label>
                <Select
                  value={newLead.propertyId}
                  onValueChange={(value) => setNewLead({ ...newLead, propertyId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a property (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {properties.map((property) => (
                      <SelectItem key={property.id} value={String(property.id)}>
                        {property.title || property.address || `Property #${property.id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={newLead.status}
                  onValueChange={(value: any) => setNewLead({ ...newLead, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inquiry">Inquiry</SelectItem>
                    <SelectItem value="viewing">Viewing</SelectItem>
                    <SelectItem value="application">Application</SelectItem>
                    <SelectItem value="signed">Signed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={newLead.notes}
                  onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })}
                  placeholder="Additional notes about this lead..."
                  rows={3}
                />
              </div>
              <Button onClick={handleCreateLead} className="w-full">
                Create Lead
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-2 sm:left-3 top-1/2 size-3 sm:size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search leads..."
            className="pl-8 sm:pl-10 text-sm sm:text-base h-9 sm:h-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search leads"
          />
        </div>
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-full sm:w-36 md:w-40 text-sm sm:text-base h-9 sm:h-10">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="inquiry">Inquiry</SelectItem>
              <SelectItem value="viewing">Viewing</SelectItem>
              <SelectItem value="application">Application</SelectItem>
              <SelectItem value="signed">Signed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedSource} onValueChange={setSelectedSource}>
            <SelectTrigger className="w-full sm:w-36 md:w-40 text-sm sm:text-base h-9 sm:h-10">
              <SelectValue placeholder="All Sources" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="zameen">Zameen</SelectItem>
              <SelectItem value="olx">OLX</SelectItem>
              <SelectItem value="referral">Referral</SelectItem>
              <SelectItem value="website">Website</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {columns.map((column) => {
              const columnLeads = getLeadsByStatus(column.status);
              const columnIcon = MessageSquare; // Default icon
              const columnDescription =
                column.status === "inquiry"
                  ? "New leads that need initial contact"
                  : column.status === "viewing"
                  ? "Leads scheduled for property viewings"
                  : column.status === "application"
                  ? "Leads who have submitted applications"
                  : "Leads who have signed leases";

              return (
                <DroppableColumn key={column.id} id={column.id}>
                  <Card className="flex flex-col">
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">{column.title}</CardTitle>
                        <Badge variant="outline">{columnLeads.length}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-3 overflow-y-auto max-h-[600px]">
                      <SortableContext
                        items={columnLeads.map((lead) => lead.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {columnLeads.map((lead) => (
                          <SortableLeadCard
                            key={lead.id}
                            lead={lead}
                            onEdit={(lead) => {
                              setSelectedLead(lead);
                              setNewLead({
                                name: lead.name,
                                phone: lead.phone,
                                email: lead.email || "",
                                budget: lead.budget ? String(lead.budget) : "",
                                preferredLocation: lead.preferredLocation || "",
                                source: lead.source,
                                status: lead.status,
                                notes: lead.notes || "",
                                propertyId: lead.propertyId ? String(lead.propertyId) : "",
                              });
                              setIsEditDialogOpen(true);
                            }}
                            onDelete={handleDeleteLead}
                            onConvert={handleConvertToTenant}
                            onStatusChange={(newStatus) => handleStatusChange(lead.id, newStatus)}
                            availableStatuses={columns.map((col) => col.status).filter((s) => s !== lead.status)}
                            statusColors={STATUS_COLORS}
                            statusLabels={STATUS_LABELS}
                            sourceLabels={SOURCE_LABELS}
                          />
                        ))}
                      </SortableContext>
                      {columnLeads.length === 0 && (
                        <EmptyState
                          icon={columnIcon}
                          title={`No ${column.title.toLowerCase()} leads`}
                          description={columnDescription}
                        />
                      )}
                    </CardContent>
                  </Card>
                </DroppableColumn>
              );
            })}
          </div>
        </DndContext>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Lead</DialogTitle>
            <DialogDescription>Update lead information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  value={newLead.name}
                  onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone *</Label>
                <Input
                  id="edit-phone"
                  value={newLead.phone}
                  onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={newLead.email}
                onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-budget">Budget</Label>
                <Input
                  id="edit-budget"
                  type="number"
                  value={newLead.budget}
                  onChange={(e) => setNewLead({ ...newLead, budget: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-source">Source</Label>
                <Select
                  value={newLead.source}
                  onValueChange={(value) => setNewLead({ ...newLead, source: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="zameen">Zameen</SelectItem>
                    <SelectItem value="olx">OLX</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="website">Website</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-location">Preferred Location</Label>
              <Input
                id="edit-location"
                value={newLead.preferredLocation}
                onChange={(e) => setNewLead({ ...newLead, preferredLocation: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-propertyId">Linked Property (Optional)</Label>
              <Select
                value={newLead.propertyId}
                onValueChange={(value) => setNewLead({ ...newLead, propertyId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a property (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={String(property.id)}>
                      {property.title || property.address || `Property #${property.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={newLead.status}
                onValueChange={(value: any) => setNewLead({ ...newLead, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inquiry">Inquiry</SelectItem>
                  <SelectItem value="viewing">Viewing</SelectItem>
                  <SelectItem value="application">Application</SelectItem>
                  <SelectItem value="signed">Signed</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={newLead.notes}
                onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })}
                rows={3}
              />
            </div>
            <Button onClick={handleUpdateLead} className="w-full">
              Update Lead
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Convert to Tenant Dialog */}
      <Dialog open={isConvertDialogOpen} onOpenChange={setIsConvertDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convert Lead to Tenant</DialogTitle>
            <DialogDescription>
              This will open the Add Tenant form with the lead's information pre-filled, and archive this lead.
            </DialogDescription>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-2 py-4">
              <div className="text-sm">
                <span className="font-medium">Name:</span> {selectedLead.name}
              </div>
              <div className="text-sm">
                <span className="font-medium">Phone:</span> {selectedLead.phone}
              </div>
              {selectedLead.email && (
                <div className="text-sm">
                  <span className="font-medium">Email:</span> {selectedLead.email}
                </div>
              )}
              {selectedLead.budget && (
                <div className="text-sm">
                  <span className="font-medium">Budget:</span> {selectedLead.budget.toLocaleString()} PKR
                </div>
              )}
            </div>
          )}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsConvertDialogOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (selectedLead) {
                  // Archive the lead first
                  try {
                    await fetch(`/api/leads?id=${selectedLead.id}`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ status: "archived" }),
                    });

                    // Log activity
                    try {
                      await logActivity("update", "lead", `Converted lead ${selectedLead.name} to tenant`, selectedLead.id, {
                        action: "converted_to_tenant",
                      });
                    } catch (logError) {
                      // Silently fail
                    }

                    // Navigate to tenant form with pre-filled data
                    const params = new URLSearchParams({
                      convert: String(selectedLead.id),
                      name: selectedLead.name,
                      phone: selectedLead.phone,
                    });
                    if (selectedLead.email) {
                      params.append("email", selectedLead.email);
                    }
                    router.push(`/tenants?${params.toString()}`);
                  } catch (error) {
                    console.error("Failed to archive lead:", error);
                    toast.error("Failed to archive lead, but continuing to tenant form...");
                    // Still navigate even if archiving fails
                    const params = new URLSearchParams({
                      convert: String(selectedLead.id),
                      name: selectedLead.name,
                      phone: selectedLead.phone,
                    });
                    if (selectedLead.email) {
                      params.append("email", selectedLead.email);
                    }
                    router.push(`/tenants?${params.toString()}`);
                  }
                }
              }}
              className="flex-1"
            >
              <ArrowRight className="mr-2 size-4" />
              Continue to Tenant Form
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lead Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Lead Details</DialogTitle>
            <DialogDescription>View complete information about this lead</DialogDescription>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Name</Label>
                  <p className="font-medium">{selectedLead.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Phone</Label>
                  <p className="font-medium">
                    <a href={`tel:${selectedLead.phone}`} className="text-primary hover:underline">
                      {selectedLead.phone}
                    </a>
                  </p>
                </div>
              </div>
              {selectedLead.email && (
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium">
                    <a href={`mailto:${selectedLead.email}`} className="text-primary hover:underline">
                      {selectedLead.email}
                    </a>
                  </p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                {selectedLead.budget && (
                  <div>
                    <Label className="text-muted-foreground">Budget</Label>
                    <p className="font-medium">{selectedLead.budget.toLocaleString()} PKR</p>
                  </div>
                )}
                <div>
                  <Label className="text-muted-foreground">Source</Label>
                  <p className="font-medium">{SOURCE_LABELS[selectedLead.source] || selectedLead.source}</p>
                </div>
              </div>
              {selectedLead.preferredLocation && (
                <div>
                  <Label className="text-muted-foreground">Preferred Location</Label>
                  <p className="font-medium">{selectedLead.preferredLocation}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge className={STATUS_COLORS[selectedLead.status]}>
                    {STATUS_LABELS[selectedLead.status]}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Created</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedLead.createdAt).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
              {selectedLead.notes && (
                <div>
                  <Label className="text-muted-foreground">Notes</Label>
                  <p className="text-sm whitespace-pre-wrap">{selectedLead.notes}</p>
                </div>
              )}
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setNewLead({
                      name: selectedLead.name,
                      phone: selectedLead.phone,
                      email: selectedLead.email || "",
                      budget: selectedLead.budget ? String(selectedLead.budget) : "",
                      preferredLocation: selectedLead.preferredLocation || "",
                      source: selectedLead.source,
                      status: selectedLead.status,
                      notes: selectedLead.notes || "",
                      propertyId: selectedLead.propertyId ? String(selectedLead.propertyId) : "",
                    });
                    setIsDetailDialogOpen(false);
                    setIsEditDialogOpen(true);
                  }}
                  className="flex-1"
                >
                  <Edit className="mr-2 size-4" />
                  Edit Lead
                </Button>
                {selectedLead.status !== "signed" && selectedLead.status !== "archived" && (
                  <Button
                    onClick={() => {
                      setIsDetailDialogOpen(false);
                      handleConvertToTenant(selectedLead);
                    }}
                    className="flex-1"
                  >
                    <UserPlus className="mr-2 size-4" />
                    Convert to Tenant
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Import/Export Dialog */}
      <ImportExportDialog
        open={isImportExportDialogOpen}
        onOpenChange={setIsImportExportDialogOpen}
        type="leads"
        data={leads.map(lead => ({
          name: lead.name,
          phone: lead.phone,
          email: lead.email || '',
          budget: lead.budget || '',
          preferredLocation: lead.preferredLocation || '',
          source: lead.source,
          status: lead.status,
          notes: lead.notes || '',
        }))}
        onImportSuccess={() => {
          fetchLeads();
          setIsImportExportDialogOpen(false);
        }}
      />
    </div>
  );
}

export default function LeadsPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-1 flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Leads Pipeline</h1>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    }>
      <ErrorBoundary>
        <LeadsPageContent />
      </ErrorBoundary>
    </Suspense>
  );
}

// Error Boundary Component
function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setHasError(true);
      setError(new Error(event.message));
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      setHasError(true);
      setError(new Error(event.reason?.message || String(event.reason)));
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  if (hasError) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
        <h2 className="text-2xl font-bold text-destructive">Something went wrong</h2>
        <p className="text-muted-foreground">
          {error?.message || "An unexpected error occurred"}
        </p>
        <Button onClick={() => {
          setHasError(false);
          setError(null);
          window.location.reload();
        }}>
          Reload Page
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}

