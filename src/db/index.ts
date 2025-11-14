import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/db/schema-postgres';

// Get Supabase connection string from environment
const connectionString = process.env.SUPABASE_DATABASE_URL!;

if (!connectionString) {
  throw new Error('SUPABASE_DATABASE_URL environment variable is not set');
}

// Create the connection
const client = postgres(connectionString, {
  max: 1, // Connection pool size
  onnotice: () => {}, // Suppress notices
  transform: {
    undefined: null, // Transform undefined to null for PostgreSQL
  },
});

export const db = drizzle(client, { schema });

export type Database = typeof db;
