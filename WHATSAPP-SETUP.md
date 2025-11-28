# WhatsApp WAHA Integration - Complete Setup Guide

This guide covers everything you need to set up WhatsApp integration using WAHA (WhatsApp HTTP API) - both local development and production deployment.

## Prerequisites (All Free)

- Docker Desktop (free) - [Download here](https://www.docker.com/products/docker-desktop/)
- Node.js and npm (already installed for your Next.js project)
- A WhatsApp account (free)

## Step 1: Install Docker Desktop

1. Download Docker Desktop from: https://www.docker.com/products/docker-desktop/
2. Install and start Docker Desktop
3. Verify installation by opening terminal and running:
   ```bash
   docker --version
   ```
   You should see Docker version information.

## Step 2: Run WAHA Service (Free & Local)

Open your terminal and run this single command:

```bash
docker run -it --rm -p 3000:3000 --name waha devlikeapro/waha
```

**What this does:**
- Downloads and runs WAHA (WhatsApp HTTP API) in a Docker container
- Exposes the API on port 3000
- `--rm` flag automatically removes the container when stopped (saves space)
- `--name waha` gives it a friendly name

**Expected output:**
```
WAHA is starting...
API available at http://localhost:3000/api
Dashboard available at http://localhost:3000
```

**Keep this terminal window open** - WAHA needs to keep running.

## Step 3: Access WAHA Dashboard

1. Open your browser and go to: **http://localhost:3000**
2. You should see the WAHA dashboard
3. This confirms WAHA is running correctly

## Step 4: Configure Your Next.js App

### For Local Development:
1. Open your `.env.local` file in the project root
2. Add these environment variables:

```env
# WhatsApp Integration (WAHA) - Local
WHATSAPP_API_URL=http://localhost:3000/api
WHATSAPP_SESSION=default
WHATSAPP_API_KEY=acc25055b75b4c938c565e694a201f38
```

3. Save the file
4. **Restart your Next.js development server** if it's running:
   ```bash
   # Stop the server (Ctrl+C) and restart:
   npm run dev
   ```

### For Production (Railway + Vercel):
Your production environment is already configured:
- **Railway WAHA URL:** `https://waha-production-0727.up.railway.app/api`
- **API Key:** `acc25055b75b4c938c565e694a201f38`
- **Vercel Environment Variables:** Already set (Production, Preview, Development)

**Note:** Environment variables are already configured in Vercel. No action needed!

## Step 5: Connect Your WhatsApp Account

1. In your Next.js app, navigate to: **Settings → Configure WhatsApp**
   - Or go directly to: `http://localhost:3000/settings/whatsapp`

2. You should see the connection status page

3. The status will show **"Scan QR Code"** - this means WAHA is ready

4. Click the QR code area or wait for it to load automatically

5. **On your phone:**
   - Open WhatsApp
   - Go to **Settings** → **Linked Devices** (or **Devices** on some versions)
   - Tap **"Link a Device"** or **"+"** button
   - Point your phone camera at the QR code on your screen
   - Wait for connection confirmation

6. Once connected, the status will change to **"Connected"** (green badge)

## Step 6: Test the Integration

### Test 1: Check Connection Status
- Go to Settings → Configure WhatsApp
- Status should show "Connected" with a green badge
- QR code should be hidden

### Test 2: Send an Invoice via WhatsApp
1. Go to **Invoices** page
2. Find an invoice that has a phone number (in `clientPhone` field)
3. Click the **WhatsApp icon** (MessageSquare) button next to the invoice
4. You should see a success toast notification
5. Check the recipient's WhatsApp - they should receive the invoice PDF

### Test 3: Send from Tenants Page
1. Go to **Tenants** page
2. Find a tenant with a phone number
3. Click the **WhatsApp icon** button
4. Invoice will be generated and sent automatically

## Troubleshooting

### Problem: Docker command fails
**Solution:**
- Make sure Docker Desktop is running (check system tray)
- Try: `docker ps` to verify Docker is working
- Restart Docker Desktop if needed

### Problem: Port 3000 already in use
**Solution:**
- Stop your Next.js dev server temporarily
- Or use a different port for WAHA:
  ```bash
  docker run -it --rm -p 3001:3000 --name waha devlikeapro/waha
  ```
- Then update `.env.local`: `WHATSAPP_API_URL=http://localhost:3001/api`

### Problem: QR code not showing
**Solution:**
- Check browser console for errors
- Verify WAHA is running: visit http://localhost:3000
- Check that `WHATSAPP_API_URL` in `.env.local` is correct
- Restart Next.js dev server after changing `.env.local`

### Problem: "Failed to connect to WAHA service"
**Solution:**
- Make sure WAHA Docker container is running
- Check: `docker ps` should show the `waha` container
- Verify the URL in `.env.local` matches your WAHA port
- Try accessing http://localhost:3000/api/sessions directly in browser

### Problem: WhatsApp connection keeps disconnecting
**Solution:**
- Keep the Docker container running (don't close the terminal)
- Don't close WhatsApp on your phone
- If disconnected, just scan the QR code again

### Problem: "Phone number is missing"
**Solution:**
- Make sure the invoice or tenant has a phone number in the database
- Check the invoice/tenant edit form to add phone numbers
- Phone number format: Can be any format (e.g., +1 555-123-4567) - the system will format it automatically

## Running WAHA in Background (Optional)

If you want to run WAHA in the background without keeping a terminal open:

### On Windows (PowerShell):
```powershell
Start-Process docker -ArgumentList "run -it --rm -p 3000:3000 --name waha devlikeapro/waha"
```

### On Mac/Linux:
```bash
docker run -d --rm -p 3000:3000 --name waha devlikeapro/waha
```

To stop it later:
```bash
docker stop waha
```

## Production Deployment (Already Configured)

### Railway Deployment (Current Setup)
Your WAHA service is already deployed on Railway:
- **URL:** https://waha-production-0727.up.railway.app
- **API URL:** https://waha-production-0727.up.railway.app/api
- **Dashboard:** https://waha-production-0727.up.railway.app
- **Username:** `admin`
- **Password:** `833187f430e3464ead17032f10e62406`

### Vercel Environment Variables (Already Set)
All WhatsApp environment variables are configured in your Vercel project:
- `WHATSAPP_API_URL` = `https://waha-production-0727.up.railway.app/api`
- `WHATSAPP_API_KEY` = `acc25055b75b4c938c565e694a201f38`
- `WHATSAPP_SESSION` = `default`

**All set for Production, Preview, and Development environments!**

### For Local Development
If you want to run WAHA locally instead:
- Install Docker Desktop
- Run: `docker run -it --rm -p 3000:3000 --name waha devlikeapro/waha`
- Use: `WHATSAPP_API_URL=http://localhost:3000/api` in `.env.local`

## Important Notes

1. **WAHA must stay running** - If you stop the Docker container, WhatsApp will disconnect
2. **One WhatsApp account per WAHA instance** - Each WAHA instance can only connect to one WhatsApp account
3. **Free and Open Source** - WAHA is completely free, no API costs
4. **Local = Private** - Running locally means your data stays on your machine
5. **No WhatsApp Business API needed** - WAHA works with regular WhatsApp accounts

## Quick Start Checklist

- [ ] Docker Desktop installed and running
- [ ] WAHA container running: `docker run -it --rm -p 3000:3000 --name waha devlikeapro/waha`
- [ ] WAHA dashboard accessible: http://localhost:3000
- [ ] `.env.local` updated with `WHATSAPP_API_URL=http://localhost:3000/api`
- [ ] Next.js dev server restarted
- [ ] Navigated to Settings → Configure WhatsApp
- [ ] Scanned QR code with WhatsApp mobile app
- [ ] Status shows "Connected"
- [ ] Tested sending an invoice via WhatsApp

## Support

If you encounter issues:
1. Check WAHA logs in the Docker terminal
2. Check browser console for errors
3. Verify all environment variables are set correctly
4. Ensure Docker container is running: `docker ps`
5. Check WAHA documentation: https://waha.devlike.pro/

---

**All steps above are 100% free** - No payment required, no API keys to purchase, no subscriptions needed.

