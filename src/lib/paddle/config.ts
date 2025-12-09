/**
 * Paddle Payment Gateway Configuration
 * Secure configuration for Paddle integration
 */

export const PADDLE_ENV = {
  // Use sandbox for development, production for live
  environment: (process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT || 'sandbox') as 'sandbox' | 'production',
  
  // Public key for client-side (safe to expose)
  publicKey: process.env.NEXT_PUBLIC_PADDLE_PUBLIC_KEY || '',
  
  // Secret key for server-side (NEVER expose to client)
  secretKey: process.env.PADDLE_SECRET_KEY || '',
  
  // Webhook signing secret for verifying webhook authenticity
  webhookSecret: process.env.PADDLE_WEBHOOK_SECRET || '',
  
  // Vendor ID (your Paddle account ID)
  vendorId: process.env.PADDLE_VENDOR_ID || '',
};

// Validate configuration
export function validatePaddleConfig() {
  if (!PADDLE_ENV.publicKey) {
    throw new Error('PADDLE_PUBLIC_KEY is not configured');
  }
  if (!PADDLE_ENV.secretKey) {
    throw new Error('PADDLE_SECRET_KEY is not configured');
  }
  if (!PADDLE_ENV.webhookSecret) {
    throw new Error('PADDLE_WEBHOOK_SECRET is not configured');
  }
}

// Paddle API endpoints
export const PADDLE_API_URLS = {
  sandbox: 'https://sandbox-api.paddle.com',
  production: 'https://api.paddle.com',
};

export function getPaddleApiUrl() {
  return PADDLE_API_URLS[PADDLE_ENV.environment];
}

// Plan mapping: Map your plan keys to Paddle price IDs
export const PADDLE_PRICE_IDS: Record<string, string> = {
  professional: process.env.PADDLE_PRICE_ID_PROFESSIONAL || '',
  business: process.env.PADDLE_PRICE_ID_BUSINESS || '',
  enterprise: process.env.PADDLE_PRICE_ID_ENTERPRISE || '',
};

