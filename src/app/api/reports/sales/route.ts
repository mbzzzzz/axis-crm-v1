import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { properties } from "@/db/schema-postgres";
import { eq, and, gte, lte } from "drizzle-orm";
import { getAuthenticatedUser } from "@/lib/api-auth";

async function getCurrentUser() {
  const user = await getAuthenticatedUser();
  if (!user) return null;
  return {
    id: user.id,
    name: (user.user_metadata?.full_name as string) || user.email || "User",
    email: user.email || "",
  };
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in.", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const propertyType = searchParams.get("propertyType");

    // Build conditions
    const conditions = [eq(properties.userId, user.id)];

    // Filter by date range if provided
    if (startDate) {
      conditions.push(gte(properties.updatedAt, new Date(startDate)));
    }
    if (endDate) {
      conditions.push(lte(properties.updatedAt, new Date(endDate)));
    }

    // Filter by property type if provided
    if (propertyType && propertyType !== "all") {
      conditions.push(eq(properties.propertyType, propertyType));
    }

    // Get sold properties
    const soldProperties = await db
      .select()
      .from(properties)
      .where(and(...conditions, eq(properties.status, "sold")));

    // Get all properties for comparison
    const allProperties = await db
      .select()
      .from(properties)
      .where(and(...conditions));

    // Calculate sales metrics
    const totalSales = soldProperties.length;
    const totalRevenue = soldProperties.reduce(
      (sum, prop) => sum + (prop.price || 0),
      0
    );
    const averageSalePrice =
      totalSales > 0 ? totalRevenue / totalSales : 0;
    const totalProperties = allProperties.length;
    const conversionRate =
      totalProperties > 0 ? (totalSales / totalProperties) * 100 : 0;

    // Sales by property type
    const salesByType = soldProperties.reduce((acc, prop) => {
      const type = prop.propertyType || "unknown";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Sales by month
    const salesByMonth = soldProperties.reduce((acc, prop) => {
      if (prop.updatedAt) {
        const date = new Date(prop.updatedAt);
        const monthKey = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;
        acc[monthKey] = (acc[monthKey] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Revenue by month
    const revenueByMonth = soldProperties.reduce((acc, prop) => {
      if (prop.updatedAt) {
        const date = new Date(prop.updatedAt);
        const monthKey = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;
        acc[monthKey] = (acc[monthKey] || 0) + (prop.price || 0);
      }
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json(
      {
        summary: {
          totalSales,
          totalRevenue,
          averageSalePrice,
          totalProperties,
          conversionRate,
        },
        salesByType,
        salesByMonth,
        revenueByMonth,
        properties: soldProperties.map((prop) => ({
          id: prop.id,
          title: prop.title,
          address: prop.address,
          propertyType: prop.propertyType,
          price: prop.price,
          soldDate: prop.updatedAt,
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Sales report error:", error);
    return NextResponse.json(
      { error: "Internal server error: " + (error as Error).message },
      { status: 500 }
    );
  }
}

