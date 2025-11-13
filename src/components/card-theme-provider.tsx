"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { CARD_THEME_OPTIONS, CardTheme, CardThemeKey, DEFAULT_CARD_THEME_KEY, getCardTheme } from "@/lib/card-themes";
import { toast } from "sonner";

type CardThemeContextValue = {
  themeKey: CardThemeKey;
  theme: CardTheme;
  isLoading: boolean;
  isSaving: boolean;
  setTheme: (key: CardThemeKey) => Promise<void>;
  options: CardTheme[];
};

const CardThemeContext = createContext<CardThemeContextValue | undefined>(undefined);

interface CardThemeProviderProps {
  userId: string;
  children: React.ReactNode;
}

export function CardThemeProvider({ userId, children }: CardThemeProviderProps) {
  const [themeKey, setThemeKey] = useState<CardThemeKey>(DEFAULT_CARD_THEME_KEY);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const syncCssVariables = useCallback((nextTheme: CardTheme) => {
    const root = document.documentElement;
    root.style.setProperty("--card-theme-surface", nextTheme.surface);
    root.style.setProperty("--card-theme-border", nextTheme.border);
    root.style.setProperty("--card-theme-text", nextTheme.text);
    root.style.setProperty("--card-theme-muted", nextTheme.muted);
    root.style.setProperty("--card-theme-accent", nextTheme.accent);
    root.style.setProperty("--card-theme-glow-rgb", nextTheme.glowRgb);
  }, []);

  useEffect(() => {
    // Apply default theme immediately to prevent flash
    syncCssVariables(getCardTheme(DEFAULT_CARD_THEME_KEY));

    if (!userId) {
      setIsLoading(false);
      return;
    }

    let ignore = false;

    const loadTheme = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/preferences/theme");

        if (!response.ok) {
          throw new Error(`Failed to load theme: ${response.status}`);
        }

        const data = await response.json();
        if (!ignore && data?.themeKey) {
          setThemeKey(data.themeKey as CardThemeKey);
          syncCssVariables(getCardTheme(data.themeKey));
        } else if (!ignore) {
          // Keep default theme if no preference found
          setThemeKey(DEFAULT_CARD_THEME_KEY);
        }
      } catch (error) {
        console.error("Failed to load theme preference:", error);
        if (!ignore) {
          // Keep default theme on error
          setThemeKey(DEFAULT_CARD_THEME_KEY);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    loadTheme();

    return () => {
      ignore = true;
    };
  }, [userId, syncCssVariables]);

  useEffect(() => {
    syncCssVariables(getCardTheme(themeKey));
  }, [themeKey, syncCssVariables]);

  const setTheme = useCallback(
    async (key: CardThemeKey) => {
      const previousKey = themeKey;

      setThemeKey(key);
      syncCssVariables(getCardTheme(key));

      if (!userId) return;

      setIsSaving(true);
      try {
        const response = await fetch("/api/preferences/theme", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ themeKey: key }),
        });

        if (!response.ok) {
          throw new Error("Failed to save theme preference");
        }

        toast.success("Dashboard theme updated");
      } catch (error) {
        console.error(error);
        toast.error("Unable to update theme");
        setThemeKey(previousKey);
        syncCssVariables(getCardTheme(previousKey));
      } finally {
        setIsSaving(false);
      }
    },
    [userId, syncCssVariables, themeKey]
  );

  const value = useMemo<CardThemeContextValue>(
    () => ({
      themeKey,
      theme: getCardTheme(themeKey),
      isLoading,
      isSaving,
      setTheme,
      options: CARD_THEME_OPTIONS,
    }),
    [themeKey, isLoading, isSaving, setTheme]
  );

  return <CardThemeContext.Provider value={value}>{children}</CardThemeContext.Provider>;
}

export function useCardTheme() {
  const context = useContext(CardThemeContext);
  if (!context) {
    throw new Error("useCardTheme must be used within a CardThemeProvider");
  }
  return context;
}


