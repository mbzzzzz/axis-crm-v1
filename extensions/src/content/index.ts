import browser from "webextension-polyfill";
import type { AutofillAdapter, AutofillPayload } from "./adapters/types";
import ZillowAdapter from "./adapters/zillow";
import ZameenAdapter from "./adapters/zameen";
import RealtorAdapter from "./adapters/realtor";
import { matchSiteFromLocation } from "../site-config";

const ADAPTERS: AutofillAdapter[] = [ZillowAdapter, ZameenAdapter, RealtorAdapter];

// Add initialization flag at the top
let isInitialized = false;

// Add initialization function
function initialize() {
  if (isInitialized) return;
  isInitialized = true;
  console.log("AXIS CRM Autofill content script initialized");
}

// Call it immediately
initialize();

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

interface FillFormMessage {
  action: "FILL_FORM";
  payload: AutofillPayload;
}

type RuntimeMessage = PingMessage | AutofillMessage | FillFormMessage;

// Helper function to set value with React event dispatching
function setNativeValue(element: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    Object.getPrototypeOf(element),
    "value"
  )?.set;
  
  if (nativeInputValueSetter) {
    nativeInputValueSetter.call(element, value);
  } else {
    element.value = value;
  }

  // Dispatch React-compatible events
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
  
  // Also dispatch React synthetic events if needed
  const inputEvent = new Event("input", { bubbles: true, cancelable: true });
  const changeEvent = new Event("change", { bubbles: true, cancelable: true });
  element.dispatchEvent(inputEvent);
  element.dispatchEvent(changeEvent);
}

// Handle Profolio (profolio.zameen.com) form filling
async function handleProfolioFill(payload: AutofillPayload) {
  console.log("AXIS Autofill: Starting Profolio form fill", payload.property);
  
  const { property } = payload;

  // Wait for page to be ready
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Find Title Input: Look for input with placeholder 'Enter property title...' or label 'Title'
  const titleSelectors = [
    'input[placeholder*="Enter property title" i]',
    'input[placeholder*="property title" i]',
    'input[placeholder*="Title" i]',
    'input[aria-label*="Title" i]',
    'label:has-text("Title") + input',
    'input[name*="title" i]',
  ];

  let titleInput: HTMLInputElement | null = null;
  for (const selector of titleSelectors) {
    titleInput = document.querySelector<HTMLInputElement>(selector);
    if (titleInput) break;
  }

  // Also try finding by label
  if (!titleInput) {
    const titleLabel = Array.from(document.querySelectorAll("label")).find(
      (label) => label.textContent?.toLowerCase().includes("title")
    );
    if (titleLabel) {
      const labelFor = titleLabel.getAttribute("for");
      if (labelFor) {
        titleInput = document.querySelector<HTMLInputElement>(`#${labelFor}`);
      } else {
        // Look for input next to label
        const nextInput = titleLabel.nextElementSibling as HTMLInputElement;
        if (nextInput && (nextInput.tagName === "INPUT" || nextInput.tagName === "TEXTAREA")) {
          titleInput = nextInput;
        }
      }
    }
  }

  if (titleInput) {
    setNativeValue(titleInput, property.title);
    console.log("AXIS Autofill: Title filled");
  } else {
    console.warn("AXIS Autofill: Title input not found");
  }

  // Find Description Input: Look for textarea with placeholder 'Describe your property...'
  const descriptionSelectors = [
    'textarea[placeholder*="Describe your property" i]',
    'textarea[placeholder*="Describe" i]',
    'textarea[placeholder*="description" i]',
    'textarea[aria-label*="Description" i]',
    'textarea[name*="description" i]',
  ];

  let descriptionInput: HTMLTextAreaElement | null = null;
  for (const selector of descriptionSelectors) {
    descriptionInput = document.querySelector<HTMLTextAreaElement>(selector);
    if (descriptionInput) break;
  }

  // Also try finding by label
  if (!descriptionInput) {
    const descLabel = Array.from(document.querySelectorAll("label")).find(
      (label) => label.textContent?.toLowerCase().includes("description")
    );
    if (descLabel) {
      const labelFor = descLabel.getAttribute("for");
      if (labelFor) {
        descriptionInput = document.querySelector<HTMLTextAreaElement>(`#${labelFor}`);
      } else {
        const nextTextarea = descLabel.nextElementSibling as HTMLTextAreaElement;
        if (nextTextarea && nextTextarea.tagName === "TEXTAREA") {
          descriptionInput = nextTextarea;
        }
      }
    }
  }

  if (descriptionInput && property.description) {
    setNativeValue(descriptionInput, property.description);
    console.log("AXIS Autofill: Description filled");
  } else {
    console.warn("AXIS Autofill: Description textarea not found");
  }

  console.log("AXIS Autofill: Profolio form fill completed");
}

browser.runtime.onMessage.addListener(
  async (
    message: RuntimeMessage,
    sender: browser.Runtime.MessageSender
  ): Promise<{ ready?: boolean; initialized?: boolean; success?: boolean; error?: string }> => {
    // Handle PING message
    if ("type" in message && message.type === "AXIS_PING") {
      return { ready: true, initialized: isInitialized };
    }

    // Handle FILL_FORM message (direct from popup)
    if ("action" in message && message.action === "FILL_FORM") {
      const fillMessage = message as FillFormMessage;
      
      // Check if we're on Profolio
      if (window.location.hostname.includes("profolio.zameen.com")) {
        try {
          await handleProfolioFill(fillMessage.payload);
          showToast("AXIS Autofill complete");
          return { success: true };
        } catch (error) {
          console.error("AXIS Autofill error", error);
          const errorMsg = error instanceof Error ? error.message : String(error);
          showToast(`AXIS Autofill failed: ${errorMsg}`);
          return { success: false, error: errorMsg };
        }
      }
      
      // For other sites, use adapter
      const adapter = getAdapter();
      if (!adapter) {
        showToast("AXIS Autofill: Unsupported site");
        return { success: false, error: "Unsupported site" };
      }

      try {
        await adapter.apply(fillMessage.payload);
        showToast("AXIS Autofill complete");
        return { success: true };
      } catch (error) {
        console.error("AXIS Autofill error", error);
        const errorMsg = error instanceof Error ? error.message : String(error);
        showToast(`AXIS Autofill failed: ${errorMsg}`);
        return { success: false, error: errorMsg };
      }
    }

    // Handle legacy AXIS_AUTOFILL message
    if ("type" in message && message.type === "AXIS_AUTOFILL") {
      const autofillMessage = message as AutofillMessage;
      const adapter = getAdapter();
      if (!adapter) {
        showToast("AXIS Autofill: Unsupported site");
        return { success: false, error: "Unsupported site" };
      }

      try {
        await adapter.apply(autofillMessage.payload);
        showToast("AXIS Autofill complete");
        return { success: true };
      } catch (error) {
        console.error("AXIS Autofill error", error);
        const errorMsg = error instanceof Error ? error.message : String(error);
        showToast(`AXIS Autofill failed: ${errorMsg}`);
        return { success: false, error: errorMsg };
      }
    }

    return { success: false, error: "Unknown message type" };
  }
);

console.log("AXIS CRM Autofill content script loaded");

