"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { ShaderAnimation } from "@/components/ui/shader-animation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { AxisLogo } from "@/components/axis-logo";
import { Shield, Home, Loader2 } from "lucide-react";
import Link from "next/link";

export default function TenantLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if already logged in
    const token = localStorage.getItem("tenant_token");
    if (token) {
      router.replace("/tenant-portal/dashboard");
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
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
        toast.success("Login successful");
        router.push("/tenant-portal/dashboard");
      } else {
        toast.error(data.error || "Invalid email or password");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Failed to connect to server. Please try again.");
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
              Tenant Portal
            </CardDescription>
          </div>
          <CardDescription className="text-sm text-white/70">
            Sign in to view your invoices, pay rent, and request maintenance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleLogin} className="space-y-4">
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
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/90">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                required
                disabled={isLoading}
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-white text-black hover:bg-white/90"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in with Email"
              )}
            </Button>
          </form>

          <p className="text-xs text-center text-white/70 flex items-center justify-center gap-2">
            <Shield className="size-4" /> Secure authentication
          </p>

          <div className="mt-4 text-center text-sm text-white/80">
            <p>
              Don't have an account?{" "}
              <Link href="/tenant-portal/register" className="font-semibold underline-offset-4 hover:underline">
                Register here
              </Link>
            </p>
            <p className="mt-2 text-xs text-white/60">
              Are you an agent?{" "}
              <Link href="/login?role=agent" className="underline-offset-4 hover:underline">
                Sign in as agent
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

