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
import { SUPPORTED_SITES } from "../site-config";

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

  // Validate URL - prevent tenant portal URLs
  const baseUrl = (current.settings.apiBaseUrl || "").trim();
  if (!baseUrl) {
    const error = "AXIS CRM URL is not configured. Please set it in extension settings.";
    await setStatus("error", error);
    return { ok: false, type: "ERROR" as const, error, code: "NO_URL" };
  }

  // Check if URL contains tenant portal path
  const urlLower = baseUrl.toLowerCase();
  if (urlLower.includes("/tenant-portal") || urlLower.includes("tenant-portal")) {
    const error = "The extension only works with the agent dashboard, not the tenant portal.\n\nPlease update your AXIS CRM URL in settings to point to the main dashboard (e.g., https://your-domain.com, not https://your-domain.com/tenant-portal)";
    await setStatus("error", error);
    return { ok: false, type: "ERROR" as const, error, code: "TENANT_PORTAL_URL" };
  }

  try {
    const [theme, properties] = await Promise.all([
      fetchTheme(baseUrl).catch((err) => {
        console.warn("Theme fetch failed:", err);
        return null;
      }),
      fetchProperties(baseUrl),
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
    let errorCode: string | undefined;

    // Check for HTML response errors (tenant portal or login redirect)
    if ((error as any).isHtml || errorMessage.includes("HTML instead of JSON") || errorMessage.includes("<!DOCTYPE")) {
      errorCode = "HTML_RESPONSE";
      // Only show tenant portal message if URL actually contains tenant-portal
      const baseUrl = current.settings.apiBaseUrl || "";
      const isActuallyTenantPortal = baseUrl.toLowerCase().includes("/tenant-portal") || errorMessage.toLowerCase().includes("tenant-portal") && errorMessage.toLowerCase().includes("you're trying");

      if (isActuallyTenantPortal) {
        userMessage = "You're trying to access the tenant portal. The extension only works with the agent dashboard.\n\nPlease:\n1. Make sure your AXIS CRM URL in settings points to the main dashboard (not /tenant-portal)\n2. Log into the main dashboard as an agent\n3. Try syncing again";
      } else {
        userMessage = errorMessage || "Not signed in or session expired.\n\nPlease:\n1. Open AXIS CRM dashboard in a new tab\n2. Log in as an agent\n3. Make sure you're on the main dashboard URL\n4. Then try syncing again";
      }
    } else if (errorMessage.includes("Not signed in") || (error instanceof Error && (error as any).status === 401)) {
      errorCode = "NOT_SIGNED_IN";
      userMessage = "Not signed in. Please log into AXIS CRM dashboard as an agent (not tenant portal), then try syncing again.";
    } else if (errorMessage.includes("Failed to fetch") || errorMessage.includes("NetworkError") || errorMessage.includes("Network error:") || (error as any).isNetworkError) {
      errorCode = "NETWORK_ERROR";
      userMessage = errorMessage.includes("Network error:") ? errorMessage : "Network error. Check your internet connection and AXIS CRM URL. Make sure the URL points to the main dashboard, not the tenant portal.";
    } else if (errorMessage.includes("tenant portal") || errorMessage.includes("tenant-portal")) {
      errorCode = "TENANT_PORTAL_ERROR";
      userMessage = "The extension only works with the agent dashboard, not the tenant portal. Please use the main dashboard URL.";
    }

    return { ok: false, type: "ERROR" as const, error: userMessage, code: errorCode };
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

  const isSupported = SUPPORTED_SITES.some(site =>
    site.hostPatterns.some(pattern => pattern.test(new URL(tab.url!).hostname))
  );

  if (!tab.url || !isSupported) {
    return {
      ok: false,
      type: "ERROR" as const,
      error: "Unsupported site. Please navigate to a supported property listing page.",
    };
  }

  try {
    await ensureContentScript(tab.id);

    // Give the content script a moment to fully initialize after injection
    await new Promise((resolve) => setTimeout(resolve, 300));

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
      if (msgError?.message?.includes("Receiving end does not exist") ||
        msgError?.message?.includes("Could not establish connection") ||
        msgError?.message?.includes("Extension context invalidated")) {
        return {
          ok: false,
          type: "ERROR" as const,
          error: "Content script not ready. Please refresh the page and try again.",
        };
      }
      // If it's a timeout or other error, provide more context
      const errorMsg = msgError instanceof Error ? msgError.message : String(msgError);
      return {
        ok: false,
        type: "ERROR" as const,
        error: `Failed to communicate with page: ${errorMsg}. Try refreshing the page.`,
      };
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      type: "ERROR" as const,
      error: errorMsg.includes("injection failed")
        ? errorMsg
        : `Failed to communicate with the current page: ${errorMsg}. Try refreshing the page.`,
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

    // First, try to ping - content script might already be loaded
    try {
      const pingResponse = await browser.tabs.sendMessage(tabId, { type: "AXIS_PING" });
      if (pingResponse?.ready && pingResponse?.initialized) {
        console.log("Content script already loaded and ready");
        return; // Already loaded
      }
    } catch (pingError) {
      // Content script not loaded, continue with injection
      console.log("Content script not responding, will inject");
    }

    // Wait a bit for page to be fully ready
    await new Promise(resolve => setTimeout(resolve, 500));

    // Inject script
    if ((browser as any).scripting?.executeScript) {
      await (browser as any).scripting.executeScript({
        target: { tabId },
        files: ["content/content.js"],
      });
    } else if ((browser.tabs as any).executeScript) {
      await (browser.tabs as any).executeScript(tabId, {
        file: "content/content.js",
        runAt: "document_idle",
      });
    }

    // Wait for content script to initialize with longer timeout
    await waitForContentScriptReady(tabId, 25); // Increased from 15
  } catch (error) {
    console.error("Failed to inject content script", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Content script injection failed: ${errorMessage}`);
  }
}

async function waitForContentScriptReady(tabId: number, maxRetries = 25): Promise<void> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await browser.tabs.sendMessage(tabId, { type: "AXIS_PING" });
      if (response?.ready && response?.initialized) {
        console.log(`Content script ready after ${i + 1} attempts`);
        return;
      }
    } catch (error: any) {
      // Progressive backoff - wait longer between retries
      const waitTime = Math.min(300 + (i * 100), 1000);
      await new Promise((resolve) => setTimeout(resolve, waitTime));

      if (i === maxRetries - 1) {
        throw new Error("Content script did not respond. Please refresh the page and try again.");
      }
    }
  }
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
    case "LOGOUT":
      return (async () => {
        // Open the logout route to clear server-side session/cookies
        const baseUrl = (state?.settings.apiBaseUrl || "https://axis-crm-v1.vercel.app").replace(/\/$/, "");
        await browser.tabs.create({ url: `${baseUrl}/logout`, active: false });

        // Clear all storage
        await browser.storage.local.clear();
        // Reset state
        state = null;
        // Re-bootstrap (will result in empty/default state)
        await bootstrapState();
        return { ok: true, type: "MESSAGE" as const, message: "Logged out successfully" };
      })();
    default:
      return Promise.resolve({ ok: false, type: "ERROR" as const, error: "Unknown message" });
  }
});

