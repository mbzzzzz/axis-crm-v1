"use client";

/**
 * Checkout Page
 * Secure Paddle checkout with Axis CRM branding
 */

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PaddleCheckout } from "@/components/paddle/checkout";
import { useSession } from "@/lib/auth-client";
import { Loader2 } from "lucide-react";
import { PLAN_DEFINITIONS, type PlanKey, isPlanKey } from "@/lib/plan-limits";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, isPending: isSessionPending } = useSession();
  const [planKey, setPlanKey] = useState<PlanKey>("professional");

  useEffect(() => {
    // Get plan from URL params
    const planParam = searchParams.get("plan");
    if (planParam && isPlanKey(planParam)) {
      setPlanKey(planParam);
    }
  }, [searchParams]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isSessionPending && !session?.user) {
      router.push(`/login?redirectedFrom=/checkout&plan=${planKey}`);
    }
  }, [session, isSessionPending, router, planKey]);

  if (isSessionPending) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="size-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (!session?.user) {
    return null; // Will redirect
  }

  const plan = PLAN_DEFINITIONS[planKey];

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Upgrade Your Plan</h1>
        <p className="text-neutral-400">
          Choose a plan that fits your business needs
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Plan Summary */}
        <Card className="border-white/20 bg-white/10 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-white">Plan Details</CardTitle>
            <CardDescription className="text-neutral-400">
              Review your selected plan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-xl font-bold text-white mb-1">{plan.label}</h3>
              <p className="text-sm text-neutral-400">{plan.description}</p>
            </div>
            
            <div className="space-y-2 pt-4 border-t border-white/10">
              <h4 className="text-sm font-semibold text-white mb-2">Features:</h4>
              <ul className="space-y-1.5">
                <li className="flex items-center gap-2 text-sm text-neutral-300">
                  <span className="text-green-400">✓</span>
                  {plan.limits.autoGenerations === null ? "Unlimited" : plan.limits.autoGenerations} AI auto-generations
                </li>
                <li className="flex items-center gap-2 text-sm text-neutral-300">
                  <span className="text-green-400">✓</span>
                  {plan.limits.propertyPosts === null ? "Unlimited" : plan.limits.propertyPosts} property postings
                </li>
                <li className="flex items-center gap-2 text-sm text-neutral-300">
                  <span className="text-green-400">✓</span>
                  {plan.limits.leads === null ? "Unlimited" : plan.limits.leads} lead captures
                </li>
                <li className="flex items-center gap-2 text-sm text-neutral-300">
                  <span className="text-green-400">✓</span>
                  {plan.limits.monthlyInvoices === null ? "Unlimited" : plan.limits.monthlyInvoices} monthly invoices
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Checkout */}
        <div>
          <PaddleCheckout
            planKey={planKey}
            customerId={session.user.id}
            customerEmail={session.user.email}
            onSuccess={() => {
              router.push("/dashboard?subscription=success");
            }}
            onError={(error) => {
              console.error("Checkout error:", error);
            }}
          />
        </div>
      </div>
    </div>
  );
}

