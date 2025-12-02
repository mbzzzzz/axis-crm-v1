# Railway WAHA 502 Error Fix

## Problem
WAHA service is returning 502 Bad Gateway errors because it's binding to `[::1]:8080` (IPv6 localhost only) instead of listening on all interfaces and using Railway's PORT environment variable.

## Solution

### Option 1: Configure WAHA to Use PORT Environment Variable (Recommended)

1. **Go to Railway Dashboard** → Your WAHA Service → **Variables** tab

2. **Add these environment variables:**
   ```
   PORT=8080
   WAHA_PORT=8080
   ```

3. **Check if Railway provides a PORT variable:**
   - Railway automatically provides a `PORT` environment variable
   - Check your service's **Variables** tab to see if `PORT` is already set
   - If Railway's PORT is different (e.g., `PORT=3000`), you need to configure WAHA to use it

4. **Configure WAHA to bind to 0.0.0.0:**
   Add this environment variable:
   ```
   WAHA_HOST=0.0.0.0
   ```

5. **Redeploy the service:**
   - Go to **Deployments** tab
   - Click **Redeploy** on the latest deployment
   - Or trigger a new deployment by making a small change

### Option 2: Use Railway's Port Configuration

If WAHA doesn't support the PORT environment variable, you can configure Railway to forward to port 8080:

1. **Go to Railway Dashboard** → Your WAHA Service → **Settings**

2. **Check the "Port" setting:**
   - Railway should automatically detect the port
   - If not, set it to `8080`

3. **Verify the service is listening on 0.0.0.0:**
   - The service needs to bind to `0.0.0.0` (all interfaces), not `127.0.0.1` or `[::1]`
   - This is usually controlled by the `WAHA_HOST` or `HOST` environment variable

### Option 3: Use Dockerfile/Start Command (If Available)

If Railway allows you to customize the start command:

1. **Go to Railway Dashboard** → Your WAHA Service → **Settings** → **Deploy**

2. **Set the start command to:**
   ```bash
   node --host=0.0.0.0 --port=${PORT:-8080}
   ```
   Or if WAHA uses a different command format, check WAHA documentation.

3. **Or set environment variables:**
   ```
   HOST=0.0.0.0
   PORT=8080
   ```

## Verification Steps

After applying the fix:

1. **Check the deploy logs** - You should see:
   ```
   WhatsApp HTTP API is running on: http://0.0.0.0:8080
   ```
   Instead of:
   ```
   WhatsApp HTTP API is running on: http://[::1]:8080
   ```

2. **Test the service:**
   - Visit: `https://waha-production-0727.up.railway.app`
   - You should see the WAHA dashboard (not a 502 error)
   - Try: `https://waha-production-0727.up.railway.app/api/sessions`

3. **Check your CRM:**
   - Go to Settings → Configure WhatsApp
   - The status should now connect successfully

## Current Status from Logs

From your build logs, WAHA is:
- ✅ Starting successfully
- ✅ All routes mapped correctly
- ❌ Binding to `[::1]:8080` (IPv6 localhost only)
- ❌ Not accessible from Railway's load balancer

## Quick Fix Checklist

- [ ] Add `WAHA_HOST=0.0.0.0` environment variable in Railway
- [ ] Verify `PORT` environment variable is set (Railway provides this automatically)
- [ ] Redeploy the service
- [ ] Check logs show binding to `0.0.0.0` instead of `[::1]`
- [ ] Test the dashboard URL
- [ ] Test the API endpoint
- [ ] Verify CRM can connect

## Alternative: Check WAHA Documentation

If the above doesn't work, check WAHA's documentation for:
- Environment variables to control host binding
- How to configure the port
- Railway-specific deployment instructions

WAHA Documentation: https://waha.devlike.pro/

## Still Having Issues?

If the service still shows 502 errors after trying the above:

1. **Check Railway's HTTP logs** for more details
2. **Check if the service is actually running** (not crashed)
3. **Verify the service is listening on the correct port** (check Railway's port configuration)
4. **Try accessing the service directly** using Railway's internal networking (if available)

