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
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedSource, setSelectedSource] = useState<string>("all");
  const [isImportExportDialogOpen, setIsImportExportDialogOpen] = useState(false);

  useEffect(() => {
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

    fetchLeads();
  }, [selectedStatus, selectedSource]);

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      searchQuery === "" ||
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone.includes(searchQuery) ||
      (lead.email && lead.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (lead.preferredLocation && lead.preferredLocation.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  const columns: { id: string; title: string; status: Lead["status"] }[] = [
    { id: "inquiry", title: "Inquiry", status: "inquiry" },
    { id: "viewing", title: "Viewing", status: "viewing" },
    { id: "application", title: "Application", status: "application" },
    { id: "signed", title: "Signed", status: "signed" },
  ];

  const getLeadsByStatus = (status: Lead["status"]) => {
    return filteredLeads.filter((lead) => lead.status === status);
  };

  return (
    <div className="flex flex-1 flex-col gap-4 sm:gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <div className="space-y-1 sm:space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Leads Pipeline</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Track potential tenants from inquiry to signed lease.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setIsImportExportDialogOpen(true)}
        >
          <Download className="mr-2 size-4" />
          Import/Export
        </Button>
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
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {columns.map((column) => {
            const columnLeads = getLeadsByStatus(column.status);
            const columnDescription =
              column.status === "inquiry"
                ? "New leads that need initial contact"
                : column.status === "viewing"
                ? "Leads scheduled for property viewings"
                : column.status === "application"
                ? "Leads who have submitted applications"
                : "Leads who have signed leases";

            return (
              <Card key={column.id} className="flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">{column.title}</CardTitle>
                    <Badge variant="outline">{columnLeads.length}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-3 overflow-y-auto max-h-[600px]">
                  {columnLeads.length === 0 ? (
                    <EmptyState
                      icon={MessageSquare}
                      title={`No ${column.title.toLowerCase()} leads`}
                      description={columnDescription}
                    />
                  ) : (
                    columnLeads.map((lead) => (
                      <div
                        key={lead.id}
                        className="rounded-lg border border-border bg-card p-3 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="font-medium truncate">{lead.name}</p>
                            {lead.preferredLocation && (
                              <p className="text-xs text-muted-foreground truncate">
                                {lead.preferredLocation}
                              </p>
                            )}
                          </div>
                          <Badge size="sm">{SOURCE_LABELS[lead.source] || lead.source}</Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{lead.phone}</span>
                          {lead.budget && (
                            <span>{lead.budget.toLocaleString()} PKR</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Import/Export Dialog */}
      <ImportExportDialog
        open={isImportExportDialogOpen}
        onOpenChange={setIsImportExportDialogOpen}
        type="leads"
        data={leads.map((lead) => ({
          name: lead.name,
          phone: lead.phone,
          email: lead.email || "",
          budget: lead.budget || "",
          preferredLocation: lead.preferredLocation || "",
          source: lead.source,
          status: lead.status,
          notes: lead.notes || "",
        }))}
        onImportSuccess={() => {
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

