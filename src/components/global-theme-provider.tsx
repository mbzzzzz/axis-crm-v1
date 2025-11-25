"use client";

import { useSession } from "@/lib/auth-client";
import { CardThemeProvider } from "./card-theme-provider";

/**
 * Global theme provider wrapper that works in root layout
 * Gets userId from Supabase session and provides theme context to entire app
 */
export function GlobalThemeProvider({ children }: { children: React.ReactNode }) {
  const { data, isPending } = useSession();

  // Always provide CardThemeProvider, even if user is not loaded yet
  // This prevents errors when components try to use useCardTheme hook
  const userId = data?.user?.id || "";

  return <CardThemeProvider userId={userId}>{children}</CardThemeProvider>;
}

