# Paddle Payment Gateway Setup Guide

This guide will help you set up Paddle payment gateway integration with Axis CRM.

## Prerequisites

1. A Paddle account (sign up at https://paddle.com)
2. Access to your Paddle Dashboard
3. Database migration access (for adding subscription fields)

## Step 1: Get Paddle API Credentials

1. Log in to your [Paddle Dashboard](https://vendors.paddle.com)
2. Navigate to **Developer Tools** > **API Keys**
3. Copy the following:
   - **Public Key** (for client-side)
   - **Secret Key** (for server-side) - Keep this secure!
   - **Vendor ID** (your account ID)

## Step 2: Create Products and Prices

1. Go to **Catalog** > **Products** in Paddle Dashboard
2. Create products for each plan:
   - **Professional Plan** ($90/month)
   - **Business Plan** ($150/month)
   - **Enterprise Plan** (Custom pricing)

3. For each product, create a **Price**:
   - Set billing period (monthly/yearly)
   - Set the price amount
   - Copy the **Price ID** for each plan

## Step 3: Set Up Webhook

1. Go to **Developer Tools** > **Notifications** in Paddle Dashboard
2. Click **Add Notification**
3. Set the webhook URL:
   ```
   https://your-domain.com/api/paddle/webhook
   ```
   For local testing:
   ```
   https://your-ngrok-url.ngrok.io/api/paddle/webhook
   ```
4. Select the following events to listen for:
   - `subscription.created`
   - `subscription.updated`
   - `subscription.canceled`
   - `transaction.completed`
   - `transaction.payment_succeeded`
   - `transaction.payment_failed`

5. Copy the **Webhook Signing Secret** (you'll need this for verification)

## Step 4: Configure Environment Variables

Add these to your `.env.local` file (and Vercel environment variables):

```bash
# Paddle Configuration
NEXT_PUBLIC_PADDLE_ENVIRONMENT=sandbox  # Use 'production' for live
NEXT_PUBLIC_PADDLE_PUBLIC_KEY=your_public_key_here
PADDLE_SECRET_KEY=your_secret_key_here
PADDLE_WEBHOOK_SECRET=your_webhook_secret_here
PADDLE_VENDOR_ID=your_vendor_id_here

# Price IDs (from Step 2)
PADDLE_PRICE_ID_PROFESSIONAL=pri_01xxxxx
PADDLE_PRICE_ID_BUSINESS=pri_01xxxxx
PADDLE_PRICE_ID_ENTERPRISE=pri_01xxxxx
```

## Step 5: Run Database Migration

The schema has been updated to include Paddle subscription fields. Run your migration:

```bash
npm run db:migrate
# or
npx drizzle-kit push
```

This adds the following fields to `user_preferences`:
- `paddle_subscription_id`
- `paddle_customer_id`
- `paddle_price_id`
- `subscription_status`
- `subscription_updated_at`

## Step 6: Test the Integration

### Sandbox Testing

1. Use Paddle's sandbox environment for testing
2. Use test card numbers from [Paddle's test cards](https://developer.paddle.com/concepts/payment-methods/test-cards)
3. Test the checkout flow:
   - Navigate to `/checkout?plan=professional`
   - Complete the checkout with a test card
   - Verify webhook is received
   - Check database for subscription data

### Test Cards

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0025 0000 3155`

## Step 7: Go Live

1. Switch `NEXT_PUBLIC_PADDLE_ENVIRONMENT` to `production`
2. Update webhook URL to production domain
3. Use real payment methods
4. Monitor webhook logs in Paddle Dashboard

## Security Features

✅ **Webhook Signature Verification** - All webhooks are verified using HMAC SHA256  
✅ **Rate Limiting** - Webhook endpoint is rate-limited  
✅ **Idempotency** - Duplicate webhooks are ignored  
✅ **PCI Compliance** - Paddle handles all card data (PCI DSS Level 1)  
✅ **3D Secure** - Enabled by default for additional security  
✅ **CSRF Protection** - Built into Next.js API routes  

## Customization

The checkout component (`src/components/paddle/checkout.tsx`) is fully branded with Axis CRM styling:
- Dark theme matching your design system
- Purple/blue gradient buttons
- Custom colors via CSS variables
- Logo and branding elements

## Troubleshooting

### Webhook Not Receiving Events

1. Check webhook URL is accessible (use ngrok for local testing)
2. Verify webhook secret matches
3. Check Paddle Dashboard > Notifications for delivery status
4. Review server logs for errors

### Checkout Not Loading

1. Verify `NEXT_PUBLIC_PADDLE_PUBLIC_KEY` is set
2. Check browser console for errors
3. Ensure Paddle script loads correctly
4. Verify price IDs are correct

### Subscription Not Updating

1. Check webhook handler logs
2. Verify database migration ran successfully
3. Check user ID matches between checkout and webhook
4. Review Paddle Dashboard for subscription status

## Support

- [Paddle Documentation](https://developer.paddle.com)
- [Paddle Support](https://paddle.com/support)
- Check server logs for detailed error messages

