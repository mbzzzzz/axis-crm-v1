import browser from "webextension-polyfill";
import type { AxisPropertyRecord, ExtensionSettings, ExtensionTheme } from "./types";

const STORAGE_KEYS = {
  PROPERTIES: "axis:properties",
  THEME: "axis:theme",
  SETTINGS: "axis:settings",
  SELECTED: "axis:selected",
  EXTENSION_TOKEN: "axis:extension_token", // API token for authentication
} as const;

export async function saveProperties(properties: AxisPropertyRecord[]) {
  await browser.storage.local.set({ [STORAGE_KEYS.PROPERTIES]: properties });
}

export async function getProperties(): Promise<AxisPropertyRecord[]> {
  const data = await browser.storage.local.get(STORAGE_KEYS.PROPERTIES);
  return (data[STORAGE_KEYS.PROPERTIES] as AxisPropertyRecord[]) ?? [];
}

export async function saveTheme(theme: ExtensionTheme | null) {
  await browser.storage.local.set({ [STORAGE_KEYS.THEME]: theme });
}

export async function getTheme(): Promise<ExtensionTheme | null> {
  const data = await browser.storage.local.get(STORAGE_KEYS.THEME);
  return (data[STORAGE_KEYS.THEME] as ExtensionTheme) ?? null;
}

export async function saveSettings(settings: ExtensionSettings) {
  await browser.storage.local.set({ [STORAGE_KEYS.SETTINGS]: settings });
}

export async function getSettings(): Promise<ExtensionSettings> {
  const data = await browser.storage.local.get(STORAGE_KEYS.SETTINGS);
  const defaultSettings: ExtensionSettings = {
    apiBaseUrl: "https://axis-crm-v1.vercel.app",
  };
  
  // If no settings exist, save and return defaults
  if (!data[STORAGE_KEYS.SETTINGS]) {
    await saveSettings(defaultSettings);
    return defaultSettings;
  }
  
  return data[STORAGE_KEYS.SETTINGS] as ExtensionSettings;
}

export async function saveSelectedProperty(propertyId: number | null) {
  await browser.storage.local.set({ [STORAGE_KEYS.SELECTED]: propertyId });
}

export async function getSelectedProperty(): Promise<number | null> {
  const data = await browser.storage.local.get(STORAGE_KEYS.SELECTED);
  return (data[STORAGE_KEYS.SELECTED] as number | null) ?? null;
}

export async function saveExtensionToken(token: string | null) {
  if (token) {
    await browser.storage.local.set({ [STORAGE_KEYS.EXTENSION_TOKEN]: token });
  } else {
    await browser.storage.local.remove(STORAGE_KEYS.EXTENSION_TOKEN);
  }
}

export async function getExtensionToken(): Promise<string | null> {
  const data = await browser.storage.local.get(STORAGE_KEYS.EXTENSION_TOKEN);
  return (data[STORAGE_KEYS.EXTENSION_TOKEN] as string | null) ?? null;
}

