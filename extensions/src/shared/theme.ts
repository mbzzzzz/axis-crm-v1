import type { ExtensionTheme } from "./types";

export function createThemeCSS(theme: ExtensionTheme | null) {
  if (!theme) {
    return `:root { --axis-surface: #050505; --axis-text: #f8fafc; --axis-accent: #6366f1; --axis-muted: rgba(148, 163, 184, 0.6); --axis-border: rgba(99, 102, 241, 0.4); }`;
  }

  const { surface, text, accent, muted, border } = theme.data;
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

