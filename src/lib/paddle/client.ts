/**
 * Paddle Client Utilities
 * Server-side Paddle API client
 */

import { PADDLE_ENV, getPaddleApiUrl } from './config';

/**
 * Make authenticated request to Paddle API
 */
export async function paddleApiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const apiUrl = getPaddleApiUrl();
  const url = `${apiUrl}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${PADDLE_ENV.secretKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Paddle API error: ${response.status} - ${error}`);
  }

  return response;
}

/**
 * Verify webhook signature
 * Critical for security - ensures webhooks are from Paddle
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string
): boolean {
  if (!PADDLE_ENV.webhookSecret) {
    console.error('PADDLE_WEBHOOK_SECRET not configured');
    return false;
  }

  // Paddle uses HMAC SHA256 for webhook signatures
  const crypto = require('crypto');
  const expectedSignature = crypto
    .createHmac('sha256', PADDLE_ENV.webhookSecret)
    .update(payload)
    .digest('hex');

  // Use constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Create a checkout session
 */
export async function createCheckoutSession(params: {
  customerId: string;
  customerEmail: string;
  priceId: string;
  successUrl: string;
  metadata?: Record<string, string>;
}) {
  const response = await paddleApiRequest('/transactions', {
    method: 'POST',
    body: JSON.stringify({
      items: [
        {
          price_id: params.priceId,
          quantity: 1,
        },
      ],
      customer_id: params.customerId,
      customer_email: params.customerEmail,
      custom_data: params.metadata || {},
      return_url: params.successUrl,
    }),
  });

  return response.json();
}

/**
 * Get subscription details
 */
export async function getSubscription(subscriptionId: string) {
  const response = await paddleApiRequest(`/subscriptions/${subscriptionId}`);
  return response.json();
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(
  subscriptionId: string,
  immediately = false
) {
  const response = await paddleApiRequest(
    `/subscriptions/${subscriptionId}/cancel`,
    {
      method: 'POST',
      body: JSON.stringify({
        effective_from: immediately ? 'immediately' : 'next_billing_period',
      }),
    }
  );
  return response.json();
}

/**
 * Update subscription (change plan)
 */
export async function updateSubscription(
  subscriptionId: string,
  priceId: string
) {
  const response = await paddleApiRequest(
    `/subscriptions/${subscriptionId}`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        items: [
          {
            price_id: priceId,
            quantity: 1,
          },
        ],
        proration_billing_mode: 'prorated_immediately',
      }),
    }
  );
  return response.json();
}

