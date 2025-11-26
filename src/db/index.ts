import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/db/schema-postgres';

// Get Supabase connection string from environment
const connectionString = process.env.SUPABASE_DATABASE_URL;

if (!connectionString) {
  // Don't crash the build if the env var is missing – database features will
  // simply throw at runtime when used. Make sure SUPABASE_DATABASE_URL is
  // configured in your local and Vercel environments.
  console.warn('SUPABASE_DATABASE_URL environment variable is not set. Database access will fail at runtime.');
}

// Create the connection only when we have a connection string
const client = connectionString
  ? postgres(connectionString, {
      max: 1, // Connection pool size
      onnotice: () => {}, // Suppress notices
      transform: {
        undefined: null, // Transform undefined to null for PostgreSQL
      },
    })
  : null;

export const db = connectionString
  ? drizzle(client as unknown as postgres.Sql, { schema })
  : ({} as any);

export type Database = typeof db;
