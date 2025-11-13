export type CardTheme = {
  key: CardThemeKey;
  name: string;
  description: string;
  surface: string;
  border: string;
  text: string;
  muted: string;
  accent: string;
  glowRgb: string;
};

export const CARD_THEMES = {
  aurora: {
    key: "aurora",
    name: "Aurora Purple",
    description: "Vibrant purple glow with deep space background",
    surface: "linear-gradient(135deg, rgba(38, 8, 70, 0.95), rgba(12, 3, 28, 0.92))",
    border: "rgba(168, 85, 247, 0.45)",
    text: "rgba(248, 250, 255, 0.95)",
    muted: "rgba(226, 232, 255, 0.6)",
    accent: "#a855f7",
    glowRgb: "132, 0, 255",
  },
  nebula: {
    key: "nebula",
    name: "Nebula Teal",
    description: "Cosmic teal gradients inspired by auroras",
    surface: "linear-gradient(135deg, rgba(8, 54, 62, 0.96), rgba(6, 25, 32, 0.92))",
    border: "rgba(45, 212, 191, 0.45)",
    text: "rgba(240, 253, 250, 0.97)",
    muted: "rgba(190, 242, 234, 0.7)",
    accent: "#22d3ee",
    glowRgb: "34, 211, 238",
  },
  ember: {
    key: "ember",
    name: "Ember Sunset",
    description: "Warm amber and crimson hues for energetic dashboards",
    surface: "linear-gradient(135deg, rgba(82, 27, 14, 0.95), rgba(37, 8, 4, 0.92))",
    border: "rgba(248, 113, 113, 0.45)",
    text: "rgba(255, 247, 237, 0.95)",
    muted: "rgba(254, 226, 226, 0.72)",
    accent: "#f97316",
    glowRgb: "244, 114, 182",
  },
  lagoon: {
    key: "lagoon",
    name: "Lagoon Blue",
    description: "Deep ocean blues with electric highlights",
    surface: "linear-gradient(135deg, rgba(9, 16, 63, 0.95), rgba(4, 13, 33, 0.9))",
    border: "rgba(99, 102, 241, 0.45)",
    text: "rgba(235, 242, 255, 0.95)",
    muted: "rgba(191, 219, 254, 0.7)",
    accent: "#60a5fa",
    glowRgb: "59, 130, 246",
  },
  meadow: {
    key: "meadow",
    name: "Meadow Green",
    description: "Fresh green tones with subtle lime glows",
    surface: "linear-gradient(135deg, rgba(9, 50, 34, 0.95), rgba(3, 23, 14, 0.92))",
    border: "rgba(74, 222, 128, 0.4)",
    text: "rgba(236, 253, 245, 0.95)",
    muted: "rgba(187, 247, 208, 0.7)",
    accent: "#4ade80",
    glowRgb: "74, 222, 128",
  },
  solar: {
    key: "solar",
    name: "Solar Gold",
    description: "Rich golden glow with noir contrast",
    surface: "linear-gradient(135deg, rgba(71, 53, 8, 0.95), rgba(26, 19, 2, 0.9))",
    border: "rgba(250, 204, 21, 0.45)",
    text: "rgba(255, 251, 235, 0.95)",
    muted: "rgba(254, 240, 199, 0.7)",
    accent: "#facc15",
    glowRgb: "251, 191, 36",
  },
  magma: {
    key: "magma",
    name: "Magma Red",
    description: "Intense crimson paired with volcanic shadows",
    surface: "linear-gradient(135deg, rgba(64, 6, 18, 0.95), rgba(21, 2, 8, 0.92))",
    border: "rgba(248, 113, 113, 0.45)",
    text: "rgba(255, 241, 242, 0.95)",
    muted: "rgba(254, 205, 211, 0.7)",
    accent: "#f87171",
    glowRgb: "248, 113, 113",
  },
  midnight: {
    key: "midnight",
    name: "Midnight Indigo",
    description: "Elegant midnight blue with subtle indigo glow",
    surface: "linear-gradient(135deg, rgba(20, 24, 62, 0.95), rgba(7, 10, 26, 0.92))",
    border: "rgba(129, 140, 248, 0.45)",
    text: "rgba(229, 231, 235, 0.95)",
    muted: "rgba(199, 210, 254, 0.72)",
    accent: "#818cf8",
    glowRgb: "129, 140, 248",
  },
  cyber: {
    key: "cyber",
    name: "Cyber Cyan",
    description: "Neon cyan glow with futuristic undertones",
    surface: "linear-gradient(135deg, rgba(6, 46, 55, 0.95), rgba(2, 18, 24, 0.92))",
    border: "rgba(34, 211, 238, 0.45)",
    text: "rgba(224, 247, 250, 0.95)",
    muted: "rgba(165, 243, 252, 0.72)",
    accent: "#06b6d4",
    glowRgb: "6, 182, 212",
  },
} satisfies Record<string, CardTheme>;

export type CardThemeKey = keyof typeof CARD_THEMES;

export const DEFAULT_CARD_THEME_KEY: CardThemeKey = "aurora";

export const CARD_THEME_OPTIONS: CardTheme[] = Object.values(CARD_THEMES);

export function getCardTheme(key?: string): CardTheme {
  if (!key) return CARD_THEMES[DEFAULT_CARD_THEME_KEY];
  return CARD_THEMES[key as CardThemeKey] ?? CARD_THEMES[DEFAULT_CARD_THEME_KEY];
}


