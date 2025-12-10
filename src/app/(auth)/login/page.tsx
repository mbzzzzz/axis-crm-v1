"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { ShaderAnimation } from "@/components/ui/shader-animation";
import { AxisLogo } from "@/components/axis-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Github, Loader2, Mail, Shield, User, Building2, Home } from "lucide-react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { formatAuthError } from "@/lib/auth-errors";

const providers = [
  { id: "google", label: "Continue with Google", icon: Mail },
  { id: "github", label: "Continue with GitHub", icon: Github },
];

type UserRole = "agent" | "tenant" | null;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedRole, setSelectedRole] = useState<UserRole>(null);
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  // Check if role is specified in URL
  useEffect(() => {
    const roleParam = searchParams.get("role");
    if (roleParam === "tenant" || roleParam === "agent") {
      setSelectedRole(roleParam);
    }
  }, [searchParams]);

  useEffect(() => {
    // Only check session for agent role
    if (selectedRole === "agent") {
      const checkSession = async () => {
        const supabase = getSupabaseBrowserClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) {
          router.replace("/dashboard");
        }
      };
      checkSession();
    }
    // For tenant role, check localStorage token
    if (selectedRole === "tenant") {
      const token = localStorage.getItem("tenant_token");
      if (token) {
        router.replace("/tenant-portal/dashboard");
      }
    }
  }, [router, selectedRole]);

  const handleOAuthSignIn = async (provider: string) => {
    if (selectedRole !== "agent") {
      toast.error("OAuth is only available for agents");
      return;
    }
    try {
      setLoadingProvider(provider);
      const supabase = getSupabaseBrowserClient();
      
      // Clear any existing session before OAuth (prevents account switching issues)
      await supabase.auth.signOut();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Get the current origin (works for both local and production)
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      
      // Set redirect URL to callback with dashboard as final destination
      // This URL must be added to Supabase Dashboard > Authentication > URL Configuration > Redirect URLs
      const redirectTo = `${origin}/auth/callback?redirectedFrom=/dashboard`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider as "google" | "github",
        options: {
          redirectTo,
          queryParams: {
            // Ensure we get redirected back to dashboard
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        throw error;
      }
      // OAuth will redirect, so we don't need to do anything else here
    } catch (error) {
      console.error("OAuth sign-in error:", error);
      setLoadingProvider(null);
      toast.error("Failed to sign in. Please try again.");
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) {
      toast.error("Please select your role");
      return;
    }
    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }

    setIsEmailLoading(true);
    try {
      if (selectedRole === "tenant") {
        // Tenant authentication
        const response = await fetch("/api/auth/tenant/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          localStorage.setItem("tenant_token", data.token);
          localStorage.setItem("tenant_id", String(data.tenant.id));
          localStorage.setItem("tenant_email", data.tenant.email);
          localStorage.setItem("tenant_name", data.tenant.name || "");
          toast.success("Signed in successfully!");
          router.push("/tenant-portal/dashboard");
        } else {
          toast.error(data.error || "Invalid email or password");
        }
      } else {
        // Agent authentication (Supabase)
        const supabase = getSupabaseBrowserClient();
        
        // Clear any existing session before signing in (prevents account switching issues)
        await supabase.auth.signOut();
        
        // Small delay to ensure sign out completes
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Store remember me preference
        if (rememberMe) {
          localStorage.setItem("remember_me", "true");
        } else {
          localStorage.removeItem("remember_me");
        }
        
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          throw error;
        }

        // Verify session was created
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error("Session not created after sign in");
        }

        toast.success("Signed in successfully!");
        
        // Force page reload to ensure clean state
        window.location.href = "/dashboard";
      }
    } catch (error: any) {
      console.error("Email sign-in error:", error);
      const errorMessage = formatAuthError(error);
      toast.error(errorMessage);
    } finally {
      setIsEmailLoading(false);
    }
  };

  // Role selection screen
  if (!selectedRole) {
    return (
      <div className="relative flex min-h-dvh items-center justify-center px-4 overflow-hidden">
        <div className="absolute inset-0">
          <ShaderAnimation />
        </div>

        <Card className="relative z-10 w-full max-w-md shadow-2xl border-white/20 bg-black/40 backdrop-blur-xl text-white mx-4">
          <CardHeader className="space-y-3 sm:space-y-4 text-center px-4 sm:px-6 pt-4 sm:pt-6">
            <div className="mx-auto flex items-center justify-center">
              <AxisLogo variant="full" size="lg" className="text-white" />
            </div>
            <CardDescription className="text-sm sm:text-base text-white/80">
              Choose your account type to continue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="grid gap-3 sm:gap-4">
              <Button
                type="button"
                onClick={() => setSelectedRole("agent")}
                className="w-full h-auto p-4 sm:p-6 border-white/20 bg-white/10 text-white hover:bg-white/20 flex flex-col items-start gap-2 sm:gap-3"
              >
                <div className="flex items-center gap-2 sm:gap-3 w-full">
                  <Building2 className="size-5 sm:size-6 shrink-0" />
                  <div className="flex-1 text-left min-w-0">
                    <div className="font-semibold text-base sm:text-lg">Agent / Property Manager</div>
                    <div className="text-xs sm:text-sm text-white/70 mt-1">
                      Manage properties, tenants, and invoices
                    </div>
                  </div>
                </div>
              </Button>

              <Button
                type="button"
                onClick={() => setSelectedRole("tenant")}
                className="w-full h-auto p-4 sm:p-6 border-white/20 bg-white/10 text-white hover:bg-white/20 flex flex-col items-start gap-2 sm:gap-3"
              >
                <div className="flex items-center gap-2 sm:gap-3 w-full">
                  <Home className="size-5 sm:size-6 shrink-0" />
                  <div className="flex-1 text-left min-w-0">
                    <div className="font-semibold text-base sm:text-lg">Tenant</div>
                    <div className="text-xs sm:text-sm text-white/70 mt-1">
                      View invoices, pay rent, and request maintenance
                    </div>
                  </div>
                </div>
              </Button>
            </div>

            <p className="text-xs text-center text-white/70 flex items-center justify-center gap-2 mt-4">
              <Shield className="size-4" /> Secure authentication
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Login form based on selected role
  return (
    <div className="relative flex min-h-dvh items-center justify-center px-4 overflow-hidden">
      <div className="absolute inset-0">
        <ShaderAnimation />
      </div>

      <Card className="relative z-10 w-full max-w-md shadow-2xl border-white/20 bg-black/40 backdrop-blur-xl text-white mx-4">
        <CardHeader className="space-y-3 sm:space-y-4 text-center px-4 sm:px-6 pt-4 sm:pt-6">
          <div className="mx-auto flex items-center justify-center">
            <AxisLogo variant="full" size="lg" className="text-white" />
          </div>
          <CardDescription className="text-sm sm:text-base text-white/80">
            {selectedRole === "agent" 
              ? "Sign in to manage your portfolio" 
              : "Sign in to access your tenant portal"}
          </CardDescription>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setSelectedRole(null)}
            className="text-white/70 hover:text-white text-xs sm:text-sm h-8 sm:h-9"
          >
            ← Change account type
          </Button>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6 pb-4 sm:pb-6">
          <form onSubmit={handleEmailSignIn} className="space-y-3 sm:space-y-4">
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="email" className="text-white/90 text-sm">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 h-9 sm:h-10 text-sm sm:text-base"
                disabled={isEmailLoading || !!loadingProvider}
                required
              />
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="password" className="text-white/90 text-sm">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 h-9 sm:h-10 text-sm sm:text-base"
                disabled={isEmailLoading || !!loadingProvider}
                required
              />
            </div>
            {selectedRole === "agent" && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember-me"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                  className="border-white/20"
                />
                <Label
                  htmlFor="remember-me"
                  className="text-sm text-white/80 cursor-pointer"
                >
                  Remember me for 90 days
                </Label>
              </div>
            )}
            <Button
              type="submit"
              className="w-full bg-white text-black hover:bg-white/90 h-10 sm:h-11 text-sm sm:text-base"
              disabled={isEmailLoading || !!loadingProvider}
            >
              {isEmailLoading ? (
                <>
                  <Loader2 className="mr-2 size-3 sm:size-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in with Email"
              )}
            </Button>
          </form>

          {selectedRole === "agent" && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-white/20" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-black/40 px-2 text-white/70">Or continue with</span>
                </div>
              </div>

              {providers.map((provider) => (
                <Button
                  key={provider.id}
                  variant="outline"
                  className="w-full border-white/20 bg-white/10 text-white hover:bg-white/20 h-10 sm:h-11 text-sm sm:text-base"
                  onClick={() => handleOAuthSignIn(provider.id)}
                  disabled={!!loadingProvider || isEmailLoading}
                >
                  {loadingProvider === provider.id ? (
                    <Loader2 className="mr-2 size-3 sm:size-4 animate-spin" />
                  ) : (
                    <provider.icon className="mr-2 size-3 sm:size-4" />
                  )}
                  {provider.label}
                </Button>
              ))}
            </>
          )}

          <p className="text-xs text-center text-white/70 flex items-center justify-center gap-1.5 sm:gap-2">
            <Shield className="size-3 sm:size-4" /> Secure authentication
            {selectedRole === "agent" && " powered by Supabase"}
          </p>

          <p className="text-xs sm:text-sm text-center text-white/80">
            {selectedRole === "agent" ? (
              <>
                Need an account?{" "}
                <button
                  type="button"
                  className="font-semibold underline-offset-4 hover:underline"
                  onClick={() => router.push("/register")}
                >
                  Create one
                </button>
              </>
            ) : (
              <>
                Don't have an account?{" "}
                <Link href="/tenant-portal/register" className="font-semibold underline-offset-4 hover:underline">
                  Register here
                </Link>
              </>
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="relative flex min-h-screen items-center justify-center px-4">
        <div className="absolute inset-0">
          <ShaderAnimation />
        </div>
        <Card className="relative z-10 w-full max-w-md shadow-2xl border-white/20 bg-black/40 backdrop-blur-xl text-white">
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <Loader2 className="size-6 animate-spin text-white" />
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
