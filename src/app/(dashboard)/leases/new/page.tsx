"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LeaseForm } from "@/components/leases/lease-form";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NewLeasePage() {
  const router = useRouter();

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 size-4" />
          Back
        </Button>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Create New Lease</h1>
          <p className="text-muted-foreground">Create a new lease agreement for a tenant</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lease Details</CardTitle>
          <CardDescription>Fill in the lease information below</CardDescription>
        </CardHeader>
        <CardContent>
          <LeaseForm
            onSuccess={() => router.push("/leases")}
            onCancel={() => router.back()}
          />
        </CardContent>
      </Card>
    </div>
  );
}

