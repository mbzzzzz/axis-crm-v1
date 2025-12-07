# WhatsApp Cloud API Setup Guide

This guide explains how to set up WhatsApp Cloud API integration for sending invoices via WhatsApp.

## Overview

WhatsApp Cloud API is Meta's official API for sending messages through WhatsApp Business. Each user connects their own WhatsApp Business account, allowing them to send invoices directly to tenants.

## Prerequisites

1. A **Meta Business Account** (free)
2. A **WhatsApp Business Account** (free)
3. A verified phone number for your business
4. Access to **Meta for Developers** (developers.facebook.com)

## Step 1: Create Meta Business Account

1. Go to [business.facebook.com](https://business.facebook.com)
2. Click **Create Account** or sign in
3. Follow the setup wizard to create your business account
4. Verify your business information

## Step 2: Set Up WhatsApp Business Account

1. In Meta Business Suite, go to **WhatsApp Accounts**
2. Click **Add** → **Add Phone Number**
3. Enter your business phone number
4. Verify the phone number via SMS or call
5. Complete the business verification process

## Step 3: Create Meta App

1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Click **My Apps** → **Create App**
3. Select **Business** as the app type
4. Fill in app details:
   - **App Name**: Axis CRM (or your preferred name)
   - **App Contact Email**: Your email
5. Click **Create App**

## Step 4: Add WhatsApp Product

1. In your app dashboard, find **WhatsApp** in the products list
2. Click **Set Up** on WhatsApp
3. You'll be redirected to WhatsApp configuration

## Step 5: Get Your Credentials

1. In the WhatsApp setup page, you'll see:
   - **Phone Number ID**: A long numeric ID (e.g., `123456789012345`)
   - **Temporary Access Token**: A token that expires in 24 hours
   - **Business Account ID**: Your business account ID (optional)

2. **Important**: The temporary token expires quickly. To get a permanent token:
   - Go to **WhatsApp** → **API Setup**
   - Under **Access Tokens**, click **Generate Token**
   - Select your system user or create a new one
   - Copy the generated token (this is your permanent access token)

## Step 6: Connect in Axis CRM

1. Log in to Axis CRM
2. Go to **Settings** → **WhatsApp Integration**
3. Enter your credentials:
   - **Phone Number ID**: From Step 5
   - **Access Token**: Your permanent access token from Step 5
   - **Business Account ID**: (Optional) Your business account ID
   - **Phone Number**: (Optional) Your WhatsApp Business phone number
4. Click **Connect**

## Step 7: Test the Integration

1. Go to **Invoices** page
2. Find an invoice with a phone number
3. Click the **WhatsApp icon** button
4. The invoice should be sent via WhatsApp with the PDF attached

## Important Notes

### Free Tier Limits

WhatsApp Cloud API has a free tier that includes:
- **1,000 conversations per month** (free)
- Additional conversations are charged per message

### Phone Number Requirements

- Must be a real, verified phone number
- Cannot be a landline (must support SMS)
- Must be able to receive verification codes

### Message Templates

For the first message to a new contact, you must use a message template (pre-approved by Meta). However, once a user replies, you can send free-form messages for 24 hours.

### Security

- **Never share your access token** publicly
- Store credentials securely
- Rotate tokens if compromised
- Use environment variables for production

## Troubleshooting

### "Invalid Access Token"
- Check if your token has expired
- Generate a new permanent token in Meta for Developers
- Ensure you're using the correct Phone Number ID

### "Phone number not registered"
- Verify your phone number in Meta Business Suite
- Ensure WhatsApp Business is properly set up
- Check that the phone number is verified

### "Rate limit exceeded"
- You've exceeded the free tier limit
- Wait for the limit to reset or upgrade your plan
- Check your usage in Meta Business Suite

### "Failed to send message"
- Verify the recipient's phone number is in E.164 format
- Ensure the recipient has WhatsApp installed
- Check that your WhatsApp Business account is active

## Support

- [WhatsApp Cloud API Documentation](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [Meta for Developers Support](https://developers.facebook.com/support)
- [WhatsApp Business Help Center](https://www.whatsapp.com/business)

## Alternative: WhatsApp Business API Providers

If you prefer not to set up WhatsApp Cloud API directly, you can use third-party providers:
- **Twilio WhatsApp API** - Easy setup, paid service
- **360dialog** - WhatsApp Business API provider
- **MessageBird** - Communication platform with WhatsApp support

These providers handle the Meta setup for you but charge per message.

