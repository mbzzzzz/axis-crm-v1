# Add WhatsApp Environment Variables to Vercel

## Quick Steps

### Step 1: Go to Vercel Dashboard
1. Open https://vercel.com
2. Sign in to your account
3. Select your **AXIS-crm** project

### Step 2: Navigate to Environment Variables
1. Click on your project
2. Go to **Settings** tab (top navigation)
3. Click **Environment Variables** in the left sidebar

### Step 3: Add WhatsApp Variables

Add these **3 environment variables** one by one:

#### Variable 1:
- **Name:** `WHATSAPP_API_URL`
- **Value:** `https://waha-production-0727.up.railway.app/api`
- **Environment:** Select all (Production, Preview, Development)
- Click **Save**

#### Variable 2:
- **Name:** `WHATSAPP_SESSION`
- **Value:** `default`
- **Environment:** Select all (Production, Preview, Development)
- Click **Save**

#### Variable 3 (Required for your WAHA setup):
- **Name:** `WHATSAPP_API_KEY`
- **Value:** `acc25055b75b4c938c565e694a201f38`
- **Environment:** Select all (Production, Preview, Development)
- Click **Save**

### Step 4: Redeploy Your Application

After adding the variables:

1. Go to **Deployments** tab
2. Click the **three dots (⋯)** on your latest deployment
3. Click **Redeploy**
4. Or push a new commit to trigger automatic deployment

### Step 5: Verify Variables Are Set

After redeployment, verify the variables are loaded:

1. Go to **Deployments** → Click on your latest deployment
2. Check the **Build Logs** - should show no errors
3. Your app should now be able to connect to WAHA

## Environment Variables Summary

```
WHATSAPP_API_URL=https://waha-production-0727.up.railway.app/api
WHATSAPP_SESSION=default
WHATSAPP_API_KEY=acc25055b75b4c938c565e694a201f38
```

**Note:** The dashboard credentials are for accessing the WAHA dashboard directly (not needed in Vercel):
- Dashboard URL: https://waha-production-0727.up.railway.app
- Username: `admin`
- Password: `833187f430e3464ead17032f10e62406`

## Important Notes

- **Select all environments** (Production, Preview, Development) so it works everywhere
- **Redeploy after adding** - Vercel needs to rebuild to pick up new env vars
- **No quotes needed** - Vercel handles the values as-is
- **Case sensitive** - Variable names must match exactly

## Testing After Deployment

1. Visit your Vercel app: `https://your-app.vercel.app`
2. Go to: **Settings → Configure WhatsApp**
3. You should see the connection status
4. Scan QR code to connect WhatsApp

## Troubleshooting

### Problem: Variables not working after deployment
**Solution:**
- Make sure you selected all environments (Production, Preview, Development)
- Redeploy the application after adding variables
- Check deployment logs for any errors

### Problem: Still can't connect to WAHA
**Solution:**
- Verify Railway WAHA is running: https://waha-production-0727.up.railway.app
- Check the URL is correct (should end with `/api`)
- Verify Railway service is not sleeping (free tier may sleep after inactivity)

### Problem: Railway URL changed
**Solution:**
- If Railway regenerated your URL, update `WHATSAPP_API_URL` in Vercel
- Redeploy after updating

## Visual Guide

```
Vercel Dashboard
├── Your Project (AXIS-crm)
│   ├── Settings
│   │   ├── Environment Variables ← Click here
│   │   │   ├── Add New
│   │   │   │   ├── Name: WHATSAPP_API_URL
│   │   │   │   ├── Value: https://waha-production-0727.up.railway.app/api
│   │   │   │   ├── Environment: ☑ Production ☑ Preview ☑ Development
│   │   │   │   └── Save
│   │   │   ├── Add New
│   │   │   │   ├── Name: WHATSAPP_SESSION
│   │   │   │   ├── Value: default
│   │   │   │   ├── Environment: ☑ Production ☑ Preview ☑ Development
│   │   │   │   └── Save
```

---

**After adding these variables and redeploying, your WhatsApp integration will be live on Vercel!**

