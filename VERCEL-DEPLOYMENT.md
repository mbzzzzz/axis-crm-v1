# Vercel Deployment Guide

## Environment Variables Setup

To deploy your AXIS CRM project to Vercel with AI-powered property description generation, you need to configure the following environment variables:

### Required Environment Variables

1. **Navigate to Vercel Dashboard:**
   - Go to your project: [Vercel Dashboard](https://vercel.com/dashboard)
   - Select your project
   - Go to **Settings** → **Environment Variables**

2. **Add the following variables:**

   ```env
   # Clerk Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   
   # Supabase Database
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_DATABASE_URL=your_supabase_database_url
   
   # Groq API (for AI-powered property description generation)
   GROQ_API_KEY=your_groq_api_key_here
   ```

### Step-by-Step Instructions

1. **Open Vercel Project Settings:**
   - Log in to [Vercel](https://vercel.com)
   - Select your AXIS CRM project
   - Click on **Settings** in the top navigation

2. **Add Environment Variables:**
   - Click on **Environment Variables** in the left sidebar
   - Click **Add New** button
   - For each variable:
     - Enter the **Name** (e.g., `GROQ_API_KEY`)
     - Enter the **Value** (your Groq API key - contact your administrator for the actual key)
     - Select **Environment(s)**: 
       - ✅ Production
       - ✅ Preview
       - ✅ Development
     - Click **Save**

3. **Redeploy After Adding Variables:**
   - After adding environment variables, you need to redeploy
   - Go to **Deployments** tab
   - Click the **⋯** (three dots) menu on the latest deployment
   - Select **Redeploy**
   - Or push a new commit to trigger automatic deployment

### Groq API Key Configuration

The Groq API key is used for AI-powered property description generation:
- **Key Name:** `GROQ_API_KEY`
- **Key Value:** Contact your administrator or get your key from [Groq Console](https://console.groq.com)
- **Purpose:** Powers the "Auto Generate" description feature in property listings
- **Model Used:** `llama-3.1-8b-instant` (low-token, cost-efficient model)

### Verification

After deployment, verify the environment variables are working:

1. **Check Deployment Logs:**
   - Go to **Deployments** → Select latest deployment → **Build Logs**
   - Ensure no errors related to missing environment variables

2. **Test the Feature:**
   - Navigate to your deployed app
   - Go to Properties → Add New Property
   - Fill in required fields (title, address, city, state, property type, price)
   - Click **✨ Auto Generate** button next to Description field
   - Verify that a description is generated successfully

### Troubleshooting

**Issue: "Groq API key is not configured" error**
- **Solution:** Verify `GROQ_API_KEY` is set in Vercel environment variables
- Ensure the variable is available for the correct environment (Production/Preview/Development)
- Redeploy after adding the variable

**Issue: Description generation fails**
- **Solution:** Check Vercel function logs in the deployment dashboard
- Verify the API key is correct and has not expired
- Ensure all required property fields are filled before generating

**Issue: Environment variables not updating**
- **Solution:** Redeploy the application after adding/updating environment variables
- Clear Vercel build cache if needed

### Security Notes

- ✅ Never commit API keys to Git
- ✅ Use Vercel's environment variables for all sensitive data
- ✅ Rotate API keys periodically
- ✅ Use different keys for development and production if needed

---

**Last Updated:** 2025-01-XX
**Status:** ✅ Ready for Deployment

