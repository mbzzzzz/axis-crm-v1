"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import MagicBento from "@/components/magic-bento";
import { useCardTheme } from "@/components/card-theme-provider";
import Link from "next/link";
import { MessageSquare, DollarSign, Plus, Edit, Trash2 } from "lucide-react";
import { CARD_THEME_OPTIONS } from "@/lib/card-themes";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LateFeePolicyForm } from "@/components/invoices/late-fee-policy-form";
import { Badge } from "@/components/ui/badge";
import {
  FEATURE_LABELS,
  PLAN_DEFINITIONS,
  PlanKey,
  UsageFeature,
  formatFeatureLimit,
  isPlanKey,
} from "@/lib/plan-limits";

type SettingsFormState = {
  name: string;
  companyName: string;
  email: string;
  agentName: string;
  agentAgency: string;
  planKey: PlanKey;
};

export default function SettingsPage() {
  const { data: session, isPending: isSessionPending } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProperties: 0,
    totalTenants: 0,
    averageRating: 4.8,
  });
  const [formData, setFormData] = useState<SettingsFormState>({
    name: "",
    companyName: "",
    email: "",
    agentName: "",
    agentAgency: "",
    planKey: "professional",
  });
  const initializedUserRef = useRef<string | null>(null);
  const hasUserEditedRef = useRef(false);
  const [isSavingAgent, setIsSavingAgent] = useState(false);
  const [isSavingPlan, setIsSavingPlan] = useState(false);
  const { theme, themeKey, setTheme, isSaving } = useCardTheme();
  const [lateFeePolicies, setLateFeePolicies] = useState<any[]>([]);
  const [isLateFeeDialogOpen, setIsLateFeeDialogOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<any | null>(null);
  const [gmailStatus, setGmailStatus] = useState({ connected: false, email: null as string | null });

  const handleConnectGmail = async () => {
    try {
      const response = await fetch("/api/integrations/google/auth-url");
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error("Failed to start Google connection");
      }
    } catch (error) {
      console.error("Connect error:", error);
      toast.error("Failed to connect to Google");
    }
  };

  const updateFormData = (field: keyof SettingsFormState, value: string) => {
    hasUserEditedRef.current = true;
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  useEffect(() => {
    // Wait for session to load before fetching data
    if (isSessionPending) {
      return;
    }

    const fetchStats = async () => {
      try {
        const [propertiesResult, tenantsResult, preferencesResult, policiesResult] = await Promise.allSettled([
          fetch("/api/properties"),
          fetch("/api/tenants"),
          fetch("/api/preferences"),
          fetch("/api/late-fee-policies"),
        ]);

        let properties: any[] = [];
        let tenants: any[] = [];
        let preferences: any = { agentName: "", agentAgency: "" };

        if (propertiesResult.status === "fulfilled" && propertiesResult.value.ok) {
          try {
            properties = await propertiesResult.value.json();
          } catch (e) {
            console.error("Failed to parse properties JSON:", e);
          }
        } else if (propertiesResult.status === "rejected") {
          console.error("Failed to fetch properties:", propertiesResult.reason);
        }

        if (tenantsResult.status === "fulfilled" && tenantsResult.value.ok) {
          try {
            tenants = await tenantsResult.value.json();
          } catch (e) {
            console.error("Failed to parse tenants JSON:", e);
          }
        } else if (tenantsResult.status === "rejected") {
          console.error("Failed to fetch tenants:", tenantsResult.reason);
        }

        if (policiesResult.status === "fulfilled" && policiesResult.value.ok) {
          try {
            const policies = await policiesResult.value.json();
            setLateFeePolicies(Array.isArray(policies) ? policies : []);
          } catch (e) {
            console.error("Failed to parse policies JSON:", e);
          }
        }

        if (preferencesResult.status === "fulfilled" && preferencesResult.value.ok) {
          try {
            preferences = await preferencesResult.value.json();
          } catch (e) {
            console.error("Failed to parse preferences JSON:", e);
          }
        } else if (preferencesResult.status === "rejected") {
          console.error("Failed to fetch preferences:", preferencesResult.reason);
        }

        setStats({
          totalProperties: Array.isArray(properties) ? properties.length : 0,
          totalTenants: Array.isArray(tenants) ? tenants.length : 0,
          averageRating: 4.8,
        });

        if (preferences) {
          setGmailStatus({
            connected: !!preferences.gmailConnected,
            email: preferences.gmailEmail || null
          });
        }

        if (session?.user) {
          const currentUserId = session.user.id;
          const isNewUser = initializedUserRef.current !== currentUserId;
          const canInitialize = isNewUser || !hasUserEditedRef.current;

          if (canInitialize) {
            if (isNewUser) {
              hasUserEditedRef.current = false;
            }

            setFormData((prev) => ({
              ...prev,
              name: session.user.name || prev.name,
              companyName: preferences?.organizationName || prev.companyName,
              email: session.user.email || prev.email,
              agentName: preferences?.agentName || prev.agentName,
              agentAgency: preferences?.agentAgency || prev.agentAgency,
              planKey: isPlanKey(preferences?.planKey) ? (preferences.planKey as PlanKey) : prev.planKey,
            }));

            initializedUserRef.current = currentUserId;
          }
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
        toast.error("Failed to load settings data. Please refresh the page.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [session, isSessionPending]);

  const handleSave = async () => {
    try {
      // Update user metadata in Clerk for name and email
      if (session?.user) {
        // Note: Email updates typically require re-authentication in Clerk
        // We'll only update the name here
        const response = await fetch("/api/preferences", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            organizationName: formData.companyName || null,
          }),
        });

        if (response.ok) {
          const savedData = await response.json();
          // Update form data with saved values
          setFormData(prev => ({
            ...prev,
            companyName: savedData.organizationName || "",
          }));
          toast.success("Settings saved successfully");
        } else {
          const error = await response.json();
          toast.error(error.error || "Failed to save settings");
        }
      } else {
        toast.error("Please sign in to save settings");
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error("Failed to save settings. Please try again.");
    }
  };

  const handleSaveAgentInfo = async () => {
    setIsSavingAgent(true);
    try {
      const response = await fetch("/api/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentName: formData.agentName || null,
          agentAgency: formData.agentAgency || null,
        }),
      });

      if (response.ok) {
        const savedData = await response.json();
        // Update form data with saved values to reflect any server-side processing
        setFormData(prev => ({
          ...prev,
          agentName: savedData.agentName || "",
          agentAgency: savedData.agentAgency || "",
        }));
        toast.success("Agent information saved successfully");
      } else {
        const error = await response.json();
        const errorMessage = error.error || error.details || "Failed to save agent information";

        // Show more helpful error messages
        if (error.code === "COLUMN_NOT_FOUND") {
          toast.error("Database migration required. Please contact support or run the migration: drizzle/0008_add_agent_fields_to_preferences.sql");
        } else {
          toast.error(errorMessage);
        }
        console.error("Save error:", error);
      }
    } catch (error) {
      console.error("Failed to save agent info:", error);
      const isNetworkError =
        error instanceof TypeError &&
        (error.message.includes("fetch") || error.message.includes("network"));
      toast.error(
        isNetworkError
          ? "Network error. Please check your connection and try again."
          : "An error occurred. Please try again."
      );
    } finally {
      setIsSavingAgent(false);
    }
  };

  const handleSavePlan = async () => {
    setIsSavingPlan(true);
    try {
      const response = await fetch("/api/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planKey: formData.planKey,
        }),
      });

      if (response.ok) {
        toast.success("Plan updated successfully");
      } else {
        const error = await response.json().catch(() => ({}));
        toast.error(error.error || "Unable to update plan. Please try again.");
      }
    } catch (error) {
      console.error("Failed to update plan:", error);
      toast.error("Failed to update plan. Please try again.");
    } finally {
      setIsSavingPlan(false);
    }
  };

  // Show loading state while session is being fetched
  if (isSessionPending || isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <div className="space-y-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-5 w-64" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 sm:gap-6">
      <div className="space-y-1 sm:space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Manage your account and preferences</p>
      </div>

      <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
        {/* Account Information */}
        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="text-lg sm:text-xl">Account Information</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Update your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="name" className="text-sm">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateFormData("name", e.target.value)}
                placeholder="Enter your name"
                className="h-9 sm:h-10 text-sm sm:text-base"
              />
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="company" className="text-sm">Company Name</Label>
              <Input
                id="company"
                value={formData.companyName}
                onChange={(e) => updateFormData("companyName", e.target.value)}
                placeholder="Enter company name"
                className="h-9 sm:h-10 text-sm sm:text-base"
              />
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="email" className="text-sm">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateFormData("email", e.target.value)}
                placeholder="Enter your email"
                className="h-9 sm:h-10 text-sm sm:text-base"
              />
            </div>
            <Button onClick={handleSave} className="w-full h-9 sm:h-10 text-sm sm:text-base">
              Save Changes
            </Button>
          </CardContent>
        </Card>

        {/* Agent Information */}
        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="text-lg sm:text-xl">Agent Information</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Set default agent details for invoices. You can update these anytime.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="agentName" className="text-sm">Agent Name</Label>
              <Input
                id="agentName"
                value={formData.agentName}
                onChange={(e) => updateFormData("agentName", e.target.value)}
                placeholder="Enter agent name"
                disabled={isSavingAgent}
                className="h-9 sm:h-10 text-sm sm:text-base"
              />
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="agentAgency" className="text-sm">Organization / Agency</Label>
              <Input
                id="agentAgency"
                value={formData.agentAgency}
                onChange={(e) => updateFormData("agentAgency", e.target.value)}
                placeholder="Enter organization name"
                disabled={isSavingAgent}
                className="h-9 sm:h-10 text-sm sm:text-base"
              />
            </div>
            <Button
              onClick={handleSaveAgentInfo}
              className="w-full h-9 sm:h-10 text-sm sm:text-base"
              disabled={isSavingAgent}
            >
              {isSavingAgent ? "Saving..." : "Save Agent Information"}
            </Button>
            <p className="text-xs sm:text-sm text-muted-foreground">
              This information will be used as defaults when creating new invoices. You can override it per invoice if needed. Click 'Save Agent Information' to persist your changes.
            </p>
          </CardContent>
        </Card>

        {/* Subscription Plan */}
        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="text-lg sm:text-xl">Subscription Plan</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Manage your subscription</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="planKey" className="text-sm">Current Plan</Label>
              <Select
                value={formData.planKey}
                onValueChange={(value) => updateFormData("planKey", value as PlanKey)}
              >
                <SelectTrigger id="planKey" className="h-9 sm:h-10 text-sm sm:text-base">
                  <SelectValue placeholder="Select your plan" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(PLAN_DEFINITIONS).map((plan) => (
                    <SelectItem key={plan.key} value={plan.key} className="text-sm">
                      {plan.label} — {plan.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {PLAN_DEFINITIONS[formData.planKey].description}
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-3 sm:p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400 mb-2">Monthly allowances</p>
              <dl className="grid gap-1.5 sm:gap-2 text-xs sm:text-sm">
                {["autoGenerations", "propertyPosts", "leads", "monthlyInvoices"].map((feature) => (
                  <div key={feature} className="flex items-center justify-between">
                    <dt className="text-slate-300">{FEATURE_LABELS[feature as UsageFeature]}</dt>
                    <dd className="font-medium text-white">
                      {formatFeatureLimit(formData.planKey, feature as UsageFeature)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
            <Button className="w-full h-9 sm:h-10 text-sm sm:text-base" onClick={handleSavePlan} disabled={isSavingPlan}>
              {isSavingPlan ? "Saving..." : "Update Plan"}
            </Button>
          </CardContent>
        </Card>

        {/* Gmail Integration */}
        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="text-lg sm:text-xl">Gmail Integration</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Connect your Gmail to send invoices directly from your email address.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs sm:text-sm font-medium">Status</span>
                <span className={`text-xs sm:text-sm ${gmailStatus.connected ? "text-green-500" : "text-muted-foreground"}`}>
                  {gmailStatus.connected ? "Connected" : "Not Connected"}
                </span>
                {gmailStatus.email && (
                  <span className="text-xs text-muted-foreground break-all">{gmailStatus.email}</span>
                )}
              </div>
              <Button
                variant={gmailStatus.connected ? "outline" : "default"}
                onClick={handleConnectGmail}
                className="w-full sm:w-auto h-9 sm:h-10 text-sm sm:text-base"
              >
                {gmailStatus.connected ? "Reconnect Gmail" : "Connect Gmail"}
              </Button>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {gmailStatus.connected
                ? "Your invoices will be sent using your connected Gmail account."
                : "Connect your account to have invoices appear as sent explicitly by you."}
            </p>
          </CardContent>
        </Card>

        {/* WhatsApp Integration */}
        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="text-lg sm:text-xl">WhatsApp Integration</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Connect WhatsApp to send invoices and messages</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <p className="text-xs sm:text-sm text-muted-foreground">
              Link your WhatsApp account to send invoices and notifications directly to tenants via WhatsApp.
            </p>
            <Button asChild variant="outline" className="w-full h-9 sm:h-10 text-sm sm:text-base">
              <Link href="/settings/whatsapp">
                <MessageSquare className="mr-2 h-4 w-4" />
                Configure WhatsApp
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Late Fee Policies */}
        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div>
                <CardTitle className="text-lg sm:text-xl">Late Fee Policies</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Configure late fee rules for overdue invoices</CardDescription>
              </div>
              <Dialog open={isLateFeeDialogOpen} onOpenChange={setIsLateFeeDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" onClick={() => setSelectedPolicy(null)} className="w-full sm:w-auto h-8 sm:h-9 text-xs sm:text-sm">
                    <Plus className="mr-2 size-3 sm:size-4" />
                    Add Policy
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{selectedPolicy ? "Edit" : "Create"} Late Fee Policy</DialogTitle>
                    <DialogDescription>
                      Set up rules for calculating late fees on overdue invoices
                    </DialogDescription>
                  </DialogHeader>
                  <LateFeePolicyForm
                    initialData={selectedPolicy}
                    onSuccess={() => {
                      setIsLateFeeDialogOpen(false);
                      setSelectedPolicy(null);
                      fetch("/api/late-fee-policies")
                        .then(res => res.json())
                        .then(data => setLateFeePolicies(Array.isArray(data) ? data : []))
                        .catch(console.error);
                    }}
                    onCancel={() => {
                      setIsLateFeeDialogOpen(false);
                      setSelectedPolicy(null);
                    }}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            {lateFeePolicies.length === 0 ? (
              <p className="text-xs sm:text-sm text-muted-foreground text-center py-3 sm:py-4">
                No late fee policies configured. Create one to automatically apply late fees to overdue invoices.
              </p>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {lateFeePolicies.map((policy) => (
                  <div
                    key={policy.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 p-3 border rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-sm sm:text-base break-words">{policy.name}</span>
                        {policy.isDefault === 1 && (
                          <Badge variant="default" className="text-xs">Default</Badge>
                        )}
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground mt-1 break-words">
                        {policy.type === "flat" ? (
                          <>${policy.amount?.toFixed(2)} flat fee</>
                        ) : (
                          <>{policy.percentage}% of rent</>
                        )}
                        {policy.gracePeriodDays > 0 && (
                          <> • {policy.gracePeriodDays} day grace period</>
                        )}
                        {policy.maxCap && (
                          <> • Max ${policy.maxCap.toFixed(2)}</>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedPolicy(policy);
                          setIsLateFeeDialogOpen(true);
                        }}
                        className="flex-1 sm:flex-initial h-8 sm:h-9"
                      >
                        <Edit className="size-3 sm:size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          if (!confirm("Are you sure you want to delete this policy?")) return;
                          try {
                            const res = await fetch(`/api/late-fee-policies/${policy.id}`, {
                              method: "DELETE",
                            });
                            if (res.ok) {
                              toast.success("Policy deleted");
                              const updated = await fetch("/api/late-fee-policies").then(r => r.json());
                              setLateFeePolicies(Array.isArray(updated) ? updated : []);
                            } else {
                              toast.error("Failed to delete policy");
                            }
                          } catch (error) {
                            toast.error("Failed to delete policy");
                          }
                        }}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Key Stats */}
      <div className="space-y-3 sm:space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Key Stats</h2>
        {isLoading ? (
          <div className="grid gap-3 sm:gap-4 md:grid-cols-3">
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
