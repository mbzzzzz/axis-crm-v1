import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { properties, userPreferences } from "@/db/schema-postgres";
import { eq, and } from "drizzle-orm";

/**
 * Get a single public property by ID
 * GET /api/public/properties/[id]
 * No authentication required
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const propertyId = parseInt(params.id);
    if (isNaN(propertyId)) {
      return NextResponse.json(
        { error: "Invalid property ID", code: "INVALID_ID" },
        { status: 400 }
      );
    }

    // Get public property
    const property = await db
      .select()
      .from(properties)
      .where(
        and(
          eq(properties.id, propertyId),
          eq(properties.isPublic, 1)
        )
      )
      .limit(1);

    if (property.length === 0) {
      return NextResponse.json(
        { error: "Property not found or not public", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Get agent information from user preferences
    const agentInfo = await db
      .select({
        agentName: userPreferences.agentName,
        agentAgency: userPreferences.agentAgency,
      })
      .from(userPreferences)
      .where(eq(userPreferences.userId, property[0].userId))
      .limit(1);

    // Note: We don't expose email/phone directly for privacy
    // Contact form will be used instead

    return NextResponse.json({
      property: property[0],
      agentInfo: agentInfo[0] || {},
    });
  } catch (error) {
    console.error("Error fetching public property:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch property",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}

