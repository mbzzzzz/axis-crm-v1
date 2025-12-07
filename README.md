# AXIS CRM - Real Estate Management Platform

A comprehensive CRM system for real estate agents and property managers, built with Next.js 15, Supabase Auth, and Supabase Postgres.

## 🚀 Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth (Google & GitHub OAuth)
- **ORM:** Drizzle ORM
- **UI:** Radix UI + Tailwind CSS
- **Charts:** Recharts

## 📋 Features

- ✅ Property Management
- ✅ AI-Powered Property Description Generation (using Groq's low-token model)
- ✅ Tenant Management
- ✅ Invoice Generation & Tracking
- ✅ WhatsApp Integration (send invoices via WhatsApp)
- ✅ Maintenance Request Tracking
- ✅ Financial Dashboard
- ✅ Reports & Analytics
- ✅ PDF Export
- ✅ Data Import/Export

## 🛠️ Setup

1. **Clone the repository**
2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   - Copy `env.template` to `.env.local`: `cp env.template .env.local`
   - Or create `.env.local` file with the following variables:
   ```env
   # Supabase Auth + Database
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_DATABASE_URL=postgres_connection_string
   SUPABASE_SERVICE_ROLE_KEY=service_role_key_for_storage

   # Authentication (OAuth redirect target)
   NEXT_PUBLIC_APP_URL=https://your-domain.com

   # Email (Resend)
   RESEND_API_KEY=your_resend_api_key
   RESEND_FROM_EMAIL="Axis CRM <noreply@axis.crm>"

   # Groq API (for AI-powered property description generation via Composio MCP)
   GROQ_API_KEY=your_groq_api_key

   ```
   - Get your Groq API key from [https://console.groq.com](https://console.groq.com)
   - For WhatsApp integration, see [WHATSAPP-SETUP.md](./WHATSAPP-SETUP.md) - Users connect their own WhatsApp Business accounts

4. **Run the development server:**
   ```bash
   npm run dev
   ```

## 📚 Documentation

- [Supabase Setup Guide](./SUPABASE-SETUP.md) - Complete Supabase project setup
- [Migration Guide](./MIGRATION-GUIDE.md) - Historical better-auth to Clerk notes (Supabase Auth now default)
- [MCP Setup Guide](./MCP-SETUP.md) - Composio MCP server configuration
- [Vercel Deployment Guide](./VERCEL-DEPLOYMENT.md) - Environment variables and deployment instructions
- [WhatsApp Integration Guide](./WHATSAPP-SETUP.md) - WhatsApp Cloud API setup (official Meta API)

## 🔧 MCP Server Configuration

This project uses Composio MCP server. See [MCP-SETUP.md](./MCP-SETUP.md) for configuration instructions.

**MCP Server URL:**
```
https://backend.composio.dev/v3/mcp/2492640b-3c5f-4210-8298-976c3bda7609/mcp?user_id=pg-test-f636d421-1ec8-4dc7-947a-578ffec9361e
```

## 📖 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team)

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
