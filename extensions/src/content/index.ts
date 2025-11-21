import browser from "webextension-polyfill";
import type { AutofillAdapter, AutofillPayload } from "./adapters/types";
import ZillowAdapter from "./adapters/zillow";
import ZameenAdapter from "./adapters/zameen";
import RealtorAdapter from "./adapters/realtor";
import { matchSiteFromLocation } from "../site-config";

const ADAPTERS: AutofillAdapter[] = [ZillowAdapter, ZameenAdapter, RealtorAdapter];

function getAdapter(siteKey?: string): AutofillAdapter | undefined {
  if (siteKey) {
    return ADAPTERS.find((adapter) => adapter.key === siteKey);
  }
  const matchedKey = matchSiteFromLocation(window.location);
  return ADAPTERS.find((adapter) => adapter.key === matchedKey);
}

let toastTimeout: number | undefined;

function showToast(message: string) {
  let toast = document.getElementById("axis-autofill-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "axis-autofill-toast";
    toast.style.position = "fixed";
    toast.style.bottom = "24px";
    toast.style.right = "24px";
    toast.style.zIndex = "99999";
    toast.style.padding = "14px 20px";
    toast.style.borderRadius = "999px";
    toast.style.fontFamily = "Inter, system-ui, sans-serif";
    toast.style.boxShadow = "0 15px 40px rgba(0,0,0,0.35)";
    toast.style.color = "#050505";
    toast.style.background = "#a855f7";
    toast.style.transition = "opacity 300ms ease";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    toast.setAttribute("aria-atomic", "true");
    toast.setAttribute("tabindex", "-1");
    document.body.appendChild(toast);
  }
  
  if (toastTimeout !== undefined) {
    clearTimeout(toastTimeout);
  }
  
  toast.textContent = message;
  toast.style.opacity = "1";
  toastTimeout = window.setTimeout(() => {
    if (toast) toast.style.opacity = "0";
    toastTimeout = undefined;
  }, 2600);
}

interface PingMessage {
  type: "AXIS_PING";
}

interface AutofillMessage {
  type: "AXIS_AUTOFILL";
  payload: AutofillPayload;
}

type RuntimeMessage = PingMessage | AutofillMessage;

browser.runtime.onMessage.addListener(
  async (
    message: RuntimeMessage,
    sender: browser.Runtime.MessageSender
  ): Promise<{ ready?: boolean; success?: boolean; error?: string }> => {
    if (message.type === "AXIS_PING") {
      return { ready: true };
    }

    if (message.type !== "AXIS_AUTOFILL") {
      return { success: false, error: "Unknown message type" };
    }

    const adapter = getAdapter();
    if (!adapter) {
      showToast("AXIS Autofill: Unsupported site");
      return { success: false, error: "Unsupported site" };
    }

    try {
      await adapter.apply(message.payload);
      showToast("AXIS Autofill complete");
      return { success: true };
    } catch (error) {
      console.error("AXIS Autofill error", error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      showToast(`AXIS Autofill failed: ${errorMsg}`);
      return { success: false, error: errorMsg };
    }
  }
);

console.log("AXIS CRM Autofill content script loaded");

