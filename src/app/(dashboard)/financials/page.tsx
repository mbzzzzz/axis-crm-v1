"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bar, BarChart, Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

export default function FinancialsPage() {
  const [salePrice, setSalePrice] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [additionalCosts, setAdditionalCosts] = useState("");
  const [profit, setProfit] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [netProfit, setNetProfit] = useState(0);
  const [incomeVsExpensesData, setIncomeVsExpensesData] = useState<any[]>([]);
  const [rentalRevenueData, setRentalRevenueData] = useState<any[]>([]);

  useEffect(() => {
    const fetchFinancialData = async () => {
      try {
        const [invoicesRes, propertiesRes] = await Promise.all([
          fetch("/api/invoices"),
          fetch("/api/properties"),
        ]);

        const invoices = await invoicesRes.json();
        const properties = await propertiesRes.json();

        // Calculate total revenue from paid invoices
        const revenue = invoices
          .filter((inv: any) => inv.paymentStatus === "paid")
          .reduce((sum: number, inv: any) => sum + (inv.totalAmount || 0), 0);

        // Calculate total expenses from properties (monthly expenses * 12 as approximation)
        const expenses = properties.reduce((sum: number, prop: any) => {
          return sum + ((prop.monthlyExpenses || 0) * 12);
        }, 0);

        const profit = revenue - expenses;

        setTotalRevenue(revenue);
        setTotalExpenses(expenses);
        setNetProfit(profit);

        // Generate income vs expenses data (last 7 months)
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"];
        const now = new Date();
        const incomeExpensesData = months.map((month, index) => {
          const monthDate = new Date(now.getFullYear(), now.getMonth() - (6 - index), 1);
          const monthStart = monthDate.toISOString().split('T')[0];
          const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).toISOString().split('T')[0];
          
          const monthInvoices = invoices.filter((inv: any) => {
            if (inv.paymentStatus !== "paid" || !inv.paymentDate) return false;
            return inv.paymentDate >= monthStart && inv.paymentDate <= monthEnd;
          });
          
          const monthIncome = monthInvoices.reduce((sum: number, inv: any) => sum + (inv.totalAmount || 0), 0);
          const monthExpenses = (expenses / 12) || 0; // Approximate monthly expenses
          
          return {
            month,
            income: monthIncome || 0,
            expenses: monthExpenses,
          };
        });
        setIncomeVsExpensesData(incomeExpensesData);

        // Generate rental revenue trends (same as income)
        setRentalRevenueData(incomeExpensesData.map(d => ({ month: d.month, revenue: d.income })));

      } catch (error) {
        console.error("Failed to fetch financial data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFinancialData();
  }, []);

  const calculateProfit = () => {
    const sale = parseFloat(salePrice) || 0;
    const purchase = parseFloat(purchasePrice) || 0;
    const costs = parseFloat(additionalCosts) || 0;
    const calculatedProfit = sale - purchase - costs;
    setProfit(calculatedProfit);
  };

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Financial Dashboard</h1>
        <p className="text-muted-foreground">
          Track your financial performance and key metrics
        </p>
      </div>

      {/* Overview Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Overview</h2>
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-4 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">${totalRevenue.toLocaleString()}</div>
                <div className="text-sm text-green-600 mt-1">+15%</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Expenses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">${totalExpenses.toLocaleString()}</div>
                <div className="text-sm text-red-600 mt-1">-10%</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Net Profit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">${netProfit.toLocaleString()}</div>
                <div className="text-sm text-green-600 mt-1">+20%</div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Income vs Expenses Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Income vs. Expenses</h2>
        <Card>
          <CardHeader>
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-bold">${totalRevenue.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">This Year +15%</div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={incomeVsExpensesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="income" fill="#94a3b8" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Rental Revenue Trends Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Rental Revenue Trends</h2>
        <Card>
          <CardHeader>
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-bold">$1,000,000</div>
              <div className="text-sm text-muted-foreground">Last 12 Months +12%</div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={rentalRevenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Profit from Property Sales Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Profit from Property Sales</h2>
        <Card>
          <CardHeader>
            <CardTitle>Calculate Property Sale Profit</CardTitle>
            <CardDescription>Enter property sale details to calculate profit</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sale-price">Property Sale Price</Label>
              <Input
                id="sale-price"
                type="number"
                placeholder="Enter sale price"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="purchase-price">Property Purchase Price</Label>
              <Input
                id="purchase-price"
                type="number"
                placeholder="Enter purchase price"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="additional-costs">Additional Costs (e.g., renovations)</Label>
              <Input
                id="additional-costs"
                type="number"
                placeholder="Enter additional costs"
                value={additionalCosts}
                onChange={(e) => setAdditionalCosts(e.target.value)}
              />
            </div>
            <Button onClick={calculateProfit} className="w-full">
              Calculate Profit
            </Button>
            {profit !== null && (
              <Card className="bg-muted">
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Profit from Sale</div>
                    <div className="text-3xl font-bold">${profit.toLocaleString()}</div>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

