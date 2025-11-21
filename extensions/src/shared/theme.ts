import type { ExtensionTheme } from "./types";

export function createThemeCSS(theme: ExtensionTheme | null) {
  if (!theme || !theme.data) {
    return `:root { --axis-surface: #050505; --axis-text: #f8fafc; --axis-accent: #6366f1; --axis-muted: rgba(148, 163, 184, 0.6); --axis-border: rgba(99, 102, 241, 0.4); }`;
  }

  const {
    surface = "#050505",
    text = "#f8fafc",
    accent = "#6366f1",
    muted = "rgba(148, 163, 184, 0.6)",
    border = "rgba(99, 102, 241, 0.4)",
  } = theme.data;

  return `
    :root {
      --axis-surface: ${surface};
      --axis-text: ${text};
      --axis-accent: ${accent};
      --axis-muted: ${muted};
      --axis-border: ${border};
    }
  `;
}

