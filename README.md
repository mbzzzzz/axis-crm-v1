# AXIS CRM - Real Estate Management Platform

A comprehensive CRM system for real estate agents and property managers, built with Next.js 15, Clerk authentication, and Supabase.

## 🚀 Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Clerk
- **ORM:** Drizzle ORM
- **UI:** Radix UI + Tailwind CSS
- **Charts:** Recharts

## 📋 Features

- ✅ Property Management
- ✅ Tenant Management
- ✅ Invoice Generation & Tracking
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
   - Copy `.env.local.example` to `.env.local`
   - Add your Clerk and Supabase credentials

4. **Run the development server:**
   ```bash
   npm run dev
   ```

## 📚 Documentation

- [Supabase Setup Guide](./SUPABASE-SETUP.md) - Complete Supabase project setup
- [Migration Guide](./MIGRATION-GUIDE.md) - Migration from better-auth to Clerk
- [MCP Setup Guide](./MCP-SETUP.md) - Composio MCP server configuration

## 🔧 MCP Server Configuration

This project uses Composio MCP server. See [MCP-SETUP.md](./MCP-SETUP.md) for configuration instructions.

**MCP Server URL:**
```
https://backend.composio.dev/v3/mcp/2492640b-3c5f-4210-8298-976c3bda7609/mcp?user_id=pg-test-f636d421-1ec8-4dc7-947a-578ffec9361e
```

## 📖 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Clerk Documentation](https://clerk.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team)

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
