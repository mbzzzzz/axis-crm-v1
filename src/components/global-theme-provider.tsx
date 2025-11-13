"use client";

import { useUser } from "@clerk/nextjs";
import { CardThemeProvider } from "./card-theme-provider";

/**
 * Global theme provider wrapper that works in root layout
 * Gets userId from Clerk and provides theme context to entire app
 */
export function GlobalThemeProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();

  // Don't render theme provider until user is loaded
  // This prevents hydration mismatches
  if (!isLoaded) {
    return <>{children}</>;
  }

  // If user is not authenticated, render children without theme provider
  // Theme will use default values
  if (!user) {
    return <>{children}</>;
  }

  return <CardThemeProvider userId={user.id}>{children}</CardThemeProvider>;
}

