# Deploy WAHA on Railway - Free Setup Guide

## Step-by-Step Instructions

### Step 1: Create Railway Account (Free)
1. Go to https://railway.app
2. Click "Start a New Project" or "Login"
3. Sign up with GitHub (recommended) or email
4. Free tier includes $5 credit monthly (enough for WAHA)

### Step 2: Deploy WAHA Docker Image
1. On the Railway dashboard, click **"New Project"**
2. Select **"Deploy from Docker image"** or **"Deploy a Docker image"**
3. In the Docker image field, enter:
   ```
   devlikeapro/waha
   ```
4. Click **"Deploy"**

### Step 3: Configure Port
1. After deployment starts, go to **Settings** tab
2. Find **"Port"** or **"Expose Port"** setting
3. Set it to: `3000`
4. Save changes

### Step 4: Get Your WAHA URL
1. Go to **Settings** → **Networking** or **Domains**
2. Railway will generate a public URL like: `https://your-project-name.up.railway.app`
3. Copy this URL - you'll need it!

### Step 5: Update Your Next.js App
1. Open your `.env.local` file
2. Update the WhatsApp URL:
   ```env
   WHATSAPP_API_URL=https://your-project-name.up.railway.app/api
   WHATSAPP_SESSION=default
   ```
   Replace `your-project-name.up.railway.app` with your actual Railway URL

3. Save the file
4. Restart your Next.js dev server:
   ```bash
   npm run dev
   ```

### Step 6: Connect WhatsApp
1. In your Next.js app, go to: **Settings → Configure WhatsApp**
2. Or visit: `http://localhost:3000/settings/whatsapp`
3. The status should show "Scan QR Code"
4. Scan the QR code with your WhatsApp mobile app
5. Once connected, status will show "Connected" (green badge)

## Important Railway Settings

### Environment Variables (Already Configured)
Your Railway WAHA deployment has these credentials configured:
- **API Key:** `acc25055b75b4c938c565e694a201f38` (use this in Vercel)
- **Dashboard Username:** `admin`
- **Dashboard Password:** `833187f430e3464ead17032f10e62406`
- **Dashboard URL:** https://waha-production-0727.up.railway.app

### Keep Container Running
Railway will keep WAHA running 24/7 automatically. No need to keep your computer on!

### Monitor Usage
- Railway dashboard shows resource usage
- Free tier: $5 credit/month (WAHA uses very little)
- Check usage in Railway dashboard → Usage tab

## Troubleshooting

### Problem: Can't access WAHA URL
**Solution:**
- Make sure deployment is complete (check Railway dashboard)
- Wait 1-2 minutes after deployment
- Try accessing: `https://your-url.up.railway.app` directly
- Check Railway logs for errors

### Problem: "Failed to connect to WAHA service"
**Solution:**
- Verify the URL in `.env.local` is correct
- Make sure URL includes `/api` at the end
- Check Railway deployment is running (green status)
- Try accessing the URL directly in browser

### Problem: Railway deployment fails
**Solution:**
- Make sure Docker image name is exactly: `devlikeapro/waha`
- Check Railway logs for specific error
- Try redeploying

## Cost Breakdown

- **Railway Free Tier**: $5 credit/month
- **WAHA Docker Image**: Free (open source)
- **WhatsApp**: Free
- **Total Cost**: $0 (as long as usage stays under $5/month)

WAHA is lightweight and should easily stay within free tier limits.

## Next Steps After Deployment

1. ✅ WAHA deployed on Railway
2. ✅ URL added to `.env.local`
3. ✅ Next.js app restarted
4. ✅ Navigate to Settings → Configure WhatsApp
5. ✅ Scan QR code with WhatsApp
6. ✅ Test sending an invoice via WhatsApp

## Alternative: Local Setup

If you prefer to run locally instead:
1. Install Docker Desktop: https://www.docker.com/products/docker-desktop/
2. Run: `docker run -it --rm -p 3000:3000 --name waha devlikeapro/waha`
3. Use: `WHATSAPP_API_URL=http://localhost:3000/api` in `.env.local`

But Railway is better for production as it runs 24/7 without your computer being on!

