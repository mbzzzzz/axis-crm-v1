"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function ensureEnv() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL and anon key must be defined in environment variables.");
  }
}

export function getSupabaseBrowserClient() {
  ensureEnv();

  if (!browserClient) {
    // createBrowserClient from @supabase/ssr automatically handles cookie persistence
    // It uses localStorage and cookies to persist sessions
    browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }

  return browserClient;
}

