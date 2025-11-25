"use client";

import { useSession } from "@/lib/auth-client";
import { CardThemeProvider } from "./card-theme-provider";

/**
 * Global theme provider wrapper that works in root layout
 * Gets userId from Supabase session and provides theme context to entire app
 */
export function GlobalThemeProvider({ children }: { children: React.ReactNode }) {
  const { data, isPending } = useSession();

  if (isPending || !data?.user?.id) {
    return <>{children}</>;
  }

  return <CardThemeProvider userId={data.user.id}>{children}</CardThemeProvider>;
}

