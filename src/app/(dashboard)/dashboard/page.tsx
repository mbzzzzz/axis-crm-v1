"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Line, LineChart, Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import MagicBento, { BentoCardProps } from "@/components/magic-bento";
import { useCardTheme } from "@/components/card-theme-provider";

interface DashboardStats {
  occupancyRate: number;
  totalRentalIncome: number;
  averageRent: number;
  rentalIncomeTrend: number;
  propertyOccupancy: number;
  totalProperties: number;
  activeTenants: number;
  pendingMaintenance: number;
}

interface TenantActivity {
  tenant: string;
  property: string;
  leaseStart: string;
  leaseEnd: string;
  status: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [rentalIncomeData, setRentalIncomeData] = useState<any[]>([]);
  const [occupancyData, setOccupancyData] = useState<any[]>([]);
  const [tenantActivities, setTenantActivities] = useState<TenantActivity[]>([]);
  const [bentoCards, setBentoCards] = useState<BentoCardProps[]>([]);
  const { theme } = useCardTheme();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [propertiesRes, invoicesRes, tenantsRes, maintenanceRes] = await Promise.all([
          fetch("/api/properties"),
          fetch("/api/invoices"),
          fetch("/api/tenants"),
          fetch("/api/maintenance").catch(() => ({ ok: false, json: async () => ({ error: 'Failed to fetch' }) })),
        ]);

        // Check if responses are OK and parse JSON
        const propertiesData = propertiesRes.ok ? await propertiesRes.json() : [];
        const invoicesData = invoicesRes.ok ? await invoicesRes.json() : [];
        const tenantsData = tenantsRes.ok ? await tenantsRes.json() : [];
        const maintenanceData = maintenanceRes.ok ? await maintenanceRes.json() : [];

        // Ensure all data is an array
        const properties = Array.isArray(propertiesData) ? propertiesData : [];
        const invoices = Array.isArray(invoicesData) ? invoicesData : [];
        const tenants = Array.isArray(tenantsData) ? tenantsData : [];
        const maintenance = Array.isArray(maintenanceData) ? maintenanceData : [];

        // Calculate stats
        const totalRevenue = invoices
          .filter((inv: any) => inv.paymentStatus === "paid")
          .reduce((sum: number, inv: any) => sum + (inv.totalAmount || 0), 0);

        const occupiedProperties = properties.filter((p: any) => 
          p.status === "rented" || p.status === "occupied"
        ).length;
        const occupancyRate = properties.length > 0 
          ? Math.round((occupiedProperties / properties.length) * 100)
          : 0;

        const rentalInvoices = invoices.filter((inv: any) => inv.paymentStatus === "paid");
        const averageRent = rentalInvoices.length > 0
          ? Math.round(totalRevenue / rentalInvoices.length)
          : 0;

        // Calculate rental income trend (last 7 months)
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"];
        const now = new Date();
        const incomeData = months.map((month, index) => {
          const monthDate = new Date(now.getFullYear(), now.getMonth() - (6 - index), 1);
          const monthStart = monthDate.toISOString().split('T')[0];
          const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).toISOString().split('T')[0];
          
          const monthInvoices = invoices.filter((inv: any) => {
            if (inv.paymentStatus !== "paid" || !inv.paymentDate) return false;
            return inv.paymentDate >= monthStart && inv.paymentDate <= monthEnd;
          });
          
          const monthIncome = monthInvoices.reduce((sum: number, inv: any) => sum + (inv.totalAmount || 0), 0);
          
          return {
            month,
            income: monthIncome || 0,
          };
        });
        setRentalIncomeData(incomeData);

        // Calculate property occupancy data from actual properties
        const propertyOccupancyData = properties.slice(0, 5).map((prop: any, index: number) => ({
          property: prop.title || `Property ${String.fromCharCode(65 + index)}`,
          occupancy: prop.status === "rented" || prop.status === "occupied" ? 100 : 0,
        }));
        
        // Fill remaining slots if less than 5 properties
        while (propertyOccupancyData.length < 5) {
          propertyOccupancyData.push({
            property: `Property ${String.fromCharCode(65 + propertyOccupancyData.length)}`,
            occupancy: 0,
          });
        }
        setOccupancyData(propertyOccupancyData);

        // Get tenant activities from real data
        const activities: TenantActivity[] = tenants.slice(0, 5).map((tenant: any) => ({
          tenant: tenant.name,
          property: tenant.property ? `${tenant.property.address || tenant.property.title}` : "N/A",
          leaseStart: tenant.leaseStart,
          leaseEnd: tenant.leaseEnd,
          status: tenant.leaseStatus === "active" ? "Active" : tenant.leaseStatus === "expired" ? "Expired" : "Pending",
        }));
        setTenantActivities(activities);

        // Calculate trend (compare last month to previous month)
        const lastMonthIncome = incomeData[incomeData.length - 1]?.income || 0;
        const prevMonthIncome = incomeData[incomeData.length - 2]?.income || 0;
        const trend = prevMonthIncome > 0 
          ? Math.round(((lastMonthIncome - prevMonthIncome) / prevMonthIncome) * 100)
          : 0;

        // Calculate additional stats
        const totalProperties = properties.length;
        const activeTenants = tenants.filter((t: any) => t.leaseStatus === "active").length;
        const pendingMaintenance = Array.isArray(maintenance) 
          ? maintenance.filter((m: any) => m.status === "open" || m.status === "in_progress").length 
          : 0;

        setStats({
          occupancyRate,
          totalRentalIncome: totalRevenue,
          averageRent,
          rentalIncomeTrend: trend,
          propertyOccupancy: occupancyRate,
          totalProperties,
          activeTenants,
          pendingMaintenance,
        });

        // Create Bento cards
        const cards: BentoCardProps[] = [
          {
            label: 'Occupancy Rate',
            description: 'Properties currently occupied',
            value: `${occupancyRate}%`,
            trend: occupancyRate > 0 ? 5 : 0,
          },
          {
            label: 'Total Income',
            description: 'Total rental income collected',
            value: totalRevenue,
            trend: trend,
          },
          {
            label: 'Average Rent',
            description: 'Average monthly rental amount',
            value: averageRent,
          },
          {
            label: 'Properties',
            description: 'Total properties managed',
            value: totalProperties,
          },
          {
            label: 'Active Tenants',
            description: 'Tenants with active leases',
            value: activeTenants,
          },
          {
            label: 'Maintenance',
            description: 'Pending maintenance requests',
            value: pendingMaintenance,
            trend: pendingMaintenance > 0 ? -pendingMaintenance : 0,
          },
        ];
        setBentoCards(cards);

      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="flex flex-1 flex-col gap-4 sm:gap-6">
      <div className="space-y-1 sm:space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Overview of your property management activities
        </p>
      </div>

      {/* Magic Bento Analytics Cards */}
      {isLoading ? (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24 sm:w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20 sm:w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <MagicBento
          cards={bentoCards}
          textAutoHide={true}
          enableStars={true}
          enableSpotlight={true}
          enableBorderGlow={true}
          enableTilt={false}
          enableMagnetism={true}
          clickEffect={true}
          spotlightRadius={300}
          particleCount={12}
          theme={theme}
        />
      )}

      {/* Key Metrics Section */}
      <div className="space-y-3 sm:space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Key Metrics</h2>
        <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
          <Card className="themed-panel border-0 shadow-none">
            <CardHeader>
              <CardTitle>Rental Income Trend</CardTitle>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold">
                  ${(stats?.totalRentalIncome || 0).toLocaleString()}
                </div>
                <div className="text-sm" style={{ color: theme.muted }}>
                  Last 12 Months +{stats?.rentalIncomeTrend || 0}%
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[200px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={rentalIncomeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="month" tick={{ fill: theme.muted }} stroke="transparent" />
                    <YAxis tick={{ fill: theme.muted }} stroke="transparent" />
                    <Tooltip
                      contentStyle={{ background: theme.surface, borderRadius: 12, border: theme.border }}
                      labelStyle={{ color: theme.text }}
                      itemStyle={{ color: theme.accent }}
                    />
                    <Line type="monotone" dataKey="income" stroke={theme.accent} strokeWidth={2} dot={{ stroke: theme.accent }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="themed-panel border-0 shadow-none">
            <CardHeader>
              <CardTitle>Property Occupancy</CardTitle>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold">{stats?.propertyOccupancy || 0}%</div>
                <div className="text-sm" style={{ color: theme.muted }}>
                  Current -2%
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[200px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={occupancyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="property" tick={{ fill: theme.muted }} stroke="transparent" />
                    <YAxis tick={{ fill: theme.muted }} stroke="transparent" />
                    <Tooltip
                      contentStyle={{ background: theme.surface, borderRadius: 12, border: theme.border }}
                      labelStyle={{ color: theme.text }}
                      itemStyle={{ color: theme.accent }}
                    />
                    <Bar dataKey="occupancy" fill={theme.accent} radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Tenant Activities */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Recent Tenant Activities</h2>
        <Card>
          <CardHeader>
            <CardTitle>All Tenants</CardTitle>
            <CardDescription>Recent lease activities</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Lease Start</TableHead>
                    <TableHead>Lease End</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenantActivities.map((activity, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{activity.tenant}</TableCell>
                      <TableCell>{activity.property}</TableCell>
                      <TableCell>{new Date(activity.leaseStart).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(activity.leaseEnd).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-gray-100 text-gray-700">
                          {activity.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
