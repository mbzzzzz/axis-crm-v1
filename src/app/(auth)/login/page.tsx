"use client";

import { SignIn } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShaderAnimation } from "@/components/ui/shader-animation";
import { AxisLogo } from "@/components/axis-logo";

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      {/* Shader Animation Background */}
      <div className="absolute inset-0">
        <ShaderAnimation />
      </div>

      <Card className="relative z-10 w-full max-w-md shadow-2xl border-white/20 bg-black/40 backdrop-blur-xl text-white">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex items-center justify-center">
            <AxisLogo variant="full" size="lg" className="text-white" />
          </div>
          <CardDescription className="text-base text-white/80">
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <SignIn
              appearance={{
                elements: {
                  rootBox: "mx-auto",
                  card: "bg-transparent shadow-none border-none",
                  headerTitle: "text-white",
                  headerSubtitle: "text-white/80",
                  socialButtonsBlockButton: "bg-white/10 border-white/20 text-white hover:bg-white/20",
                  formButtonPrimary: "bg-white/20 text-white hover:bg-white/30 border border-white/20",
                  formFieldInput: "bg-white/10 border-white/20 text-white placeholder:text-white/60",
                  formFieldLabel: "text-white",
                  footerActionLink: "text-white hover:text-white/80",
                  identityPreviewText: "text-white",
                  identityPreviewEditButton: "text-white hover:text-white/80",
                },
              }}
              routing="path"
              path="/login"
              signUpUrl="/register"
              afterSignInUrl="/dashboard"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
