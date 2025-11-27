import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { tenants } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getAuthenticatedUser } from "@/lib/api-auth";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in.", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const tenantId = body?.tenantId;
    const reason = body?.reason?.trim();

    if (!tenantId || isNaN(parseInt(tenantId))) {
      return NextResponse.json(
        { error: "Valid tenantId is required", code: "INVALID_TENANT_ID" },
        { status: 400 }
      );
    }

    const existingTenant = await db
      .select()
      .from(tenants)
      .where(
        and(
          eq(tenants.id, parseInt(tenantId)),
          eq(tenants.userId, user.id)
        )
      )
      .limit(1);

    if (existingTenant.length === 0) {
      return NextResponse.json(
        { error: "Tenant not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const previousNotes = existingTenant[0].notes || "";
    const revocationNote = `Lease revoked on ${today}${reason ? ` – ${reason}` : ""}`;

    const updatedTenant = await db
      .update(tenants)
      .set({
        leaseStatus: "terminated",
        propertyId: null,
        leaseEnd: today,
        notes: [previousNotes, revocationNote].filter(Boolean).join("\n"),
        updatedAt: now,
      })
      .where(
        and(
          eq(tenants.id, parseInt(tenantId)),
          eq(tenants.userId, user.id)
        )
      )
      .returning();

    return NextResponse.json(
      { success: true, tenant: updatedTenant[0] },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST /api/tenants/revoke error:", error);
    return NextResponse.json(
      { error: "Internal server error: " + (error as Error).message },
      { status: 500 }
    );
  }
}


