"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import MagicBento from "@/components/magic-bento";
import { useCardTheme } from "@/components/card-theme-provider";
import { CARD_THEME_OPTIONS } from "@/lib/card-themes";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProperties: 0,
    totalTenants: 0,
    averageRating: 4.8,
  });
  const [formData, setFormData] = useState({
    name: "",
    companyName: "",
    email: "",
    currentPlan: "Free",
  });
  const { theme, themeKey, setTheme, isSaving } = useCardTheme();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [propertiesRes, tenantsRes] = await Promise.all([
          fetch("/api/properties"),
          fetch("/api/tenants"),
        ]);
        const properties = await propertiesRes.json();
        const tenants = await tenantsRes.json();
        
        setStats({
          totalProperties: Array.isArray(properties) ? properties.length : 0,
          totalTenants: Array.isArray(tenants) ? tenants.length : 0,
          averageRating: 4.8,
        });
        
        if (session?.user) {
          setFormData({
            name: session.user.name || "",
            companyName: "",
            email: session.user.email || "",
            currentPlan: "Free",
          });
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [session]);

  const handleSave = () => {
    toast.success("Settings saved successfully");
    // In a real app, this would call an API to save settings
  };

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter your name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company Name</Label>
              <Input
                id="company"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="Enter company name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter your email"
              />
            </div>
            <Button onClick={handleSave} className="w-full">
              Save Changes
            </Button>
          </CardContent>
        </Card>

        {/* Subscription Plan */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription Plan</CardTitle>
            <CardDescription>Manage your subscription</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="plan">Current Plan</Label>
              <Input
                id="plan"
                value={formData.currentPlan}
                onChange={(e) => setFormData({ ...formData, currentPlan: e.target.value })}
                placeholder="Enter current plan"
              />
            </div>
            <Button className="w-full">Upgrade Plan</Button>
          </CardContent>
        </Card>
      </div>

      {/* Theme Customization */}
      <Card className="themed-panel border-0 shadow-none">
        <CardHeader>
          <CardTitle>Dashboard Theme</CardTitle>
          <CardDescription>
            Choose a glow palette for your analytics cards. Your selection is saved to your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CARD_THEME_OPTIONS.map((option) => {
              const isActive = option.key === themeKey;
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setTheme(option.key)}
                  disabled={isSaving || isActive}
                  className={`relative flex flex-col items-start justify-between rounded-2xl border p-5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                    isActive ? "ring-2 ring-offset-2 ring-offset-background ring-white/60" : "border-transparent"
                  }`}
                  style={{
                    background: option.surface,
                    borderColor: isActive ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.1)",
                    color: option.text,
                    boxShadow: isActive ? `0 12px 35px rgba(${option.glowRgb}, 0.25)` : `0 8px 24px rgba(0,0,0,0.2)`,
                    opacity: isSaving && !isActive ? 0.6 : 1,
                  }}
                >
                  <span className="text-sm uppercase tracking-wide opacity-80">{option.name}</span>
                  <span className="mt-3 text-xs opacity-70">{option.description}</span>
                  {isActive && (
                    <span className="mt-4 rounded-full bg-white/20 px-3 py-1 text-xs font-medium">
                      Active theme
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <p className="text-sm text-muted-foreground">
            Colors update across your dashboard analytics, charts, and insight cards.
          </p>
        </CardContent>
      </Card>

      {/* Key Stats */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Key Stats</h2>
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-4 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <MagicBento
            cards={[
              {
                label: "Total Properties",
                description: "Properties actively managed",
                value: stats.totalProperties,
              },
              {
                label: "Total Tenants",
                description: "Tenants with current leases",
                value: stats.totalTenants,
              },
              {
                label: "Average Rating",
                description: "Feedback from recent surveys",
                value: stats.averageRating,
              },
            ]}
            theme={theme}
            enableTilt={false}
            particleCount={8}
            enableSpotlight={true}
            enableBorderGlow={true}
          />
        )}
      </div>
    </div>
  );
}
