# OAuth Redirect Configuration Guide

## Problem
After Google OAuth sign-in, users are being redirected to:
1. Landing page
2. Back to sign-in page  
3. Finally to dashboard

This creates a poor user experience with multiple redirects.

## Solution

The redirect URL needs to be configured in **TWO places**:

### 1. Supabase Dashboard (Required)

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Authentication** > **URL Configuration**
4. Under **Redirect URLs**, add:
   ```
   https://axis-crm-v1.vercel.app/auth/callback
   https://axis-crm-v1-mustafabutt1s-projects.vercel.app/auth/callback
   http://localhost:3000/auth/callback
   ```
   (Add all your deployment URLs - production, preview, and local)

5. Under **Site URL**, set:
   ```
   https://axis-crm-v1.vercel.app
   ```
   (Or your main production URL)

### 2. Google Cloud Console (Required for Google OAuth)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. Navigate to **APIs & Services** > **Credentials**
4. Click on your OAuth 2.0 Client ID (the one used by Supabase)
5. Under **Authorized redirect URIs**, add:
   ```
   https://[your-supabase-project].supabase.co/auth/v1/callback
   ```
   
   **Important**: This is Supabase's callback URL, NOT your app's callback URL. Supabase handles the OAuth flow and then redirects to your app.

   To find your Supabase callback URL:
   - Go to Supabase Dashboard > Authentication > Providers > Google
   - The redirect URI will be shown there (format: `https://[project-ref].supabase.co/auth/v1/callback`)

## How It Works

1. User clicks "Sign in with Google" on your app
2. User is redirected to Google for authentication
3. Google redirects to Supabase's callback URL (`https://[project].supabase.co/auth/v1/callback`)
4. Supabase processes the OAuth and creates a session
5. Supabase redirects to your app's callback URL (`/auth/callback?redirectedFrom=/dashboard`)
6. Your app exchanges the code for a session
7. Your app redirects to `/dashboard`

## Current Configuration

The code is already configured to:
- Use `/auth/callback?redirectedFrom=/dashboard` as the redirect URL
- Always redirect to dashboard after successful OAuth
- Prevent landing page redirects during OAuth flow

## Testing

After configuring both Supabase and Google Cloud Console:

1. Clear browser cookies and cache
2. Go to `/login`
3. Click "Sign in with Google"
4. Complete Google authentication
5. You should be redirected directly to `/dashboard` (no landing page or sign-in page in between)

## Troubleshooting

### Still seeing redirect loop?

1. **Check Supabase Redirect URLs**: Make sure `/auth/callback` is added to Supabase Dashboard
2. **Check Google Cloud Console**: Make sure Supabase's callback URL is added
3. **Check browser console**: Look for any errors in the OAuth flow
4. **Clear cookies**: Old session cookies might be interfering
5. **Check network tab**: Verify the redirect chain is correct

### Getting "redirect_uri_mismatch" error?

- This means the redirect URI in Google Cloud Console doesn't match what Supabase is using
- Add the exact Supabase callback URL shown in Supabase Dashboard > Authentication > Providers > Google

### Session not persisting after OAuth?

- Check that cookies are being set correctly
- Verify Supabase session configuration
- Check browser console for cookie-related errors

## Code Changes Made

1. **`src/app/(auth)/login/page.tsx`**: 
   - Improved OAuth redirect URL configuration
   - Added proper query parameters for OAuth flow

2. **`src/app/auth/callback/route.ts`**:
   - Added error handling for OAuth errors
   - Improved redirect logic to always go to dashboard

3. **`src/app/page.tsx`**:
   - Added check to prevent landing page redirect during OAuth callback
   - Uses sessionStorage to track OAuth callback timing

## Next Steps

1. ✅ Configure Supabase Dashboard redirect URLs
2. ✅ Configure Google Cloud Console redirect URIs
3. ✅ Test the OAuth flow
4. ✅ Verify direct redirect to dashboard

