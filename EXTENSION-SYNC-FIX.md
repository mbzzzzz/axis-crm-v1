# Extension Sync Fix - "Not signed in" Issue

## Problem
The extension shows "Not signed in to AXIS CRM" even when the user is logged into the dashboard.

## Root Cause
The extension cannot access Supabase session cookies due to:
1. Cookie domain/path restrictions
2. HttpOnly cookies (though browser.cookies API should handle this)
3. Cookie detection logic not finding Supabase cookies

## Solution Implemented

### 1. Enhanced Cookie Detection (`extensions/src/shared/cookie-helper.ts`)
- Multiple strategies to find cookies:
  - Try exact URL first
  - Try hostname domain
  - Try base domain (for subdomains)
  - Try all cookies and filter by domain
- Better logging to debug cookie detection
- Specific detection for Supabase cookies (sb-* prefix)

### 2. Session Check Endpoint (`src/app/api/auth/session-check/route.ts`)
- New endpoint: `/api/auth/session-check`
- Returns simple JSON indicating authentication status
- Helps extension verify authentication before making API calls
- Provides better error messages

### 3. Pre-flight Authentication Check (`extensions/src/background/index.ts`)
- Extension now checks authentication before syncing
- Provides clearer error messages
- Helps identify if the issue is authentication or something else

### 4. Improved Cookie Logging (`extensions/src/shared/api-client.ts`)
- Better logging when cookies are found/not found
- Warns when Supabase cookies are missing
- Helps debug cookie access issues

## How to Debug

### Step 1: Check Extension Console
1. Open extension popup
2. Open browser DevTools (F12)
3. Go to Console tab
4. Look for `[Extension]` log messages
5. Check if Supabase cookies are being found

### Step 2: Verify Cookie Permissions
1. Go to `chrome://extensions/` (or `about:addons` for Firefox)
2. Find "AXIS CRM Autofill"
3. Check that "cookies" permission is granted
4. If not, remove and reinstall extension

### Step 3: Check Dashboard Session
1. Open dashboard in a new tab
2. Make sure you're logged in
3. Check browser DevTools > Application > Cookies
4. Look for cookies starting with `sb-` or containing `supabase`
5. Note the domain and path of these cookies

### Step 4: Verify Extension URL Settings
1. Open extension options
2. Check that the AXIS CRM URL is correct
3. Should be: `https://axis-crm-v1.vercel.app` (or your domain)
4. Should NOT include `/tenant-portal`

## Common Issues and Fixes

### Issue: "No Supabase cookies found"
**Possible causes:**
- User is not logged in
- Session expired
- Cookies set for different domain

**Fix:**
1. Log into dashboard in a new tab
2. Refresh the dashboard page
3. Try syncing again

### Issue: "Session check failed"
**Possible causes:**
- Network error
- CORS issue
- URL misconfiguration

**Fix:**
1. Check extension URL settings
2. Verify dashboard is accessible
3. Check browser console for errors

### Issue: Cookies found but still "Not signed in"
**Possible causes:**
- Cookies are expired
- Session invalid
- Cookie domain mismatch

**Fix:**
1. Log out and log back in
2. Clear browser cookies
3. Re-authenticate
4. Try syncing again

## Testing Checklist

- [ ] Extension can detect Supabase cookies when logged in
- [ ] Session check endpoint returns authenticated: true
- [ ] Sync works when dashboard tab is open
- [ ] Error message is clear when not logged in
- [ ] Extension works after closing and reopening browser

## Technical Details

### Supabase Cookie Names
Supabase typically uses cookies with these patterns:
- `sb-<project-ref>-auth-token`
- `sb-<project-ref>-auth-token.0` (for large tokens, split into multiple cookies)

### Cookie Attributes
- HttpOnly: Yes (can't access via document.cookie, but browser.cookies API works)
- SameSite: Usually Lax
- Secure: Yes (HTTPS only)
- Path: Usually `/`

### Extension Cookie Access
The extension uses `browser.cookies.getAll()` which can access HttpOnly cookies if:
1. Extension has "cookies" permission ✅ (already configured)
2. Extension has host_permissions for the domain ✅ (already configured)
3. Cookies match the domain/path criteria

## Next Steps if Still Not Working

1. **Check browser console** for detailed error messages
2. **Verify extension permissions** are granted
3. **Test with a fresh browser profile** to rule out conflicts
4. **Check Supabase dashboard** for any auth configuration issues
5. **Try manual cookie inspection** in DevTools

## Code Changes Summary

1. ✅ Enhanced cookie detection with multiple strategies
2. ✅ Added session check endpoint
3. ✅ Pre-flight authentication check in extension
4. ✅ Better error messages and logging
5. ✅ Improved debugging output

