"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Building2, BarChart3, FileText, Mail } from "lucide-react";
import { ShaderAnimation } from "@/components/ui/shader-animation";

export default function Home() {
  const router = useRouter();

  return (
    <div className="relative flex min-h-screen flex-col">
      {/* Shader Animation Background */}
      <ShaderAnimation />

      {/* Header */}
      <header className="relative z-10 border-b border-white/20 bg-black/30 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Building2 className="size-8 text-white" />
            <span className="text-xl font-bold text-white">Axis CRM</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push("/login")} className="text-white hover:bg-white/20 hover:text-white">
              Sign in
            </Button>
            <Button onClick={() => router.push("/register")} className="bg-white text-black hover:bg-white/90">Get Started</Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 container mx-auto flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm shadow-sm backdrop-blur-sm">
          <span className="flex size-2 rounded-full bg-green-400"></span>
          <span className="text-white/90 font-medium">Real Estate CRM Platform</span>
        </div>

        <h1 className="mb-6 max-w-4xl text-5xl font-black tracking-tight text-white sm:text-6xl md:text-7xl drop-shadow-lg">
          Manage Your Real Estate Business with{" "}
          <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Axis CRM
          </span>
        </h1>

        <p className="mb-12 max-w-2xl text-lg font-semibold text-white/90 sm:text-xl drop-shadow-md">
          A comprehensive platform for real estate agents and property managers to handle listings,
          calculate profits, generate invoices, and automate workflows.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button size="lg" onClick={() => router.push("/register")} className="text-base bg-white text-black hover:bg-white/90 font-bold">
            Start Free Trial
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => router.push("/login")}
            className="text-base border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm font-bold"
          >
            Sign in
          </Button>
        </div>

        {/* Features */}
        <div className="mt-24 grid w-full max-w-5xl gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col items-center gap-4 rounded-lg border border-white/20 bg-white/10 p-6 shadow-lg backdrop-blur-md">
            <div className="flex size-12 items-center justify-center rounded-full bg-blue-400/80">
              <Building2 className="size-6 text-white" />
            </div>
            <h3 className="font-bold text-white">Property Management</h3>
            <p className="text-center text-sm font-medium text-white/80">
              Manage all your listings with detailed information and financial tracking
            </p>
          </div>

          <div className="flex flex-col items-center gap-4 rounded-lg border border-white/20 bg-white/10 p-6 shadow-lg backdrop-blur-md">
            <div className="flex size-12 items-center justify-center rounded-full bg-purple-400/80">
              <BarChart3 className="size-6 text-white" />
            </div>
            <h3 className="font-bold text-white">Financial Calculator</h3>
            <p className="text-center text-sm font-medium text-white/80">
              Calculate ROI, commissions, and expenses with visual analytics
            </p>
          </div>

          <div className="flex flex-col items-center gap-4 rounded-lg border border-white/20 bg-white/10 p-6 shadow-lg backdrop-blur-md">
            <div className="flex size-12 items-center justify-center rounded-full bg-green-400/80">
              <FileText className="size-6 text-white" />
            </div>
            <h3 className="font-bold text-white">Invoice Generation</h3>
            <p className="text-center text-sm font-medium text-white/80">
              Create professional invoices with automated numbering and tracking
            </p>
          </div>

          <div className="flex flex-col items-center gap-4 rounded-lg border border-white/20 bg-white/10 p-6 shadow-lg backdrop-blur-md">
            <div className="flex size-12 items-center justify-center rounded-full bg-orange-400/80">
              <Mail className="size-6 text-white" />
            </div>
            <h3 className="font-bold text-white">Email Integration</h3>
            <p className="text-center text-sm font-medium text-white/80">
              Automated invoice sending with Gmail and Outlook integration
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/20 bg-black/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8 text-center text-sm font-medium text-white/80">
          © 2024 Axis CRM. All rights reserved.
        </div>
      </footer>
    </div>
  );
}