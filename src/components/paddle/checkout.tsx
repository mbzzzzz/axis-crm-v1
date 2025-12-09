"use client";

/**
 * Paddle Checkout Component
 * Branded checkout with Axis CRM styling
 */

import { useEffect, useRef, useState } from "react";
import { AxisLogo } from "@/components/axis-logo";
import { Button } from "@/components/ui/button";
import { Loader2, Lock, Shield, CheckCircle2 } from "lucide-react";
import { PADDLE_ENV, PADDLE_PRICE_IDS } from "@/lib/paddle/config";
import { PLAN_DEFINITIONS, type PlanKey } from "@/lib/plan-limits";

declare global {
  interface Window {
    Paddle?: {
      Initialize: (config: any) => void;
      Checkout: {
        open: (config: any) => void;
        close: () => void;
      };
      Environment: {
        set: (env: string) => void;
      };
    };
  }
}

interface PaddleCheckoutProps {
  planKey: PlanKey;
  customerId: string;
  customerEmail: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function PaddleCheckout({
  planKey,
  customerId,
  customerEmail,
  onSuccess,
  onError,
}: PaddleCheckoutProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const paddleInitialized = useRef(false);

  const plan = PLAN_DEFINITIONS[planKey];
  const priceId = PADDLE_PRICE_IDS[planKey];

  useEffect(() => {
    if (!priceId) {
      setError(`Price ID not configured for plan: ${planKey}`);
      setIsLoading(false);
      return;
    }

    // Load Paddle script
    if (typeof window !== "undefined" && !paddleInitialized.current) {
      const script = document.createElement("script");
      script.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
      script.async = true;
      script.onload = () => {
        if (window.Paddle) {
          // Set environment
          window.Paddle.Environment.set(PADDLE_ENV.environment);
          
          // Initialize Paddle
          window.Paddle.Initialize({
            token: PADDLE_ENV.publicKey,
            eventCallback: (data: any) => {
              if (data.name === "checkout.completed") {
                onSuccess?.();
              } else if (data.name === "checkout.error") {
                const err = new Error(data.data?.error?.message || "Checkout error");
                setError(err.message);
                onError?.(err);
              }
            },
          });
          
          paddleInitialized.current = true;
          setIsInitialized(true);
          setIsLoading(false);
        }
      };
      script.onerror = () => {
        setError("Failed to load Paddle checkout");
        setIsLoading(false);
      };
      document.body.appendChild(script);

      return () => {
        // Cleanup
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
      };
    }
  }, [priceId, planKey, onSuccess, onError]);

  const handleCheckout = async () => {
    if (!window.Paddle || !isInitialized) {
      setError("Paddle is not initialized");
      return;
    }

    if (!priceId) {
      setError("Price ID not found");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Open Paddle checkout with custom styling
      window.Paddle.Checkout.open({
        items: [{ priceId }],
        customer: {
          id: customerId,
          email: customerEmail,
        },
        settings: {
          displayMode: "inline",
          theme: "dark",
          locale: "en",
          allowLogout: false,
          // Custom styling to match Axis CRM branding
          frameTarget: "paddle-checkout-container",
          frameInitialHeight: 500,
          frameStyle: `
            width: 100%;
            min-width: 312px;
            background: transparent;
            border: none;
          `,
          // Custom colors matching Axis CRM theme
          styles: {
            "--paddle-color-background": "rgba(26, 27, 30, 0.95)",
            "--paddle-color-text": "rgba(255, 255, 255, 0.95)",
            "--paddle-color-text-secondary": "rgba(255, 255, 255, 0.7)",
            "--paddle-color-border": "rgba(255, 255, 255, 0.2)",
            "--paddle-color-button": "#a855f7",
            "--paddle-color-button-hover": "#9333ea",
            "--paddle-color-button-text": "#ffffff",
            "--paddle-color-input-background": "rgba(255, 255, 255, 0.05)",
            "--paddle-color-input-border": "rgba(255, 255, 255, 0.2)",
            "--paddle-color-input-text": "rgba(255, 255, 255, 0.95)",
            "--paddle-border-radius": "0.625rem",
            "--paddle-font-family": "var(--font-geist-sans)",
          },
        },
        customData: {
          plan_key: planKey,
          user_id: customerId,
        },
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Checkout failed");
      setError(error.message);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-red-400">
        <p className="font-semibold">Error</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {/* Branded Header */}
      <div className="mb-6 text-center">
        <div className="flex justify-center mb-4">
          <AxisLogo variant="full" size="md" className="text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Complete Your Subscription
        </h2>
        <p className="text-neutral-400">
          Secure payment powered by Paddle
        </p>
      </div>

      {/* Plan Summary Card */}
      <div className="rounded-lg border border-white/20 bg-white/10 p-6 mb-6 backdrop-blur-md">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">{plan.label}</h3>
            <p className="text-sm text-neutral-400">{plan.description}</p>
          </div>
        </div>
        
        {/* Security Badges */}
        <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center gap-2 text-xs text-neutral-300">
            <Shield className="size-4 text-green-400" />
            <span>256-bit SSL Encryption</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-neutral-300">
            <Lock className="size-4 text-green-400" />
            <span>PCI DSS Compliant</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-neutral-300">
            <CheckCircle2 className="size-4 text-green-400" />
            <span>3D Secure Enabled</span>
          </div>
        </div>
      </div>

      {/* Checkout Container */}
      <div id="paddle-checkout-container" className="min-h-[500px]">
        {isLoading && !isInitialized && (
          <div className="flex flex-col items-center justify-center min-h-[500px]">
            <Loader2 className="size-8 animate-spin text-purple-400 mb-4" />
            <p className="text-neutral-400">Loading secure checkout...</p>
          </div>
        )}
      </div>

      {/* Checkout Button */}
      {isInitialized && (
        <div className="mt-6">
          <Button
            onClick={handleCheckout}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold py-6 text-lg"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 size-5 animate-spin" />
                Processing...
              </>
            ) : (
              "Proceed to Secure Checkout"
            )}
          </Button>
          
          <p className="text-xs text-center text-neutral-400 mt-3">
            Your payment information is encrypted and secure. We never store your card details.
          </p>
        </div>
      )}
    </div>
  );
}

