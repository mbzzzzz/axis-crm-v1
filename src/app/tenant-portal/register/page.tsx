"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { AxisLogo } from "@/components/axis-logo";
import Link from "next/link";

export default function TenantRegisterPage() {
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
      // If tenantId but no token, fetch tenant email
      fetch(`/api/tenants?id=${tenantId}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.email) {
            setEmail(data.email);
            setTokenValid(true); // Allow registration without token (for testing)
          }
        })
        .catch(console.error);
    } else {
      setTokenValid(false);
    }
  }, [tenantId, token]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-900 to-black p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <AxisLogo variant="full" size="navbar" />
          </div>
          <div>
            <CardTitle className="text-2xl">Create Account</CardTitle>
            <CardDescription>Set up your tenant portal account</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading || !!tenantId}
              />
              {tenantId && (
                <p className="text-xs text-muted-foreground">
                  Email is pre-filled from your tenant record
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password (min. 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading || !tenantId || tokenValid === false}>
              {isLoading ? "Creating account..." : "Create Account"}
            </Button>
          </form>
          {tokenValid === false && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                Invalid or expired registration link. Please contact your property manager for a new registration link.
              </p>
            </div>
          )}
          {!tenantId && tokenValid !== false && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                You need a registration link from your property manager to create an account.
              </p>
            </div>
          )}
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <p>
              Already have an account?{" "}
              <Link href="/tenant-portal/login" className="text-primary hover:underline">
                Sign in here
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

