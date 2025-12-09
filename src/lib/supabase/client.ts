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

/**
 * Clear all Supabase-related cookies and localStorage
 * Used when switching accounts or signing out
 */
export function clearSupabaseSession() {
  if (typeof window === "undefined") return;
  
  // Clear all Supabase cookies
  const cookies = document.cookie.split(";");
  cookies.forEach((cookie) => {
    const eqPos = cookie.indexOf("=");
    const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
    
    // Clear Supabase auth cookies
    if (name.includes("supabase") || name.includes("auth") || name.startsWith("sb-")) {
      // Clear cookie for current domain
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      // Clear cookie for parent domain (if any)
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
    }
  });
  
  // Clear localStorage items that might interfere
  try {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.includes("supabase") || key.includes("auth")) {
        localStorage.removeItem(key);
      }
    });
  } catch (e) {
    console.warn("Error clearing localStorage:", e);
  }
}

export function getSupabaseBrowserClient() {
  ensureEnv();

  if (!browserClient) {
    // createBrowserClient from @supabase/ssr automatically handles cookie persistence
    // It uses localStorage and cookies to persist sessions with proper configuration
    // The default implementation already handles cookie persistence correctly
    browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }

  return browserClient;
}

