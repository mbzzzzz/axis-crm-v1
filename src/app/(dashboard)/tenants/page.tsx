"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Search, Eye, Edit, Trash2, Filter } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

interface Tenant {
  id: number;
  name: string;
  email: string;
  phone?: string;
  property?: any;
  leaseStatus: "active" | "expired" | "pending";
  leaseStart: string;
  leaseEnd: string;
  monthlyRent?: number;
  deposit?: number;
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [properties, setProperties] = useState<Array<{ id: number; title?: string; address?: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProperty, setSelectedProperty] = useState<string>("all");
  const [selectedLeaseStatus, setSelectedLeaseStatus] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newTenant, setNewTenant] = useState({
    name: "",
    email: "",
    phone: "",
    propertyId: "",
    leaseStart: "",
    leaseEnd: "",
    leaseStatus: "active" as "active" | "expired" | "pending",
    monthlyRent: "",
    yearlyIncreaseRate: "10",
    expectedNextYearRent: "",
    deposit: "",
  });

  useEffect(() => {
    fetchTenants();
  }, [selectedProperty, selectedLeaseStatus]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/properties?limit=100");
        const data = await res.json();
        setProperties(Array.isArray(data) ? data : []);
      } catch {
        setProperties([]);
      }
    })();
  }, []);

  useEffect(() => {
    const rent = parseFloat(newTenant.monthlyRent || "0");
    const rate = parseFloat(newTenant.yearlyIncreaseRate || "0");
    if (!isNaN(rent) && !isNaN(rate)) {
      const next = rent * (1 + rate / 100);
      setNewTenant((t) => ({ ...t, expectedNextYearRent: next ? next.toFixed(2) : "" }));
    }
  }, [newTenant.monthlyRent, newTenant.yearlyIncreaseRate]);

  const fetchTenants = async () => {
    try {
      setIsLoading(true);
      let url = "/api/tenants?";
      if (selectedProperty !== "all") {
        url += `propertyId=${selectedProperty}&`;
      }
      if (selectedLeaseStatus !== "all") {
        url += `leaseStatus=${selectedLeaseStatus}&`;
      }
      const response = await fetch(url);
      const data = await response.json();
      setTenants(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch tenants:", error);
      toast.error("Failed to load tenants");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTenant = async () => {
    try {
      const response = await fetch("/api/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTenant.name,
          email: newTenant.email,
          phone: newTenant.phone || null,
          propertyId: newTenant.propertyId || null,
          leaseStart: newTenant.leaseStart,
          leaseEnd: newTenant.leaseEnd,
          leaseStatus: newTenant.leaseStatus,
          monthlyRent: newTenant.monthlyRent ? parseFloat(newTenant.monthlyRent) : null,
          deposit: newTenant.deposit ? parseFloat(newTenant.deposit) : null,
          notes: newTenant.yearlyIncreaseRate || newTenant.expectedNextYearRent
            ? `increaseRate=${newTenant.yearlyIncreaseRate}%; expectedNextYear=${newTenant.expectedNextYearRent}`
            : undefined,
        }),
      });

      if (response.ok) {
        toast.success("Tenant created successfully");
        setIsAddDialogOpen(false);
        setNewTenant({
          name: "",
          email: "",
          phone: "",
          propertyId: "",
          leaseStart: "",
          leaseEnd: "",
          leaseStatus: "active",
          monthlyRent: "",
          yearlyIncreaseRate: "10",
          expectedNextYearRent: "",
          deposit: "",
        });
        fetchTenants();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to create tenant");
      }
    } catch (error) {
      toast.error("Failed to create tenant");
    }
  };

  const handleDeleteTenant = async (id: number) => {
    if (!confirm("Are you sure you want to delete this tenant?")) return;

    try {
      const response = await fetch(`/api/tenants?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Tenant deleted successfully");
        fetchTenants();
      } else {
        toast.error("Failed to delete tenant");
      }
    } catch (error) {
      toast.error("Failed to delete tenant");
    }
  };

  const getPaymentSummary = (tenant: Tenant) => {
    // This would ideally come from invoice data
    // For now, return placeholder based on lease status
    if (tenant.leaseStatus === "pending") {
      return { summary: "Awaiting Deposit", details: `Lease starts ${new Date(tenant.leaseStart).toLocaleDateString()}` };
    }
    if (tenant.leaseStatus === "expired") {
      return { summary: "Overdue", details: "Lease expired" };
    }
    return { summary: "Paid", details: `Next due: ${new Date(tenant.leaseEnd).toLocaleDateString()}` };
  };

  const getLeaseStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: "bg-green-100 text-green-700",
      expired: "bg-red-100 text-red-700",
      pending: "bg-yellow-100 text-yellow-700",
    };
    return colors[status.toLowerCase()] || "bg-gray-100 text-gray-700";
  };

  const formatLeaseStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const filteredTenants = tenants.filter((tenant) => {
    const matchesSearch = searchQuery === "" ||
      tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Tenant Management</h1>
          <p className="text-muted-foreground">Manage all your tenants in one place.</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 size-4" />
              Add New Tenant
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Tenant</DialogTitle>
              <DialogDescription>
                Add a new tenant to your property management system
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={newTenant.name}
                    onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newTenant.email}
                    onChange={(e) => setNewTenant({ ...newTenant, email: e.target.value })}
                    placeholder="john@example.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={newTenant.phone}
                  onChange={(e) => setNewTenant({ ...newTenant, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="propertyId">Property</Label>
                <Select
                  value={newTenant.propertyId}
                  onValueChange={(value) => setNewTenant({ ...newTenant, propertyId: value })}
                >
                  <SelectTrigger id="propertyId">
                    <SelectValue placeholder="Select property (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.length === 0 ? (
                      <SelectItem value="">No properties</SelectItem>
                    ) : (
                      properties.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.title || p.address || `#${p.id}`}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="leaseStart">Lease Start *</Label>
                  <Input
                    id="leaseStart"
                    type="date"
                    value={newTenant.leaseStart}
                    onChange={(e) => setNewTenant({ ...newTenant, leaseStart: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="leaseEnd">Lease End *</Label>
                  <Input
                    id="leaseEnd"
                    type="date"
                    value={newTenant.leaseEnd}
                    onChange={(e) => setNewTenant({ ...newTenant, leaseEnd: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="leaseStatus">Lease Status *</Label>
                  <Select
                    value={newTenant.leaseStatus}
                    onValueChange={(value: "active" | "expired" | "pending") =>
                      setNewTenant({ ...newTenant, leaseStatus: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="monthlyRent">Monthly Rent</Label>
                  <Input
                    id="monthlyRent"
                    type="number"
                    value={newTenant.monthlyRent}
                    onChange={(e) => setNewTenant({ ...newTenant, monthlyRent: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="yearlyIncreaseRate">Yearly Increase Rate (%)</Label>
                  <Input
                    id="yearlyIncreaseRate"
                    type="number"
                    value={newTenant.yearlyIncreaseRate}
                    onChange={(e) =>
                      setNewTenant({ ...newTenant, yearlyIncreaseRate: e.target.value })
                    }
                    placeholder="e.g., 10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expectedNextYearRent">Expected Next Year Rent</Label>
                  <Input
                    id="expectedNextYearRent"
                    value={newTenant.expectedNextYearRent}
                    readOnly
                  />
                </div>
              </div>
              <Button onClick={handleCreateTenant} className="w-full">
                Create Tenant
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Tenants</CardTitle>
          <CardDescription>Manage tenant information and lease details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search tenants..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={selectedProperty} onValueChange={setSelectedProperty}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by Property" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Properties</SelectItem>
                {properties.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.title || p.address || `#${p.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedLeaseStatus} onValueChange={setSelectedLeaseStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by Lease Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredTenants.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {searchQuery ? "No tenants found matching your search" : "No tenants found. Add your first tenant to get started."}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>TENANT NAME</TableHead>
                    <TableHead>PROPERTY</TableHead>
                    <TableHead>LEASE STATUS</TableHead>
                    <TableHead>PAYMENT SUMMARY</TableHead>
                    <TableHead>ACTIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTenants.map((tenant) => {
                    const payment = getPaymentSummary(tenant);
                    return (
                      <TableRow key={tenant.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="size-8">
                              <AvatarFallback>{getInitials(tenant.name)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{tenant.name}</div>
                              <div className="text-sm text-muted-foreground">{tenant.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {tenant.property
                            ? `${tenant.property.title || tenant.property.address || "N/A"}${tenant.property.unit ? `, ${tenant.property.unit}` : ""}`
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          <Badge className={getLeaseStatusColor(tenant.leaseStatus)}>
                            {formatLeaseStatus(tenant.leaseStatus)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{payment.summary}</div>
                            <div className="text-sm text-muted-foreground">{payment.details}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedTenant(tenant);
                                setIsEditDialogOpen(true);
                              }}
                            >
                              <Eye className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedTenant(tenant);
                                setIsEditDialogOpen(true);
                              }}
                            >
                              <Edit className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteTenant(tenant.id)}
                            >
                              <Trash2 className="size-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
        </CardContent>
      </Card>
    </div>
  );
}

