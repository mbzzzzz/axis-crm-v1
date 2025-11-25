"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { ShaderAnimation } from "@/components/ui/shader-animation";
import { AxisLogo } from "@/components/axis-logo";
import { Button } from "@/components/ui/button";
import { Github, Loader2, Mail } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const providers = [
  { id: "google", label: "Sign up with Google", icon: Mail },
  { id: "github", label: "Sign up with GitHub", icon: Github },
];

export default function RegisterPage() {
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  const handleOAuthSignUp = async (provider: string) => {
    try {
      setLoadingProvider(provider);
      const supabase = getSupabaseBrowserClient();
      const redirectTo =
        typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined;

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
      console.error("OAuth sign-up error:", error);
      setLoadingProvider(null);
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
            Create your Axis CRM account in seconds
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {providers.map((provider) => (
            <Button
              key={provider.id}
              variant="outline"
              className="w-full border-white/20 bg-white/10 text-white hover:bg-white/20"
              onClick={() => handleOAuthSignUp(provider.id)}
              disabled={!!loadingProvider}
            >
              {loadingProvider === provider.id ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <provider.icon className="mr-2 size-4" />
              )}
              {provider.label}
            </Button>
          ))}
          <p className="text-xs text-center text-white/70">
            By continuing you agree to the Axis CRM Terms and Privacy Policy.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
