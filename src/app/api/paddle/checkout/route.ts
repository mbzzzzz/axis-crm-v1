/**
 * Paddle Checkout API
 * Create checkout session server-side
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { createCheckoutSession } from "@/lib/paddle/client";
import { PADDLE_PRICE_IDS } from "@/lib/paddle/config";
import { isPlanKey } from "@/lib/plan-limits";
import { rateLimitMiddleware } from "@/lib/rate-limiter";

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.ip ?? request.headers.get("x-forwarded-for") ?? "unknown";
    const rateLimitRes = rateLimitMiddleware(
      "paddle_checkout",
      { interval: 60 * 1000, maxRequests: 10 },
      ip
    );
    if (rateLimitRes) {
      return rateLimitRes;
    }

    // Authenticate user
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { planKey, successUrl } = body;

    // Validate plan key
    if (!planKey || !isPlanKey(planKey)) {
      return NextResponse.json(
        { error: "Invalid plan key", code: "INVALID_PLAN" },
        { status: 400 }
      );
    }

    // Get price ID for plan
    const priceId = PADDLE_PRICE_IDS[planKey];
    if (!priceId) {
      return NextResponse.json(
        { error: `Price ID not configured for plan: ${planKey}`, code: "PRICE_NOT_CONFIGURED" },
        { status: 500 }
      );
    }

    // Create checkout session
    const checkoutSession = await createCheckoutSession({
      customerId: user.id,
      customerEmail: user.email!,
      priceId,
      successUrl: successUrl || `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard?subscription=success`,
      metadata: {
        plan_key: planKey,
        user_id: user.id,
      },
    });

    return NextResponse.json({
      checkoutId: checkoutSession.id,
      clientToken: checkoutSession.client_token,
      url: checkoutSession.checkout_url,
    });
  } catch (error: any) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create checkout session", code: "CHECKOUT_ERROR" },
      { status: 500 }
    );
  }
}

