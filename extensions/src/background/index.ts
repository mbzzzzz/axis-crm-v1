import browser from "webextension-polyfill";
import {
  getProperties,
  getSelectedProperty,
  getSettings,
  getTheme,
  saveProperties,
  saveSelectedProperty,
  saveSettings,
  saveTheme,
} from "@axis/shared/storage";
import type {
  AxisPropertyRecord,
  ExtensionState,
  ExtensionTheme,
  RuntimeMessage,
  RuntimeMessageResponse,
  SyncStatus,
} from "@axis/shared/types";
import { fetchProperties, fetchTheme } from "@axis/shared/api-client";

let state: ExtensionState | null = null;

async function bootstrapState() {
  const [properties, theme, settings, selectedPropertyId] = await Promise.all([
    getProperties(),
    getTheme(),
    getSettings(),
    getSelectedProperty(),
  ]);

  state = {
    properties,
    theme,
    selectedPropertyId,
    settings,
    status: "idle",
  };
}

async function ensureState() {
  if (!state) {
    await bootstrapState();
  }
  return state!;
}

async function setStatus(status: SyncStatus, error?: string) {
  const current = await ensureState();
  state = { ...current, status, error };
}

async function persistState(partial: Partial<ExtensionState>) {
  const current = await ensureState();
  state = { ...current, ...partial };
}

async function syncFromAxis(): Promise<RuntimeMessageResponse> {
  const current = await ensureState();
  await setStatus("loading");
  try {
    const [theme, properties] = await Promise.all([
      fetchTheme(current.settings.apiBaseUrl).catch((err) => {
        console.warn("Theme fetch failed:", err);
        return null;
      }),
      fetchProperties(current.settings.apiBaseUrl),
    ]);

    if (theme) {
      await saveTheme(theme);
    }
    await saveProperties(properties);
    
    await persistState({
      theme: theme || current.theme,
      properties,
      status: "success",
      error: undefined,
      settings: { ...current.settings, lastSyncAt: new Date().toISOString() },
    });
    await saveSettings(state!.settings);
    return { ok: true, type: "MESSAGE" as const, message: "Synced successfully" };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await setStatus("error", errorMessage);
    
    let userMessage = errorMessage;
    if (errorMessage.includes("Not signed in")) {
      userMessage = "Not signed in. Please log into AXIS CRM dashboard, then try syncing again.";
    } else if (errorMessage.includes("Failed to fetch") || errorMessage.includes("NetworkError")) {
      userMessage = "Network error. Check your internet connection and AXIS CRM URL.";
    }
    
    return { ok: false, type: "ERROR" as const, error: userMessage };
  }
}

async function setSelected(propertyId: number | null): Promise<RuntimeMessageResponse> {
  const current = await ensureState();
  const exists =
    propertyId === null ||
    current.properties.some((property: AxisPropertyRecord) => property.id === propertyId);

  if (!exists) {
    return { ok: false, type: "ERROR" as const, error: "Property not found" };
  }

  await saveSelectedProperty(propertyId);
  await persistState({ selectedPropertyId: propertyId });
  return { ok: true, type: "MESSAGE" as const, message: "Selected property updated" };
}

async function autofillActiveTab(): Promise<RuntimeMessageResponse> {
  const current = await ensureState();
  const property =
    current.properties.find((prop) => prop.id === current.selectedPropertyId) ??
    current.properties[0];

  if (!property) {
    return { ok: false, type: "ERROR" as const, error: "No property selected. Please sync and select a property first." };
  }

  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    return { ok: false, type: "ERROR" as const, error: "Unable to find active tab" };
  }

  if (!tab.url || (!tab.url.includes("zillow.com") && !tab.url.includes("zameen.com") && !tab.url.includes("realtor.com"))) {
    return {
      ok: false,
      type: "ERROR" as const,
      error: "Unsupported site. Please navigate to Zillow, Zameen, or Realtor listing page.",
    };
  }

  try {
    await ensureContentScript(tab.id);
    
    try {
      const response = await browser.tabs.sendMessage(tab.id, {
        type: "AXIS_AUTOFILL",
        payload: {
          property,
          theme: current.theme,
        },
      });

      if (response?.success === false) {
        return {
          ok: false,
          type: "ERROR" as const,
          error: response.error || "Autofill failed on the page",
        };
      }
    } catch (msgError: any) {
      if (msgError?.message?.includes("Receiving end does not exist") || msgError?.message?.includes("Could not establish connection")) {
        return {
          ok: false,
          type: "ERROR" as const,
          error: "Content script not ready. Please refresh the page and try again.",
        };
      }
      throw msgError;
    }
  } catch (error) {
    return {
      ok: false,
      type: "ERROR" as const,
      error:
        error instanceof Error
          ? error.message
          : "Failed to communicate with the current page. Try refreshing the page.",
    };
  }

  return { ok: true, type: "MESSAGE" as const, message: "Autofill triggered successfully" };
}

async function ensureContentScript(tabId: number): Promise<void> {
  try {
    const tab = await browser.tabs.get(tabId);
    if (!tab.url || (!tab.url.startsWith("http://") && !tab.url.startsWith("https://"))) {
      throw new Error("Cannot inject into this page type");
    }

    if ((browser as any).scripting?.executeScript) {
      try {
        await (browser as any).scripting.executeScript({
          target: { tabId },
          files: ["content/content.js"],
        });
      } catch (injectError: any) {
        if (injectError?.message?.includes("Cannot access")) {
          throw new Error("Page blocked content script injection. Try refreshing the page.");
        }
        throw injectError;
      }
    } else if ((browser.tabs as any).executeScript) {
      await (browser.tabs as any).executeScript(tabId, {
        file: "content/content.js",
        runAt: "document_idle",
      });
    }

    await waitForContentScriptReady(tabId);
  } catch (error) {
    console.error("Failed to inject content script", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Content script injection failed: ${errorMessage}`);
  }
}

async function waitForContentScriptReady(tabId: number, maxRetries = 10): Promise<void> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await browser.tabs.sendMessage(tabId, { type: "AXIS_PING" });
      if (response?.ready) {
        return;
      }
    } catch (error) {
      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        continue;
      }
      throw new Error("Content script did not respond. The page may need to be refreshed.");
    }
  }
  throw new Error("Content script timeout. Please refresh the page and try again.");
}

browser.runtime.onInstalled.addListener(async () => {
  try {
    await bootstrapState();
  } catch (error) {
    console.error("Failed to bootstrap state on install:", error);
  }
});

browser.runtime.onStartup.addListener(async () => {
  try {
    await bootstrapState();
  } catch (error) {
    console.error("Failed to bootstrap state on startup:", error);
  }
});

browser.runtime.onMessage.addListener((message: RuntimeMessage): Promise<RuntimeMessageResponse> => {
  switch (message.type) {
    case "GET_STATE":
      return ensureState().then((state) => ({ ok: true, type: "STATE" as const, state }));
    case "SYNC_DATA":
      return syncFromAxis();
    case "SET_SELECTED_PROPERTY":
      return setSelected(message.payload);
    case "GET_SELECTED_PROPERTY":
      return ensureState().then((state) => ({
        ok: true,
        type: "PROPERTY" as const,
        property:
          state.properties.find((prop) => prop.id === state.selectedPropertyId) ?? null,
        theme: state.theme,
      }));
    case "AUTOFILL_ACTIVE_TAB":
      return autofillActiveTab();
    case "UPDATE_SETTINGS":
      return (async () => {
        const current = await ensureState();
        const merged = { ...current.settings, ...message.payload };
        await saveSettings(merged);
        await persistState({ settings: merged });
        return { ok: true, type: "MESSAGE" as const, message: "Settings updated" };
      })();
    default:
      return Promise.resolve({ ok: false, type: "ERROR" as const, error: "Unknown message" });
  }
});

