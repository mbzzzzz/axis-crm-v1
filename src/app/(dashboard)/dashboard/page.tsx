"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, FileText, DollarSign, TrendingUp, TrendingDown, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Bar, BarChart, Line, LineChart, Pie, PieChart, Cell, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface DashboardStats {
  totalProperties: number;
  totalInvoices: number;
  totalRevenue: number;
  pendingInvoices: number;
  availableProperties: number;
  soldProperties: number;
  averagePropertyValue: number;
  monthlyRevenue: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [propertyData, setPropertyData] = useState<any[]>([]);
  const [invoiceData, setInvoiceData] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [propertiesRes, invoicesRes] = await Promise.all([
          fetch("/api/properties"),
          fetch("/api/invoices"),
        ]);

        const properties = await propertiesRes.json();
        const invoices = await invoicesRes.json();

        const totalRevenue = invoices
          .filter((inv: any) => inv.paymentStatus === "paid")
          .reduce((sum: number, inv: any) => sum + inv.totalAmount, 0);

        const pendingInvoices = invoices.filter(
          (inv: any) => inv.paymentStatus === "sent" || inv.paymentStatus === "draft"
        ).length;

        const availableProperties = properties.filter((p: any) => p.status === "available").length;
        const soldProperties = properties.filter((p: any) => p.status === "sold" || p.status === "rented").length;
        const averagePropertyValue = properties.length > 0
          ? properties.reduce((sum: number, p: any) => sum + p.price, 0) / properties.length
          : 0;

        // Calculate monthly revenue (last 6 months)
        const monthlyRevenue = invoices
          .filter((inv: any) => {
            const invoiceDate = new Date(inv.invoiceDate);
            const oneMonthAgo = new Date();
            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
            return invoiceDate >= oneMonthAgo && inv.paymentStatus === "paid";
          })
          .reduce((sum: number, inv: any) => sum + inv.totalAmount, 0);

        setStats({
          totalProperties: properties.length,
          totalInvoices: invoices.length,
          totalRevenue,
          pendingInvoices,
          availableProperties,
          soldProperties,
          averagePropertyValue,
          monthlyRevenue,
        });

        // Property status breakdown
        const statusCounts: Record<string, number> = {};
        properties.forEach((p: any) => {
          statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
        });

        const propertyStatusData = Object.entries(statusCounts).map(([status, count]) => ({
          name: status.replace(/_/g, " ").toUpperCase(),
          value: count,
        }));
        setPropertyData(propertyStatusData);

        // Invoice status breakdown
        const invoiceStatusCounts: Record<string, number> = {};
        invoices.forEach((inv: any) => {
          invoiceStatusCounts[inv.paymentStatus] = (invoiceStatusCounts[inv.paymentStatus] || 0) + 1;
        });

        const invoiceStatusData = Object.entries(invoiceStatusCounts).map(([status, count]) => ({
          name: status.toUpperCase(),
          value: count,
        }));
        setInvoiceData(invoiceStatusData);

      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const statCards = [
    {
      title: "Total Properties",
      value: stats?.totalProperties || 0,
      icon: Building2,
      description: "Active listings",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Total Revenue",
      value: `$${(stats?.totalRevenue || 0).toLocaleString()}`,
      icon: DollarSign,
      description: "All time",
      color: "text-green-600",
      bgColor: "bg-green-100",
      trend: stats?.monthlyRevenue ? `+$${stats.monthlyRevenue.toLocaleString()} this month` : "",
    },
    {
      title: "Pending Invoices",
      value: stats?.pendingInvoices || 0,
      icon: FileText,
      description: "Awaiting payment",
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      title: "Avg Property Value",
      value: `$${(stats?.averagePropertyValue || 0).toLocaleString()}`,
      icon: TrendingUp,
      description: "Portfolio average",
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
  ];

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="mt-6 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's an overview of your real estate business.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-[120px]" />
                  <Skeleton className="size-4 rounded" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-[100px]" />
                  <Skeleton className="mt-2 h-3 w-[140px]" />
                </CardContent>
              </Card>
            ))
          : statCards.map((stat, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <div className={`rounded-full p-2 ${stat.bgColor}`}>
                    <stat.icon className={`size-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                  {stat.trend && (
                    <p className="mt-1 text-xs font-medium text-green-600">{stat.trend}</p>
                  )}
                </CardContent>
              </Card>
            ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Property Status Overview</CardTitle>
            <CardDescription>Distribution of properties by status</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={propertyData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {propertyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Invoice Status Overview</CardTitle>
            <CardDescription>Distribution of invoices by payment status</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={invoiceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6">
                    {invoiceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Business Metrics</CardTitle>
            <CardDescription>Key performance indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              <div className="flex items-center">
                <div className="mr-4 rounded-full bg-blue-100 p-3">
                  <Building2 className="size-6 text-blue-600" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">Available Properties</p>
                  <p className="text-sm text-muted-foreground">
                    Ready for sale or rent
                  </p>
                </div>
                <div className="text-2xl font-bold">{stats?.availableProperties || 0}</div>
              </div>
              <div className="flex items-center">
                <div className="mr-4 rounded-full bg-green-100 p-3">
                  <TrendingUp className="size-6 text-green-600" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">Sold/Rented Properties</p>
                  <p className="text-sm text-muted-foreground">
                    Successfully closed deals
                  </p>
                </div>
                <div className="text-2xl font-bold">{stats?.soldProperties || 0}</div>
              </div>
              <div className="flex items-center">
                <div className="mr-4 rounded-full bg-purple-100 p-3">
                  <Activity className="size-6 text-purple-600" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">Active Invoices</p>
                  <p className="text-sm text-muted-foreground">
                    Total invoices in system
                  </p>
                </div>
                <div className="text-2xl font-bold">{stats?.totalInvoices || 0}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <a
              href="/properties"
              className="flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-muted"
            >
              <Building2 className="size-6 text-blue-600" />
              <div>
                <p className="font-medium">View Properties</p>
                <p className="text-sm text-muted-foreground">Manage your listings</p>
              </div>
            </a>
            <a
              href="/invoices"
              className="flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-muted"
            >
              <FileText className="size-6 text-purple-600" />
              <div>
                <p className="font-medium">View Invoices</p>
                <p className="text-sm text-muted-foreground">Track payments</p>
              </div>
            </a>
            <a
              href="/settings"
              className="flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-muted"
            >
              <TrendingUp className="size-6 text-green-600" />
              <div>
                <p className="font-medium">Settings</p>
                <p className="text-sm text-muted-foreground">Configure integrations</p>
              </div>
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}