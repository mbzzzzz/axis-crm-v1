"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Search, Eye, Edit, Trash2, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Lease {
  id: number;
  tenantId: number;
  propertyId: number;
  leaseType: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  deposit?: number;
   currency?: string;
  status: string;
  signedByTenant: number;
  signedByOwner: number;
  signedAt?: string;
  tenant?: { id: number; name: string; email: string };
  property?: { id: number; title?: string; address: string };
}

export default function LeasesPage() {
  const router = useRouter();
  const [leases, setLeases] = useState<Lease[]>([]);
  const [filteredLeases, setFilteredLeases] = useState<Lease[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchLeases = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/leases");
      const data = await response.json();
      if (Array.isArray(data)) {
        setLeases(data);
        setFilteredLeases(data);
      }
    } catch (error) {
      console.error("Error fetching leases:", error);
      toast.error("Failed to load leases");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeases();
  }, []);

  useEffect(() => {
    const filtered = leases.filter(
      (lease) =>
        lease.tenant?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lease.property?.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lease.status.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredLeases(filtered);
  }, [searchQuery, leases]);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this lease?")) return;

    try {
      const response = await fetch(`/api/leases/${id}`, { method: "DELETE" });
      if (response.ok) {
        toast.success("Lease deleted successfully");
        fetchLeases();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to delete lease");
      }
    } catch (error) {
      toast.error("Failed to delete lease");
    }
  };

  const getStatusBadge = (lease: Lease) => {
    const statusColors: Record<string, string> = {
      active: "bg-green-100 text-green-700",
      expired: "bg-red-100 text-red-700",
      draft: "bg-gray-100 text-gray-700",
      pending_signature: "bg-yellow-100 text-yellow-700",
      renewed: "bg-blue-100 text-blue-700",
      terminated: "bg-slate-100 text-slate-700",
    };
    return (
      <Badge className={statusColors[lease.status] || statusColors.draft}>
        {lease.status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
      </Badge>
    );
  };

  const isExpiringSoon = (endDate: string) => {
    const end = new Date(endDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry > 0 && daysUntilExpiry <= 90;
  };

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Lease Management</h1>
          <p className="text-muted-foreground">Manage all property leases and agreements</p>
        </div>
        <Button onClick={() => router.push("/leases/new")}>
          <Plus className="mr-2 size-4" />
          Create Lease
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by tenant or property..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {isLoading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/4" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : filteredLeases.length === 0 ? (
        <Card className="flex min-h-[400px] items-center justify-center">
          <CardContent className="text-center">
            <FileText className="mx-auto size-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No leases found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {searchQuery
                ? "Try adjusting your search"
                : "Create your first lease to get started"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Leases</CardTitle>
            <CardDescription>A list of all your leases</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>TENANT</TableHead>
                  <TableHead>PROPERTY</TableHead>
                  <TableHead>TYPE</TableHead>
                  <TableHead>START DATE</TableHead>
                  <TableHead>END DATE</TableHead>
                  <TableHead>MONTHLY RENT</TableHead>
                  <TableHead>STATUS</TableHead>
                  <TableHead>SIGNATURE</TableHead>
                  <TableHead>ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeases.map((lease) => {
                  const expiringSoon = isExpiringSoon(lease.endDate);
                  return (
                    <TableRow key={lease.id}>
                      <TableCell className="font-medium">
                        {lease.tenant?.name || "Unknown"}
                      </TableCell>
                      <TableCell>
                        {lease.property?.title || lease.property?.address || "N/A"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {lease.leaseType.charAt(0).toUpperCase() + lease.leaseType.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(lease.startDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell className={expiringSoon ? "text-yellow-600 font-medium" : undefined}>
                        {new Date(lease.endDate).toLocaleDateString()}
                        {expiringSoon && (
                          <span className="ml-2 text-xs">(Expiring soon)</span>
                        )}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {(lease.currency || "USD")} {lease.monthlyRent.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(lease)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 text-xs">
                          <span className={lease.signedByTenant === 1 ? "text-green-600" : "text-gray-400"}>
                            Tenant: {lease.signedByTenant === 1 ? "✓" : "✗"}
                          </span>
                          <span className={lease.signedByOwner === 1 ? "text-green-600" : "text-gray-400"}>
                            Owner: {lease.signedByOwner === 1 ? "✓" : "✗"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/leases/${lease.id}`)}
                            title="View Lease"
                          >
                            <Eye className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(lease.id)}
                            title="Delete Lease"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

