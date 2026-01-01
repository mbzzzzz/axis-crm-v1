import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { properties } from "@/db/schema-postgres";
import { eq, and, or, like, gte, lte, ilike, asc, desc } from "drizzle-orm";

/**
 * Public API endpoint for fetching public properties
 * GET /api/public/properties
 * No authentication required
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Query parameters
    const search = searchParams.get("search") || "";
    const propertyType = searchParams.get("type") || "";
    const status = searchParams.get("status") || "";
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const minBedrooms = searchParams.get("minBedrooms");
    const minBathrooms = searchParams.get("minBathrooms");
    const minSqft = searchParams.get("minSqft");
    const maxSqft = searchParams.get("maxSqft");
    const city = searchParams.get("city") || "";
    const state = searchParams.get("state") || "";
    const zipCode = searchParams.get("zipCode") || "";
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const sort = searchParams.get("sort") || "newest";

    // Determine sort order
    let orderByClause;
    switch (sort) {
      case "price_asc":
        orderByClause = asc(properties.price);
        break;
      case "price_desc":
        orderByClause = desc(properties.price);
        break;
      case "bedrooms":
        orderByClause = desc(properties.bedrooms);
        break;
      case "bathrooms":
        orderByClause = desc(properties.bathrooms);
        break;
      case "sqft":
        orderByClause = desc(properties.sizeSqft);
        break;
      case "oldest":
        orderByClause = asc(properties.createdAt);
        break;
      case "newest":
      default:
        orderByClause = desc(properties.createdAt);
        break;
    }

    // Build query - only public properties
    let query = db
      .select()
      .from(properties)
      .where(eq(properties.isPublic, 1))
      .limit(limit)
      .offset(offset);

    // Apply filters
    const conditions = [eq(properties.isPublic, 1)];

    // Search filter (address, city, state, title)
    if (search) {
      conditions.push(
        or(
          ilike(properties.title, `%${search}%`),
          ilike(properties.address, `%${search}%`),
          ilike(properties.city, `%${search}%`),
          ilike(properties.state, `%${search}%`),
          ilike(properties.zipCode, `%${search}%`)
        )!
      );
    }

    // Property type filter
    if (propertyType) {
      conditions.push(eq(properties.propertyType, propertyType));
    }

    // Status filter
    if (status) {
      conditions.push(eq(properties.status, status));
    }

    // Price range filter
    if (minPrice) {
      conditions.push(gte(properties.price, parseFloat(minPrice)));
    }
    if (maxPrice) {
      conditions.push(lte(properties.price, parseFloat(maxPrice)));
    }

    // Bedrooms filter
    if (minBedrooms && properties.bedrooms) {
      conditions.push(gte(properties.bedrooms, parseInt(minBedrooms)));
    }

    // Bathrooms filter
    if (minBathrooms && properties.bathrooms) {
      conditions.push(gte(properties.bathrooms, parseFloat(minBathrooms)));
    }

    // Square footage filter
    if (minSqft && properties.sizeSqft) {
      conditions.push(gte(properties.sizeSqft, parseInt(minSqft)));
    }
    if (maxSqft && properties.sizeSqft) {
      conditions.push(lte(properties.sizeSqft, parseInt(maxSqft)));
    }

    // Location filters
    if (city) {
      conditions.push(ilike(properties.city, `%${city}%`));
    }
    if (state) {
      conditions.push(ilike(properties.state, `%${state}%`));
    }
    if (zipCode) {
      conditions.push(eq(properties.zipCode, zipCode));
    }

    // Execute query with all conditions
    const result = await db
      .select()
      .from(properties)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset)
      .orderBy(orderByClause);

    // Get total count for pagination
    const countResult = await db
      .select()
      .from(properties)
      .where(and(...conditions));

    return NextResponse.json({
      properties: result,
      total: countResult.length,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error fetching public properties:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch properties",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}

