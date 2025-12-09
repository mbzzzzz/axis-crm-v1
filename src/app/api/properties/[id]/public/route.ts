import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { db } from "@/db";
import { properties } from "@/db/schema-postgres";
import { eq, and } from "drizzle-orm";

/**
 * Toggle public status of a property
 * PATCH /api/properties/[id]/public
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in.", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const propertyId = parseInt(params.id);
    if (isNaN(propertyId)) {
      return NextResponse.json(
        { error: "Invalid property ID", code: "INVALID_ID" },
        { status: 400 }
      );
    }

    // Get current property to check ownership
    const existingProperty = await db
      .select()
      .from(properties)
      .where(
        and(
          eq(properties.id, propertyId),
          eq(properties.userId, user.id)
        )
      )
      .limit(1);

    if (existingProperty.length === 0) {
      return NextResponse.json(
        { error: "Property not found or you don't have permission", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Toggle isPublic status (0 -> 1, 1 -> 0)
    const newPublicStatus = existingProperty[0].isPublic === 1 ? 0 : 1;

    // Update property
    const updated = await db
      .update(properties)
      .set({
        isPublic: newPublicStatus,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(properties.id, propertyId),
          eq(properties.userId, user.id)
        )
      )
      .returning();

    return NextResponse.json({
      success: true,
      property: updated[0],
      isPublic: newPublicStatus === 1,
    });
  } catch (error) {
    console.error("Error toggling property public status:", error);
    return NextResponse.json(
      {
        error: "Failed to update property status",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}

