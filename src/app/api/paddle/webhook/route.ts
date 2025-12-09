/**
 * Paddle Webhook Handler
 * Secure webhook endpoint for Paddle payment events
 * 
 * Security Features:
 * - Webhook signature verification
 * - Rate limiting
 * - Idempotency handling
 * - Error logging
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/paddle/client";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { db } from "@/db";
import { userPreferences } from "@/db/schema";
import { eq } from "drizzle-orm";
import { rateLimitMiddleware } from "@/lib/rate-limiter";

// Store processed webhook IDs to prevent duplicate processing
const processedWebhooks = new Set<string>();
const MAX_WEBHOOK_AGE = 5 * 60 * 1000; // 5 minutes

export async function POST(request: NextRequest) {
  try {
    // Rate limiting for webhook endpoint
    const ip = request.ip ?? request.headers.get("x-forwarded-for") ?? "unknown";
    const rateLimitRes = rateLimitMiddleware(
      "paddle_webhook",
      { interval: 60 * 1000, maxRequests: 20 },
      ip
    );
    if (rateLimitRes) {
      return rateLimitRes;
    }

    // Get raw body for signature verification
    const rawBody = await request.text();
    const signature = request.headers.get("paddle-signature");

    if (!signature) {
      console.error("Paddle webhook: Missing signature");
      return NextResponse.json(
        { error: "Missing signature" },
        { status: 401 }
      );
    }

    // Verify webhook signature
    const isValid = verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      console.error("Paddle webhook: Invalid signature");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    // Parse webhook payload
    const event = JSON.parse(rawBody);

    // Check for duplicate webhooks (idempotency)
    const eventId = event.event_id || event.id;
    if (eventId && processedWebhooks.has(eventId)) {
      console.log(`Paddle webhook: Duplicate event ${eventId}, ignoring`);
      return NextResponse.json({ received: true });
    }

    // Store event ID
    if (eventId) {
      processedWebhooks.add(eventId);
      // Clean up old webhook IDs periodically
      setTimeout(() => {
        processedWebhooks.delete(eventId);
      }, MAX_WEBHOOK_AGE);
    }

    // Handle different event types
    // Paddle webhooks can have different structures, handle both
    const eventType = event.event_type || event.type || event.name;
    const eventData = event.data || event;
    
    console.log(`Paddle webhook received: ${eventType}`, { eventId });

    switch (eventType) {
      case "transaction.completed":
      case "subscription.created":
      case "subscription.activated":
        await handleSubscriptionCreated(eventData);
        break;

      case "subscription.updated":
      case "subscription.updated":
        await handleSubscriptionUpdated(eventData);
        break;

      case "subscription.canceled":
      case "subscription.cancelled":
      case "subscription.past_due":
        await handleSubscriptionCanceled(eventData);
        break;

      case "transaction.payment_succeeded":
      case "payment.succeeded":
        await handlePaymentSucceeded(eventData);
        break;

      case "transaction.payment_failed":
      case "payment.failed":
        await handlePaymentFailed(eventData);
        break;

      default:
        console.log(`Unhandled Paddle webhook event: ${eventType}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Paddle webhook error:", error);
    // Return 200 to prevent Paddle from retrying invalid requests
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 200 }
    );
  }
}

async function handleSubscriptionCreated(event: any) {
  try {
    const subscriptionId = event.id || event.subscription_id || event.subscription?.id;
    const customerId = event.customer_id || event.customer?.id || event.custom_data?.user_id;
    const priceId = event.items?.[0]?.price_id || event.price_id || event.price?.id;
    const planKey = event.custom_data?.plan_key || event.metadata?.plan_key;

    if (!customerId || !subscriptionId) {
      console.error("Missing customer_id or subscription_id in webhook");
      return;
    }

    // Update user preferences with subscription info
    await db
      .update(userPreferences)
      .set({
        paddleSubscriptionId: subscriptionId,
        paddleCustomerId: customerId,
        paddlePriceId: priceId,
        planKey: planKey || "professional",
        subscriptionStatus: "active",
        subscriptionUpdatedAt: new Date(),
      })
      .where(eq(userPreferences.userId, customerId));

    console.log(`Subscription created for user ${customerId}: ${subscriptionId}`);
  } catch (error) {
    console.error("Error handling subscription created:", error);
    throw error;
  }
}

async function handleSubscriptionUpdated(event: any) {
  try {
    const subscriptionId = event.id || event.subscription_id || event.subscription?.id;
    const customerId = event.customer_id || event.customer?.id || event.custom_data?.user_id;
    const status = event.status || event.subscription?.status;
    const priceId = event.items?.[0]?.price_id || event.price_id || event.price?.id;
    const planKey = event.custom_data?.plan_key || event.metadata?.plan_key;

    if (!customerId || !subscriptionId) {
      console.error("Missing customer_id or subscription_id in webhook");
      return;
    }

    await db
      .update(userPreferences)
      .set({
        paddleSubscriptionId: subscriptionId,
        paddlePriceId: priceId,
        planKey: planKey || undefined,
        subscriptionStatus: status === "active" ? "active" : "inactive",
        subscriptionUpdatedAt: new Date(),
      })
      .where(eq(userPreferences.userId, customerId));

    console.log(`Subscription updated for user ${customerId}: ${subscriptionId} - ${status}`);
  } catch (error) {
    console.error("Error handling subscription updated:", error);
    throw error;
  }
}

async function handleSubscriptionCanceled(event: any) {
  try {
    const subscriptionId = event.id || event.subscription_id || event.subscription?.id;
    const customerId = event.customer_id || event.customer?.id || event.custom_data?.user_id;

    if (!customerId || !subscriptionId) {
      console.error("Missing customer_id or subscription_id in webhook");
      return;
    }

    await db
      .update(userPreferences)
      .set({
        subscriptionStatus: "canceled",
        subscriptionUpdatedAt: new Date(),
      })
      .where(eq(userPreferences.userId, customerId));

    console.log(`Subscription canceled for user ${customerId}: ${subscriptionId}`);
  } catch (error) {
    console.error("Error handling subscription canceled:", error);
    throw error;
  }
}

async function handlePaymentSucceeded(event: any) {
  try {
    const customerId = event.customer_id || event.customer?.id || event.custom_data?.user_id;
    const transactionId = event.id || event.transaction_id || event.transaction?.id;

    console.log(`Payment succeeded for user ${customerId}: ${transactionId}`);
    
    // You can add additional logic here, such as:
    // - Sending confirmation emails
    // - Updating usage limits
    // - Logging payment events
  } catch (error) {
    console.error("Error handling payment succeeded:", error);
    throw error;
  }
}

async function handlePaymentFailed(event: any) {
  try {
    const customerId = event.customer_id || event.customer?.id || event.custom_data?.user_id;
    const transactionId = event.id || event.transaction_id || event.transaction?.id;

    console.log(`Payment failed for user ${customerId}: ${transactionId}`);
    
    // You can add logic here to:
    // - Notify the user
    // - Update subscription status
    // - Send retry reminders
  } catch (error) {
    console.error("Error handling payment failed:", error);
    throw error;
  }
}

