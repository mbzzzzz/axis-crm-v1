"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Download, TrendingUp, DollarSign, Percent } from "lucide-react";
import { toast } from "sonner";
import { exportToCSV, exportToExcel } from "@/lib/export-utils";

interface SalesReportData {
  summary: {
    totalSales: number;
    totalRevenue: number;
    averageSalePrice: number;
    totalProperties: number;
    conversionRate: number;
  };
  salesByType: Record<string, number>;
  salesByMonth: Record<string, number>;
  revenueByMonth: Record<string, number>;
  properties: Array<{
    id: number;
    title: string;
    address: string;
    propertyType: string;
    price: number;
    soldDate: string;
  }>;
}

interface CommissionReportData {
  summary: {
    totalCommission: number;
    totalSalesValue: number;
    averageCommissionRate: number;
    totalSales: number;
  };
  commissionByProperty: Array<{
    propertyId: number;
    propertyTitle: string;
    propertyAddress: string;
    salePrice: number;
    commissionRate: number;
    commission: number;
    soldDate: string;
  }>;
  commissionByMonth: Record<string, number>;
  commissionByType: Record<string, number>;
}

interface ProfitLossReportData {
  summary: {
    totalRevenue: number;
    pendingRevenue: number;
    totalExpenses: number;
    netProfit: number;
    profitMargin: number;
  };
  expensesByCategory: Record<string, number>;
  revenueByMonth: Record<string, number>;
  expensesByMonth: Record<string, number>;
  profitByMonth: Record<string, number>;
  invoices: Array<{
    id: number;
    invoiceNumber: string;
    clientName: string;
    totalAmount: number;
    invoiceDate: string;
  }>;
  expenses: Array<{
    id: string;
    description: string;
    amount: number;
    category: string;
    date: string;
  }>;
}

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#8dd1e1"];

export default function ReportsPage() {
  const [salesReport, setSalesReport] = useState<SalesReportData | null>(null);
  const [commissionReport, setCommissionReport] = useState<CommissionReportData | null>(null);
  const [profitLossReport, setProfitLossReport] = useState<ProfitLossReportData | null>(null);
  const [loading, setLoading] = useState({
    sales: false,
    commission: false,
    profitLoss: false,
  });
  const [openDialog, setOpenDialog] = useState<"sales" | "commission" | "profitLoss" | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });

  const fetchSalesReport = async () => {
    setLoading((prev) => ({ ...prev, sales: true }));
    try {
      const params = new URLSearchParams();
      if (dateRange.startDate) params.append("startDate", dateRange.startDate);
      if (dateRange.endDate) params.append("endDate", dateRange.endDate);
      const res = await fetch(`/api/reports/sales?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch sales report");
      const data = await res.json();
      setSalesReport(data);
    } catch (error) {
      toast.error("Failed to load sales report");
      console.error(error);
    } finally {
      setLoading((prev) => ({ ...prev, sales: false }));
    }
  };

  const fetchCommissionReport = async () => {
    setLoading((prev) => ({ ...prev, commission: true }));
    try {
      const params = new URLSearchParams();
      if (dateRange.startDate) params.append("startDate", dateRange.startDate);
      if (dateRange.endDate) params.append("endDate", dateRange.endDate);
      const res = await fetch(`/api/reports/commission?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch commission report");
      const data = await res.json();
      setCommissionReport(data);
    } catch (error) {
      toast.error("Failed to load commission report");
      console.error(error);
    } finally {
      setLoading((prev) => ({ ...prev, commission: false }));
    }
  };

  const fetchProfitLossReport = async () => {
    setLoading((prev) => ({ ...prev, profitLoss: true }));
    try {
      const params = new URLSearchParams();
      if (dateRange.startDate) params.append("startDate", dateRange.startDate);
      if (dateRange.endDate) params.append("endDate", dateRange.endDate);
      const res = await fetch(`/api/reports/profit-loss?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch profit & loss report");
      const data = await res.json();
      setProfitLossReport(data);
    } catch (error) {
      toast.error("Failed to load profit & loss report");
      console.error(error);
    } finally {
      setLoading((prev) => ({ ...prev, profitLoss: false }));
    }
  };

  const handleOpenReport = (type: "sales" | "commission" | "profitLoss") => {
    setOpenDialog(type);
    if (type === "sales" && !salesReport) {
      fetchSalesReport();
    } else if (type === "commission" && !commissionReport) {
      fetchCommissionReport();
    } else if (type === "profitLoss" && !profitLossReport) {
      fetchProfitLossReport();
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const exportSalesReport = () => {
    if (!salesReport) return;
    const data = salesReport.properties.map((prop) => ({
      "Property Title": prop.title,
      Address: prop.address,
      "Property Type": prop.propertyType,
      "Sale Price": prop.price,
      "Sold Date": prop.soldDate,
    }));
    exportToCSV(data, `sales-report-${new Date().toISOString().split("T")[0]}.csv`);
    toast.success("Sales report exported");
  };

  const exportCommissionReport = () => {
    if (!commissionReport) return;
    const data = commissionReport.commissionByProperty.map((item) => ({
      "Property Title": item.propertyTitle,
      Address: item.propertyAddress,
      "Sale Price": item.salePrice,
      "Commission Rate": `${item.commissionRate}%`,
      Commission: item.commission,
      "Sold Date": item.soldDate,
    }));
    exportToCSV(data, `commission-report-${new Date().toISOString().split("T")[0]}.csv`);
    toast.success("Commission report exported");
  };

  const exportProfitLossReport = () => {
    if (!profitLossReport) return;
    const data = [
      ...profitLossReport.invoices.map((inv) => ({
        Type: "Revenue",
        Description: inv.invoiceNumber,
        "Client Name": inv.clientName,
        Amount: inv.totalAmount,
        Date: inv.invoiceDate,
      })),
      ...profitLossReport.expenses.map((exp) => ({
        Type: "Expense",
        Description: exp.description,
        Category: exp.category,
        Amount: -exp.amount,
        Date: exp.date,
      })),
    ];
    exportToCSV(data, `profit-loss-report-${new Date().toISOString().split("T")[0]}.csv`);
    toast.success("Profit & Loss report exported");
  };

  // Prepare chart data
  const salesByTypeData = salesReport
    ? Object.entries(salesReport.salesByType).map(([name, value]) => ({ name, value }))
    : [];

  const salesByMonthData = salesReport
    ? Object.entries(salesReport.salesByMonth)
        .sort()
        .map(([month, count]) => {
          const revenue = salesReport.revenueByMonth[month] || 0;
          return { month, count, revenue };
        })
    : [];

  const commissionByMonthData = commissionReport
    ? Object.entries(commissionReport.commissionByMonth)
        .sort()
        .map(([month, commission]) => ({ month, commission }))
    : [];

  const commissionByTypeData = commissionReport
    ? Object.entries(commissionReport.commissionByType).map(([name, value]) => ({ name, value }))
    : [];

  const profitLossChartData = profitLossReport
    ? Object.keys({ ...profitLossReport.revenueByMonth, ...profitLossReport.expensesByMonth })
        .sort()
        .map((month) => ({
          month,
          revenue: profitLossReport.revenueByMonth[month] || 0,
          expenses: profitLossReport.expensesByMonth[month] || 0,
          profit: profitLossReport.profitByMonth[month] || 0,
        }))
    : [];

  const expensesByCategoryData = profitLossReport
    ? Object.entries(profitLossReport.expensesByCategory).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">View and generate business reports</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleOpenReport("sales")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="size-5" />
              Sales Report
            </CardTitle>
            <CardDescription>Property sales performance</CardDescription>
          </CardHeader>
          <CardContent>
            {loading.sales ? (
              <Skeleton className="h-20" />
            ) : salesReport ? (
              <div className="space-y-2">
                <div className="text-2xl font-bold">{salesReport.summary.totalSales}</div>
                <p className="text-sm text-muted-foreground">
                  Total sales • {formatCurrency(salesReport.summary.totalRevenue)}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Click to view report</p>
            )}
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleOpenReport("commission")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="size-5" />
              Commission Report
            </CardTitle>
            <CardDescription>Agent commission tracking</CardDescription>
          </CardHeader>
          <CardContent>
            {loading.commission ? (
              <Skeleton className="h-20" />
            ) : commissionReport ? (
              <div className="space-y-2">
                <div className="text-2xl font-bold">{formatCurrency(commissionReport.summary.totalCommission)}</div>
                <p className="text-sm text-muted-foreground">
                  From {commissionReport.summary.totalSales} sales
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Click to view report</p>
            )}
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleOpenReport("profitLoss")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="size-5" />
              Profit & Loss Report
            </CardTitle>
            <CardDescription>Financial performance overview</CardDescription>
          </CardHeader>
          <CardContent>
            {loading.profitLoss ? (
              <Skeleton className="h-20" />
            ) : profitLossReport ? (
              <div className="space-y-2">
                <div className={`text-2xl font-bold ${profitLossReport.summary.netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {formatCurrency(profitLossReport.summary.netProfit)}
                </div>
                <p className="text-sm text-muted-foreground">
                  Net profit • {profitLossReport.summary.profitMargin.toFixed(1)}% margin
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Click to view report</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sales Report Dialog */}
      <Dialog open={openDialog === "sales"} onOpenChange={(open) => !open && setOpenDialog(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sales Report</DialogTitle>
            <DialogDescription>Property sales performance analysis</DialogDescription>
          </DialogHeader>
          {loading.sales ? (
            <div className="space-y-4">
              <Skeleton className="h-64" />
              <Skeleton className="h-64" />
            </div>
          ) : salesReport ? (
            <Tabs defaultValue="summary" className="w-full">
              <div className="flex justify-between items-center mb-4">
                <TabsList>
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                  <TabsTrigger value="charts">Charts</TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                </TabsList>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                    className="w-40"
                  />
                  <Input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                    className="w-40"
                  />
                  <Button onClick={fetchSalesReport} size="sm">Apply</Button>
                  <Button onClick={exportSalesReport} size="sm" variant="outline">
                    <Download className="size-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>

              <TabsContent value="summary" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Total Sales</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{salesReport.summary.totalSales}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Total Revenue</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{formatCurrency(salesReport.summary.totalRevenue)}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Average Sale Price</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{formatCurrency(salesReport.summary.averageSalePrice)}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Conversion Rate</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{salesReport.summary.conversionRate.toFixed(1)}%</div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="charts" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Sales by Property Type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={salesByTypeData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {salesByTypeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Sales & Revenue by Month</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={salesByMonthData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip formatter={(value, name) => {
                          if (name === "revenue") return formatCurrency(Number(value));
                          return value;
                        }} />
                        <Legend />
                        <Bar yAxisId="left" dataKey="count" fill="#8884d8" name="Sales Count" />
                        <Bar yAxisId="right" dataKey="revenue" fill="#82ca9d" name="Revenue" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="details">
                <div className="space-y-2">
                  {salesReport.properties.map((prop) => (
                    <Card key={prop.id}>
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-semibold">{prop.title}</div>
                            <div className="text-sm text-muted-foreground">{prop.address}</div>
                            <div className="text-sm text-muted-foreground">{prop.propertyType}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">{formatCurrency(prop.price)}</div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(prop.soldDate).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Commission Report Dialog */}
      <Dialog open={openDialog === "commission"} onOpenChange={(open) => !open && setOpenDialog(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Commission Report</DialogTitle>
            <DialogDescription>Agent commission tracking and analysis</DialogDescription>
          </DialogHeader>
          {loading.commission ? (
            <div className="space-y-4">
              <Skeleton className="h-64" />
              <Skeleton className="h-64" />
            </div>
          ) : commissionReport ? (
            <Tabs defaultValue="summary" className="w-full">
              <div className="flex justify-between items-center mb-4">
                <TabsList>
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                  <TabsTrigger value="charts">Charts</TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                </TabsList>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                    className="w-40"
                  />
                  <Input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                    className="w-40"
                  />
                  <Button onClick={fetchCommissionReport} size="sm">Apply</Button>
                  <Button onClick={exportCommissionReport} size="sm" variant="outline">
                    <Download className="size-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>

              <TabsContent value="summary" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Total Commission</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{formatCurrency(commissionReport.summary.totalCommission)}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Total Sales Value</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{formatCurrency(commissionReport.summary.totalSalesValue)}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Average Commission Rate</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{commissionReport.summary.averageCommissionRate.toFixed(1)}%</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Total Sales</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{commissionReport.summary.totalSales}</div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="charts" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Commission by Month</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={commissionByMonthData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Legend />
                        <Line type="monotone" dataKey="commission" stroke="#8884d8" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Commission by Property Type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={commissionByTypeData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Bar dataKey="value" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="details">
                <div className="space-y-2">
                  {commissionReport.commissionByProperty.map((item, idx) => (
                    <Card key={idx}>
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-semibold">{item.propertyTitle}</div>
                            <div className="text-sm text-muted-foreground">{item.propertyAddress}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">{formatCurrency(item.commission)}</div>
                            <div className="text-sm text-muted-foreground">
                              {item.commissionRate}% of {formatCurrency(item.salePrice)}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Profit & Loss Report Dialog */}
      <Dialog open={openDialog === "profitLoss"} onOpenChange={(open) => !open && setOpenDialog(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Profit & Loss Report</DialogTitle>
            <DialogDescription>Financial performance overview</DialogDescription>
          </DialogHeader>
          {loading.profitLoss ? (
            <div className="space-y-4">
              <Skeleton className="h-64" />
              <Skeleton className="h-64" />
            </div>
          ) : profitLossReport ? (
            <Tabs defaultValue="summary" className="w-full">
              <div className="flex justify-between items-center mb-4">
                <TabsList>
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                  <TabsTrigger value="charts">Charts</TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                </TabsList>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                    className="w-40"
                  />
                  <Input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                    className="w-40"
                  />
                  <Button onClick={fetchProfitLossReport} size="sm">Apply</Button>
                  <Button onClick={exportProfitLossReport} size="sm" variant="outline">
                    <Download className="size-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>

              <TabsContent value="summary" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Total Revenue</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">{formatCurrency(profitLossReport.summary.totalRevenue)}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Pending Revenue</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-yellow-600">{formatCurrency(profitLossReport.summary.pendingRevenue)}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Total Expenses</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">{formatCurrency(profitLossReport.summary.totalExpenses)}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Net Profit</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-2xl font-bold ${profitLossReport.summary.netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {formatCurrency(profitLossReport.summary.netProfit)}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Profit Margin</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-2xl font-bold ${profitLossReport.summary.profitMargin >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {profitLossReport.summary.profitMargin.toFixed(1)}%
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="charts" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue vs Expenses</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={profitLossChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Legend />
                        <Line type="monotone" dataKey="revenue" stroke="#82ca9d" strokeWidth={2} name="Revenue" />
                        <Line type="monotone" dataKey="expenses" stroke="#ff7300" strokeWidth={2} name="Expenses" />
                        <Line type="monotone" dataKey="profit" stroke="#8884d8" strokeWidth={2} name="Profit" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Expenses by Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={expensesByCategoryData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {expensesByCategoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="details" className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Revenue (Paid Invoices)</h3>
                  <div className="space-y-2">
                    {profitLossReport.invoices.map((inv) => (
                      <Card key={inv.id}>
                        <CardContent className="pt-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-semibold">{inv.invoiceNumber}</div>
                              <div className="text-sm text-muted-foreground">{inv.clientName}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-green-600">{formatCurrency(inv.totalAmount)}</div>
                              <div className="text-sm text-muted-foreground">{inv.invoiceDate}</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Expenses</h3>
                  <div className="space-y-2">
                    {profitLossReport.expenses.map((exp) => (
                      <Card key={exp.id}>
                        <CardContent className="pt-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-semibold">{exp.description}</div>
                              <div className="text-sm text-muted-foreground">{exp.category}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-red-600">{formatCurrency(exp.amount)}</div>
                              <div className="text-sm text-muted-foreground">{new Date(exp.date).toLocaleDateString()}</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
