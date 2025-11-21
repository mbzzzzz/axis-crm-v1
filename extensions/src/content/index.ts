import browser from "webextension-polyfill";
import type { AutofillAdapter } from "./adapters/types";
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
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.style.opacity = "1";
  setTimeout(() => {
    if (toast) toast.style.opacity = "0";
  }, 2600);
}

browser.runtime.onMessage.addListener(async (message) => {
  if (message.type !== "AXIS_AUTOFILL") return;
  const adapter = getAdapter(message.payload?.site);
  if (!adapter) {
    showToast("AXIS Autofill: Unsupported site");
    return;
  }
  try {
    await adapter.apply(message.payload);
    showToast("AXIS Autofill complete");
  } catch (error) {
    console.error("AXIS Autofill error", error);
    showToast("AXIS Autofill failed. Check console.");
  }
});

