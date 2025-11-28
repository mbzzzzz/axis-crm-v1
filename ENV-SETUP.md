# Environment Variables Setup Guide

## Quick Setup

### Step 1: Create `.env.local` file

1. Copy the template file:
   ```bash
   cp env.template .env.local
   ```

2. Or manually create `.env.local` in your project root

### Step 2: Fill in your values

Open `.env.local` and update the placeholder values with your actual credentials.

### Step 3: WhatsApp Variables (Already Configured)

Your WhatsApp credentials are already filled in:

```env
WHATSAPP_API_URL=https://waha-production-0727.up.railway.app/api
WHATSAPP_API_KEY=acc25055b75b4c938c565e694a201f38
WHATSAPP_SESSION=default
```

**You don't need to change these** - they're ready to use!

### Step 4: Add Other Required Variables

Fill in these with your actual values:

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
- `SUPABASE_DATABASE_URL` - Your PostgreSQL connection string
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
- `RESEND_API_KEY` - Your Resend API key (for emails)
- `GROQ_API_KEY` - Your Groq API key (for AI features)

### Step 5: Restart Your Dev Server

After creating/updating `.env.local`:

```bash
npm run dev
```

## WhatsApp Credentials Reference

### API Credentials (for Next.js app)
- **API URL:** `https://waha-production-0727.up.railway.app/api`
- **API Key:** `acc25055b75b4c938c565e694a201f38`
- **Session:** `default`

### Dashboard Access (for direct WAHA management)
- **Dashboard URL:** https://waha-production-0727.up.railway.app
- **Username:** `admin`
- **Password:** `833187f430e3464ead17032f10e62406`

### Swagger API Docs
- **URL:** https://waha-production-0727.up.railway.app/api-docs
- **Username:** `admin`
- **Password:** `833187f430e3464ead17032f10e62406`

## For Vercel Production

Add these same variables in Vercel Dashboard:
1. Go to Project → Settings → Environment Variables
2. Add all three WhatsApp variables
3. Redeploy your application

See [VERCEL-WHATSAPP-ENV.md](./VERCEL-WHATSAPP-ENV.md) for detailed Vercel setup.

## Security Notes

- ✅ `.env.local` is in `.gitignore` - your secrets are safe
- ✅ Never commit `.env.local` to git
- ✅ Use `env.template` as a reference (safe to commit)
- ✅ Keep your API keys secure

