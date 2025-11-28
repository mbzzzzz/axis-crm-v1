"use client";

import { useEffect, useState, DragEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ImagePlus, X, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";
import { ShaderAnimation } from "@/components/ui/shader-animation";

type LogoMode = "text" | "image";

const HEARD_ABOUT_OPTIONS = [
  { value: "referral", label: "Referral" },
  { value: "search", label: "Search engine" },
  { value: "social", label: "Social media" },
  { value: "event", label: "Event / webinar" },
  { value: "marketplace", label: "App marketplace" },
  { value: "partner", label: "Channel partner" },
  { value: "ads", label: "Paid ads" },
  { value: "other", label: "Other" },
];

interface PreferencesResponse {
  agentName: string | null;
  agentAgency: string | null;
  organizationName: string | null;
  companyTagline: string | null;
  defaultInvoiceLogoMode: LogoMode;
  defaultInvoiceLogoDataUrl: string | null;
  defaultInvoiceLogoWidth: number | null;
  heardAbout: string | null;
  onboardingCompleted: boolean;
}

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [formData, setFormData] = useState({
    agentName: "",
    agentAgency: "",
    organizationName: "",
    companyTagline: "",
    heardAbout: "",
    logoMode: "text" as LogoMode,
    logoDataUrl: "",
    logoWidth: 64,
  });

  const redirectTo = searchParams.get("next") || "/dashboard";

  useEffect(() => {
    let isMounted = true;
    const loadPreferences = async () => {
      try {
        const response = await fetch("/api/preferences");
        if (!response.ok) {
          throw new Error("Unable to load preferences");
        }
        const data: PreferencesResponse = await response.json();

        if (data.onboardingCompleted) {
          router.replace(redirectTo);
          return;
        }

        if (!isMounted) return;
        setFormData((prev) => ({
          ...prev,
          agentName: data.agentName || "",
          agentAgency: data.agentAgency || "",
          organizationName: data.organizationName || "",
          companyTagline: data.companyTagline || "",
          heardAbout: data.heardAbout || "",
          logoMode: (data.defaultInvoiceLogoMode as LogoMode) || (data.defaultInvoiceLogoDataUrl ? "image" : "text"),
          logoDataUrl: data.defaultInvoiceLogoDataUrl || "",
          logoWidth: data.defaultInvoiceLogoWidth || 64,
        }));
      } catch (error) {
        console.error("Failed to load onboarding preferences:", error);
        toast.error("We couldn't load your onboarding data. Please try again.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadPreferences();
    return () => {
      isMounted = false;
    };
  }, [redirectTo, router]);

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG, JPG, SVG).");
      return;
    }

    if (!session?.user?.id) {
      toast.error("Please wait for your session to load.");
      return;
    }

    try {
      setIsUploadingLogo(true);
      const uploadData = new FormData();
      uploadData.append("files", file);
      uploadData.append("userId", session.user.id);
      uploadData.append("propertyId", "branding");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: uploadData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "Failed to upload logo");
      }

      const { urls } = await response.json();
      const logoUrl = urls?.[0];
      if (!logoUrl) {
        throw new Error("Upload did not return a URL");
      }

      setFormData((prev) => ({
        ...prev,
        logoDataUrl: logoUrl,
        logoMode: "image",
      }));
      toast.success("Logo uploaded successfully!");
    } catch (error) {
      console.error("Logo upload failed:", error);
      toast.error(error instanceof Error ? error.message : "Unable to upload logo");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (isUploadingLogo) {
      return;
    }
    const file = event.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!formData.agentName.trim() || !formData.organizationName.trim() || !formData.heardAbout) {
      toast.error("Please complete the required fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/preferences", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agentName: formData.agentName.trim(),
          agentAgency: formData.agentAgency.trim() || null,
          organizationName: formData.organizationName.trim(),
          companyTagline: formData.companyTagline.trim() || null,
          defaultInvoiceLogoMode: formData.logoDataUrl ? "image" : "text",
          defaultInvoiceLogoDataUrl: formData.logoDataUrl || null,
          defaultInvoiceLogoWidth: formData.logoWidth,
          heardAbout: formData.heardAbout,
          onboardingCompleted: true,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "Something went wrong");
      }

      toast.success("You're all set! Let's build your workspace.");
      router.replace(redirectTo);
    } catch (error) {
      console.error("Onboarding submission failed:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save onboarding details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="relative flex min-h-screen items-center justify-center text-white">
        <ShaderAnimation />
        <div className="relative z-10 glass-panel flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-8 py-6 text-sm text-slate-200 backdrop-blur-xl">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
          <p>Preparing your onboarding experience…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden text-white">
      <ShaderAnimation />

      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-10 lg:py-16">
        <div className="space-y-3 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1 text-xs uppercase tracking-[0.3em] text-slate-200 backdrop-blur">
            <span className="size-1 rounded-full bg-emerald-400" />
            Axis CRM Onboarding
          </div>
          <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
            Craft a branded workspace that feels unmistakably yours
          </h1>
          <p className="text-base text-slate-300">
            These details personalize invoices, tenant emails, and dashboards. Tweak them anytime under{" "}
            <span className="font-medium text-white">Settings → Workspace.</span>
          </p>
        </div>

        <Card className="border-white/15 bg-white/5 shadow-[0_20px_90px_rgba(5,4,24,0.7)] backdrop-blur-2xl">
          <CardHeader>
            <CardTitle>Agent & Organization</CardTitle>
            <CardDescription className="text-slate-200">
              Introduce your brand, drop in a logo, and choose how we reference you across invoices and communications.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="agentName">Agent name *</Label>
                  <Input
                    id="agentName"
                    value={formData.agentName}
                    onChange={(event) => setFormData((prev) => ({ ...prev, agentName: event.target.value }))}
                    placeholder="e.g. Alicia Patel"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="agentAgency">Agency / title</Label>
                  <Input
                    id="agentAgency"
                    value={formData.agentAgency}
                    onChange={(event) => setFormData((prev) => ({ ...prev, agentAgency: event.target.value }))}
                    placeholder="e.g. Skyline Realty"
                  />
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="organizationName">Organization name *</Label>
                  <Input
                    id="organizationName"
                    value={formData.organizationName}
                    onChange={(event) => setFormData((prev) => ({ ...prev, organizationName: event.target.value }))}
                    placeholder="Enter your brokerage or company"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyTagline">Tagline / slogan</Label>
                  <Input
                    id="companyTagline"
                    value={formData.companyTagline}
                    onChange={(event) => setFormData((prev) => ({ ...prev, companyTagline: event.target.value }))}
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Label>Organization logo</Label>
                    <p className="text-sm text-slate-300">
                      Drag in a PNG, JPG, or SVG. We'll host it securely and apply it everywhere automatically.
                    </p>
                  </div>
                  {formData.logoDataUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-xs text-slate-300 hover:text-white"
                      onClick={() => setFormData((prev) => ({ ...prev, logoDataUrl: "", logoMode: "text" }))}
                    >
                      Remove logo
                    </Button>
                  )}
                </div>

                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  className="relative flex h-48 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/25 bg-white/5 text-center transition hover:border-white/60"
                  onClick={() => {
                    if (!isUploadingLogo) {
                      document.getElementById("onboarding-logo-input")?.click();
                    }
                  }}
                >
                  {formData.logoDataUrl ? (
                    <div className="relative flex flex-col items-center gap-4">
                      <img
                        src={formData.logoDataUrl}
                        alt="Organization logo preview"
                        className="max-h-28 rounded-xl object-contain shadow-lg"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute -right-2 -top-2 h-7 w-7 rounded-full bg-black/60 text-white hover:bg-black/80"
                        onClick={(event) => {
                          event.stopPropagation();
                          setFormData((prev) => ({ ...prev, logoDataUrl: "", logoMode: "text" }));
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3 text-sm text-white/80">
                      {isUploadingLogo ? (
                        <Loader2 className="h-8 w-8 animate-spin" />
                      ) : (
                        <ImagePlus className="h-8 w-8" />
                      )}
                      <div>
                        <p className="font-medium">
                          {isUploadingLogo ? "Uploading…" : "Drop your logo here or click to upload"}
                        </p>
                        <p className="text-xs text-white/60">PNG, JPG, or SVG up to 2MB</p>
                      </div>
                    </div>
                  )}
                </div>
                <input
                  id="onboarding-logo-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="logoWidth">Logo size (px)</Label>
                  <Input
                    id="logoWidth"
                    type="number"
                    min={24}
                    max={200}
                    value={formData.logoWidth}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        logoWidth: Math.max(24, Math.min(200, Number(event.target.value) || 64)),
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="heardAbout">Where did you hear about us? *</Label>
                  <Select
                    value={formData.heardAbout}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, heardAbout: value }))}
                  >
                    <SelectTrigger id="heardAbout">
                      <SelectValue placeholder="Select one" />
                    </SelectTrigger>
                    <SelectContent>
                      {HEARD_ABOUT_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  You can refine these details later under Settings → Workspace.
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-slate-300 hover:text-white"
                    onClick={() => router.replace(redirectTo)}
                    disabled={isSubmitting}
                  >
                    Skip for now
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving…
                      </>
                    ) : (
                      "Save & continue"
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#010314] text-white">
          <div className="glass-panel flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-8 py-6 text-sm text-slate-200 backdrop-blur-xl">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
            <p>Loading onboarding experience…</p>
          </div>
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}

