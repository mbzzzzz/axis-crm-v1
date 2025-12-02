import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { invoices, expenses } from "@/db/schema-postgres";
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

    // Build invoice conditions
    const invoiceConditions = [eq(invoices.userId, user.id)];
    if (startDate) {
      invoiceConditions.push(gte(invoices.invoiceDate, startDate));
    }
    if (endDate) {
      invoiceConditions.push(lte(invoices.invoiceDate, endDate));
    }

    // Build expense conditions
    const expenseConditions = [eq(expenses.userId, user.id)];
    if (startDate) {
      expenseConditions.push(gte(expenses.date, new Date(startDate)));
    }
    if (endDate) {
      expenseConditions.push(lte(expenses.date, new Date(endDate)));
    }

    // Get paid invoices (revenue)
    const paidInvoices = await db
      .select()
      .from(invoices)
      .where(and(...invoiceConditions, eq(invoices.paymentStatus, "paid")));

    // Get all invoices for pending revenue
    const allInvoices = await db
      .select()
      .from(invoices)
      .where(and(...invoiceConditions));

    // Get expenses
    const allExpenses = await db
      .select()
      .from(expenses)
      .where(and(...expenseConditions));

    // Calculate revenue
    const totalRevenue = paidInvoices.reduce(
      (sum, inv) => sum + (inv.totalAmount || 0),
      0
    );

    const pendingRevenue = allInvoices
      .filter((inv) => inv.paymentStatus !== "paid")
      .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);

    // Calculate expenses
    const totalExpenses = allExpenses.reduce(
      (sum, exp) => sum + (exp.amount || 0),
      0
    );

    // Expenses by category
    const expensesByCategory = allExpenses.reduce((acc, exp) => {
      const category = exp.category || "uncategorized";
      acc[category] = (acc[category] || 0) + (exp.amount || 0);
      return acc;
    }, {} as Record<string, number>);

    // Calculate profit/loss
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // Revenue by month
    const revenueByMonth = paidInvoices.reduce((acc, inv) => {
      if (inv.invoiceDate) {
        const date = new Date(inv.invoiceDate);
        const monthKey = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;
        acc[monthKey] = (acc[monthKey] || 0) + (inv.totalAmount || 0);
      }
      return acc;
    }, {} as Record<string, number>);

    // Expenses by month
    const expensesByMonth = allExpenses.reduce((acc, exp) => {
      if (exp.date) {
        const date = new Date(exp.date);
        const monthKey = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;
        acc[monthKey] = (acc[monthKey] || 0) + (exp.amount || 0);
      }
      return acc;
    }, {} as Record<string, number>);

    // Profit by month
    const profitByMonth: Record<string, number> = {};
    const allMonths = new Set([
      ...Object.keys(revenueByMonth),
      ...Object.keys(expensesByMonth),
    ]);

    allMonths.forEach((month) => {
      profitByMonth[month] =
        (revenueByMonth[month] || 0) - (expensesByMonth[month] || 0);
    });

    return NextResponse.json(
      {
        summary: {
          totalRevenue,
          pendingRevenue,
          totalExpenses,
          netProfit,
          profitMargin,
        },
        expensesByCategory,
        revenueByMonth,
        expensesByMonth,
        profitByMonth,
        invoices: paidInvoices.map((inv) => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          clientName: inv.clientName,
          totalAmount: inv.totalAmount,
          invoiceDate: inv.invoiceDate,
        })),
        expenses: allExpenses.map((exp) => ({
          id: exp.id,
          description: exp.description,
          amount: exp.amount,
          category: exp.category,
          date: exp.date,
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Profit & Loss report error:", error);
    return NextResponse.json(
      { error: "Internal server error: " + (error as Error).message },
      { status: 500 }
    );
  }
}

