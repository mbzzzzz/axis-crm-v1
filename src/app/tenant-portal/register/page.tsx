"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { ShaderAnimation } from "@/components/ui/shader-animation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { AxisLogo } from "@/components/axis-logo";
import { Shield, Home, Loader2 } from "lucide-react";
import Link from "next/link";

function TenantRegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenantId = searchParams.get("tenantId");
  const token = searchParams.get("token");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  useEffect(() => {
    // Verify token if provided
    if (token && tenantId) {
      fetch(`/api/auth/tenant/verify-registration-token?token=${encodeURIComponent(token)}&tenantId=${tenantId}`)
        .then(res => res.json())
        .then(data => {
          if (data.valid) {
            setTokenValid(true);
            if (data.email) {
              setEmail(data.email);
            }
          } else {
            setTokenValid(false);
          }
        })
        .catch(() => setTokenValid(false));
    } else if (tenantId) {
      // If tenantId but no token, fetch tenant email from public endpoint
      fetch(`/api/auth/tenant/registration-info?tenantId=${tenantId}`)
        .then(res => {
          if (!res.ok) {
            throw new Error('Failed to fetch tenant information');
          }
          return res.json();
        })
        .then(data => {
          if (data && data.email) {
            setEmail(data.email);
            setTokenValid(true); // Allow registration without token (for testing)
          } else {
            setTokenValid(false);
          }
        })
        .catch(error => {
          console.error('Error fetching tenant info:', error);
          setTokenValid(false);
        });
    } else {
      setTokenValid(false);
    }
  }, [tenantId, token]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate email
    if (!email || !email.trim()) {
      toast.error("Email is required");
      return;
    }

    // Validate password
    if (!password || password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (!tenantId) {
      toast.error("Tenant ID is required. Please use the registration link provided by your property manager.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/tenant/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          tenantId: parseInt(tenantId),
          token: token || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success("Account created successfully. Please login.");
        router.push("/tenant-portal/login");
      } else {
        toast.error(data.error || "Failed to create account");
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <div className="absolute inset-0">
        <ShaderAnimation />
      </div>

      <Card className="relative z-10 w-full max-w-md shadow-2xl border-white/20 bg-black/40 backdrop-blur-xl text-white">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex items-center justify-center">
            <AxisLogo variant="full" size="lg" className="text-white" />
          </div>
          <div className="flex items-center justify-center gap-2 text-white/80">
            <Home className="size-5" />
            <CardDescription className="text-base text-white/80">
              Tenant Portal Registration
            </CardDescription>
          </div>
          <CardDescription className="text-sm text-white/70">
            Set up your tenant portal account to access invoices and maintenance requests
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/90">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                required
                disabled={isLoading || !!tenantId}
              />
              {tenantId && (
                <p className="text-xs text-white/60">
                  Email is pre-filled from your tenant record
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/90">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password (min. 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                required
                disabled={isLoading}
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-white/90">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                required
                disabled={isLoading}
                minLength={6}
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-white text-black hover:bg-white/90"
              disabled={isLoading || !tenantId || tokenValid === false || (tokenValid === null && tenantId)}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>
          {tokenValid === false && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
              <p className="text-sm text-red-200">
                Invalid or expired registration link. Please contact your property manager for a new registration link.
              </p>
            </div>
          )}
          {!tenantId && tokenValid !== false && (
            <div className="mt-4 p-3 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
              <p className="text-sm text-yellow-200">
                You need a registration link from your property manager to create an account.
              </p>
            </div>
          )}
          <p className="text-xs text-center text-white/70 flex items-center justify-center gap-2">
            <Shield className="size-4" /> Secure authentication
          </p>
          <div className="mt-4 text-center text-sm text-white/80">
            <p>
              Already have an account?{" "}
              <Link href="/tenant-portal/login" className="font-semibold underline-offset-4 hover:underline">
                Sign in here
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function TenantRegisterPage() {
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
      <TenantRegisterForm />
    </Suspense>
  );
}

