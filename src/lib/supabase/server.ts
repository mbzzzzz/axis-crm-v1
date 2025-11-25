import { cookies } from "next/headers";
import { createServerActionClient, createServerComponentClient, createRouteHandlerClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function ensureEnv() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL and anon key must be defined in environment variables.");
  }
}

export function getSupabaseServerComponentClient() {
  ensureEnv();
  return createServerComponentClient(
    { cookies },
    {
      supabaseUrl,
      supabaseKey: supabaseAnonKey,
    }
  );
}

export function getSupabaseServerActionClient() {
  ensureEnv();
  return createServerActionClient(
    { cookies },
    {
      supabaseUrl,
      supabaseKey: supabaseAnonKey,
    }
  );
}

export function getSupabaseRouteHandlerClient() {
  ensureEnv();
  return createRouteHandlerClient(
    { cookies },
    {
      supabaseUrl,
      supabaseKey: supabaseAnonKey,
    }
  );

