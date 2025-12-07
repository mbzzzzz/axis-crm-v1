# Gmail API Configuration Guide

This guide explains how to configure the Gmail API integration for Axis CRM to allow sending invoices via email.

## Prerequisites

1.  A Google Cloud Console account.
2.  Access to the Gmail account you want to send emails from (e.g., `notifications@yourcompany.com` or your personal agent email).

## Step 1: Create a Google Cloud Project

1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Click **Create Project**.
3.  Name it `Axis CRM Emailer` (or similar) and click **Create**.

## Step 2: Enable Gmail API

1.  In the dashboard, search for **"Gmail API"** in the top search bar.
2.  Select **Gmail API** from the results.
3.  Click **Enable**.

## Step 3: Configure OAuth Consent Screen

1.  Go to **APIs & Services > OAuth consent screen**.
2.  Select **External** (unless you are a Google Workspace user and only want internal users).
3.  Fill in the required fields:
    *   **App Name**: Axis CRM
    *   **User Support Email**: Your email
    *   **Developer Contact Email**: Your email
4.  Click **Save and Continue**.
5.  **Scopes**: Click **Add or Remove Scopes**.
    *   Search for `gmail.send` and select it (`https://www.googleapis.com/auth/gmail.send`).
    *   Click **Update**.
6.  **Test Users**: Add the email address you plan to send emails *from* (e.g., yourself).
7.  Click **Save and Continue**.

## Step 4: Create Credentials

1.  Go to **APIs & Services > Credentials**.
2.  Click **Create Credentials > OAuth client ID**.
3.  Application type: **Web application**.
4.  Name: `Axis CRM Web Client`.
5.  **Authorized redirect URIs** (IMPORTANT - Add both):
    *   For Production: `https://axis-crm-v1.vercel.app/api/integrations/google/callback`
    *   For Local Development: `http://localhost:3000/api/integrations/google/callback`
    *   (Optional) For testing: `https://developers.google.com/oauthplayground` (if you want to use OAuth Playground to generate refresh token)
6.  Click **Create**.
7.  Copy the **Client ID** and **Client Secret**.

## Step 5: Generate Refresh Token

To send emails without logging in every time, we need a "Refresh Token".

1.  Go to the [Google OAuth 2.0 Playground](https://developers.google.com/oauthplayground).
2.  Click the **Settings gear icon** (top right).
    *   Check **Use your own OAuth credentials**.
    *   Paste your **Client ID** and **Client Secret**.
3.  On the left, look for **Gmail API v1**.
    *   Select `https://www.googleapis.com/auth/gmail.send`.
4.  Click **Authorize APIs**.
5.  Log in with the Gmail account you want to use as the sender.
    *   *Note: If you get a "Google hasn't verified this app" warning, click Advanced > Go to Axis CRM (unsafe) since you allowlisted yourself.*
6.  Click **Exchange authorization code for tokens**.
7.  Copy the **Refresh Token**.

## Step 6: Configure Environment Variables

Add the following variables to your project's `.env.local` file (or Vercel environment variables):

**For Production (Vercel):**
```env
GOOGLE_CLIENT_ID=your_pasted_client_id
GOOGLE_CLIENT_SECRET=your_pasted_client_secret
GOOGLE_REDIRECT_URI=https://axis-crm-v1.vercel.app/api/integrations/google/callback
GMAIL_REFRESH_TOKEN=your_pasted_refresh_token
GMAIL_SENDER_EMAIL=your_email@gmail.com
```

**For Local Development:**
```env
GOOGLE_CLIENT_ID=your_pasted_client_id
GOOGLE_CLIENT_SECRET=your_pasted_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/integrations/google/callback
GMAIL_REFRESH_TOKEN=your_pasted_refresh_token
GMAIL_SENDER_EMAIL=your_email@gmail.com
```

**Note:** The `GMAIL_REFRESH_TOKEN` and `GMAIL_SENDER_EMAIL` are optional if you're using per-user OAuth tokens (stored in user preferences). The system will use the user's connected Gmail account if available.

## Verification

1.  Restart your Next.js server (`npm run dev`).
2.  Go to the **Invoices** page.
3.  Click the **Send Email** icon on an invoice.
4.  The recipient should receive an email from `GMAIL_SENDER_EMAIL` but with the "Reply-To" set to the specific agent's email.
