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

    // Build conditions
    const conditions = [
      eq(properties.userId, user.id),
      eq(properties.status, "sold"),
    ];

    // Filter by date range if provided
    if (startDate) {
      conditions.push(gte(properties.updatedAt, new Date(startDate)));
    }
    if (endDate) {
      conditions.push(lte(properties.updatedAt, new Date(endDate)));
    }

    // Get sold properties with commission data
    const soldProperties = await db
      .select()
      .from(properties)
      .where(and(...conditions));

    // Calculate commission metrics
    const totalCommission = soldProperties.reduce((sum, prop) => {
      const price = prop.price || 0;
      const commissionRate = prop.commissionRate || 0;
      return sum + price * (commissionRate / 100);
    }, 0);

    const totalSalesValue = soldProperties.reduce(
      (sum, prop) => sum + (prop.price || 0),
      0
    );

    const averageCommissionRate =
      soldProperties.length > 0
        ? soldProperties.reduce(
            (sum, prop) => sum + (prop.commissionRate || 0),
            0
          ) / soldProperties.length
        : 0;

    // Commission by property
    const commissionByProperty = soldProperties.map((prop) => {
      const price = prop.price || 0;
      const commissionRate = prop.commissionRate || 0;
      const commission = price * (commissionRate / 100);
      return {
        propertyId: prop.id,
        propertyTitle: prop.title,
        propertyAddress: prop.address,
        salePrice: price,
        commissionRate,
        commission,
        soldDate: prop.updatedAt,
      };
    });

    // Commission by month
    const commissionByMonth = soldProperties.reduce((acc, prop) => {
      if (prop.updatedAt) {
        const date = new Date(prop.updatedAt);
        const monthKey = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;
        const price = prop.price || 0;
        const commissionRate = prop.commissionRate || 0;
        const commission = price * (commissionRate / 100);
        acc[monthKey] = (acc[monthKey] || 0) + commission;
      }
      return acc;
    }, {} as Record<string, number>);

    // Commission by property type
    const commissionByType = soldProperties.reduce((acc, prop) => {
      const type = prop.propertyType || "unknown";
      const price = prop.price || 0;
      const commissionRate = prop.commissionRate || 0;
      const commission = price * (commissionRate / 100);
      acc[type] = (acc[type] || 0) + commission;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json(
      {
        summary: {
          totalCommission,
          totalSalesValue,
          averageCommissionRate,
          totalSales: soldProperties.length,
        },
        commissionByProperty,
        commissionByMonth,
        commissionByType,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Commission report error:", error);
    return NextResponse.json(
      { error: "Internal server error: " + (error as Error).message },
      { status: 500 }
    );
  }
}

