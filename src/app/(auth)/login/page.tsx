"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { ShaderAnimation } from "@/components/ui/shader-animation";
import { AxisLogo } from "@/components/axis-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Github, Loader2, Mail, Shield, User } from "lucide-react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { toast } from "sonner";

const providers = [
  { id: "google", label: "Continue with Google", icon: Mail },
  { id: "github", label: "Continue with GitHub", icon: Github },
];

export default function LoginPage() {
  const router = useRouter();
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
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
  }, [router]);

  const handleOAuthSignIn = async (provider: string) => {
    try {
      setLoadingProvider(provider);
      const supabase = getSupabaseBrowserClient();
      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback?redirectedFrom=/dashboard`
          : undefined;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider as "google" | "github",
        options: {
          redirectTo,
        },
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error("OAuth sign-in error:", error);
      setLoadingProvider(null);
      toast.error("Failed to sign in. Please try again.");
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }

    setIsEmailLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      toast.success("Signed in successfully!");
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Email sign-in error:", error);
      toast.error(error.message || "Failed to sign in. Please check your credentials.");
    } finally {
      setIsEmailLoading(false);
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
          <CardDescription className="text-base text-white/80">
            Sign in to manage your portfolio
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/90">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                disabled={isEmailLoading || !!loadingProvider}
                required
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
                disabled={isEmailLoading || !!loadingProvider}
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-white text-black hover:bg-white/90"
              disabled={isEmailLoading || !!loadingProvider}
            >
              {isEmailLoading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in with Email"
              )}
            </Button>
          </form>

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
              className="w-full border-white/20 bg-white/10 text-white hover:bg-white/20"
              onClick={() => handleOAuthSignIn(provider.id)}
              disabled={!!loadingProvider || isEmailLoading}
            >
              {loadingProvider === provider.id ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <provider.icon className="mr-2 size-4" />
              )}
              {provider.label}
            </Button>
          ))}
          <p className="text-xs text-center text-white/70 flex items-center justify-center gap-2">
            <Shield className="size-4" /> Secure authentication powered by Supabase
          </p>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/20" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-black/40 px-2 text-white/70">Or</span>
            </div>
          </div>

          <Link href="/tenant-portal/login">
            <Button
              type="button"
              variant="outline"
              className="w-full border-white/20 bg-white/5 text-white hover:bg-white/10"
            >
              <User className="mr-2 size-4" />
              Tenant Login
            </Button>
          </Link>

          <p className="text-sm text-center text-white/80">
            Need an account?{" "}
            <button
              type="button"
              className="font-semibold underline-offset-4 hover:underline"
              onClick={() => router.push("/register")}
            >
              Create one
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
