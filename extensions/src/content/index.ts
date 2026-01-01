import browser from "webextension-polyfill";
import type { AutofillAdapter, AutofillPayload } from "./adapters/types";
import ZillowAdapter from "./adapters/zillow";
import ZameenAdapter from "./adapters/zameen";
import RealtorAdapter from "./adapters/realtor";
import BayutAdapter from "./adapters/bayut";
import PropertyFinderAdapter from "./adapters/propertyfinder";
import DubizzleAdapter from "./adapters/dubizzle";
import PropsearchAdapter from "./adapters/propsearch";
import { matchSiteFromLocation } from "../site-config";
import { uploadImages } from "./adapters/utils";
import { extractLeadFromCurrentPage } from "../shared/leads-extractor";

const ADAPTERS: AutofillAdapter[] = [
  ZillowAdapter,
  ZameenAdapter,
  RealtorAdapter,
  BayutAdapter,
  PropertyFinderAdapter,
  DubizzleAdapter,
  PropsearchAdapter,
];

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

interface ExtractLeadMessage {
  action: "EXTRACT_LEAD";
}

type RuntimeMessage = PingMessage | AutofillMessage | FillFormMessage | ExtractLeadMessage;

// Helper function to wait for form container to be available
async function waitForFormContainer(timeout = 5000): Promise<HTMLElement | null> {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    // Look for common form containers
    const formSelectors = [
      'form',
      '[role="form"]',
      '[class*="form"]',
      '[class*="Form"]',
      'main',
      'article',
      '[class*="container"]',
    ];

    for (const selector of formSelectors) {
      const element = document.querySelector<HTMLElement>(selector);
      if (element) {
        return element;
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  return null;
}

// Helper function to set value with React event dispatching
function setNativeValue(element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, value: string) {
  // Focus the element first
  element.focus();

  if (element instanceof HTMLSelectElement) {
    element.value = value;
    // Trigger multiple events for React compatibility
    element.dispatchEvent(new Event("input", { bubbles: true, cancelable: true }));
    element.dispatchEvent(new Event("change", { bubbles: true, cancelable: true }));
    element.dispatchEvent(new Event("blur", { bubbles: true, cancelable: true }));
    element.focus();
    return;
  }

  // Get native value setter to bypass React's value tracking
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    Object.getPrototypeOf(element),
    "value"
  )?.set;

  // Set value using native setter
  if (nativeInputValueSetter) {
    nativeInputValueSetter.call(element, value);
  } else {
    element.value = value;
  }

  // Dispatch comprehensive events for React compatibility
  const events = [
    new Event("input", { bubbles: true, cancelable: true }),
    new Event("change", { bubbles: true, cancelable: true }),
    new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Enter" }),
    new KeyboardEvent("keyup", { bubbles: true, cancelable: true, key: "Enter" }),
  ];

  events.forEach(event => {
    element.dispatchEvent(event);
  });

  // Create React-compatible synthetic event
  const reactInputEvent = new Event("input", { bubbles: true, cancelable: true });
  Object.defineProperty(reactInputEvent, "target", {
    value: element,
    enumerable: true,
    configurable: true
  });
  element.dispatchEvent(reactInputEvent);

  // Trigger blur and refocus to ensure validation runs
  element.blur();
  // Small delay before refocus to let validation complete
  setTimeout(() => {
    element.focus();
  }, 50);
}

// Helper to highlight element for visual feedback
function highlightElement(element: HTMLElement) {
  const originalTransition = element.style.transition;
  const originalBoxShadow = element.style.boxShadow;

  element.style.transition = "all 0.5s ease";
  element.style.boxShadow = "0 0 0 4px #a855f7";

  setTimeout(() => {
    element.style.boxShadow = originalBoxShadow;
    setTimeout(() => {
      element.style.transition = originalTransition;
    }, 500);
  }, 2000);
}

// Robust input finder that looks for labels, placeholders, and structure
function findInputByKeywords(root: Document | HTMLElement, keywords: string[]): HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null {
  const lowerKeywords = keywords.map(k => k.toLowerCase());

  // 1. Direct match by placeholder, name, id, or aria-label
  const selectorParts = [];
  for (const keyword of keywords) {
    selectorParts.push(`input[placeholder*="${keyword}" i]`);
    selectorParts.push(`textarea[placeholder*="${keyword}" i]`);
    selectorParts.push(`select[placeholder*="${keyword}" i]`);
    selectorParts.push(`input[name*="${keyword.toLowerCase()}" i]`);
    selectorParts.push(`textarea[name*="${keyword.toLowerCase()}" i]`);
    selectorParts.push(`select[name*="${keyword.toLowerCase()}" i]`);
    selectorParts.push(`input[id*="${keyword.toLowerCase()}" i]`);
    selectorParts.push(`[aria-label*="${keyword}" i]`);
  }

  const directMatch = root.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(selectorParts.join(','));
  if (directMatch) return directMatch;

  // 2. Find by Label text
  const allLabels = Array.from(root.querySelectorAll("label, div, span, p, h3, h4, h5, h6"));
  const foundLabel = allLabels.find(el => {
    // specific check to avoid finding long paragraphs
    if (el.textContent && el.textContent.length < 50) {
      const text = el.textContent.toLowerCase().trim();
      return lowerKeywords.some(k => text.includes(k.toLowerCase()));
    }
    return false;
  });

  if (foundLabel) {
    // Check "for" attribute
    if (foundLabel instanceof HTMLLabelElement && foundLabel.htmlFor) {
      const input = root.getElementById(foundLabel.htmlFor);
      if (input && (input.tagName === 'INPUT' || input.tagName === 'TEXTAREA' || input.tagName === 'SELECT')) {
        return input as HTMLInputElement;
      }
    }

    // Check ancestors/siblings (common in React UI libs)

    // a. Input inside the label
    const inputInLabel = foundLabel.querySelector('input, textarea, select');
    if (inputInLabel) return inputInLabel as HTMLInputElement;

    // b. Input is next sibling
    let sibling = foundLabel.nextElementSibling;
    while (sibling) {
      if (sibling.tagName === 'INPUT' || sibling.tagName === 'TEXTAREA' || sibling.tagName === 'SELECT') {
        return sibling as HTMLInputElement;
      }
      // If sibling is a wrapper div, look inside
      const inputInSibling = sibling.querySelector('input, textarea, select');
      if (inputInSibling) return inputInSibling as HTMLInputElement;

      sibling = sibling.nextElementSibling;
      // Don't look too far
      if (sibling && sibling.tagName === 'LABEL') break;
    }

    // c. Label is inside a wrapper that also contains the input (Material UI style)
    const parent = foundLabel.parentElement;
    if (parent) {
      const inputInParent = parent.querySelector('input, textarea, select');
      if (inputInParent) return inputInParent as HTMLInputElement;

      const grandParent = parent.parentElement;
      if (grandParent) {
        const inputInGrandParent = grandParent.querySelector('input, textarea, select');
        if (inputInGrandParent) return inputInGrandParent as HTMLInputElement;
      }
    }
  }

  return null;
}

// Handle Profolio (profolio.zameen.com) form filling
async function handleProfolioFill(payload: AutofillPayload) {
  console.log("AXIS Autofill: Starting Profolio form fill", payload.property);
  showToast("Detecting form fields...");

  const { property } = payload;

  // Wait for page to be ready
  await new Promise((resolve) => setTimeout(resolve, 500));

  // --- Search Location / City ---
  // In the screenshot, "City" is a dropdown/select and "Location" is a search input.
  if (property.city) {
    const cityInput = findInputByKeywords(document, ["City", "Select City"]);
    if (cityInput) {
      highlightElement(cityInput);
      // For react-select or complex dropdowns, we might just focus it or try to type
      cityInput.focus();
      // Try setting value, but often these need manual interaction
      // setNativeValue(cityInput, property.city); 
      console.log("Found City input");
    }
  }

  if (property.address) {
    // "Location" in Profolio is usually an autocomplete. We can try typing the address.
    const locationInput = findInputByKeywords(document, ["Location", "Search Location"]);
    if (locationInput) {
      highlightElement(locationInput);
      setNativeValue(locationInput as HTMLInputElement, property.address);
      console.log("Found Location input");
    }
  }

  // --- Property Type ---
  // Often a set of buttons or a dropdown.
  if (property.propertyType) {
    // Try to find a button with the text (e.g. "Apartment")
    const xpath = `//span[contains(text(), '${property.propertyType}')] | //div[contains(text(), '${property.propertyType}')] | //button[contains(text(), '${property.propertyType}')]`;
    const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    const typeEl = result.singleNodeValue as HTMLElement;
    if (typeEl) {
      highlightElement(typeEl);
      typeEl.click();
      console.log("Clicked Property Type:", property.propertyType);
    }
  }

  // --- Price ---
  // Look specifically for "Price" in the "Price and Area" section
  if (property.price) {
    const priceInput = findInputByKeywords(document, ["Price (PKR)", "Total Price", "Price"]);
    if (priceInput) {
      highlightElement(priceInput);
      setNativeValue(priceInput as HTMLInputElement, String(property.price));
      console.log("Filled Price");
    }
  }

  // --- Area Size ---
  if (property.sizeSqft) {
    // Profolio might use Marla/Kanal. 
    // This is a naive fill of the number. User might need to select unit.
    const areaInput = findInputByKeywords(document, ["Area Size", "Area", "Enter Unit"]);
    if (areaInput) {
      highlightElement(areaInput);
      setNativeValue(areaInput as HTMLInputElement, String(property.sizeSqft)); // Or convert if needed logic exists
      console.log("Filled Area");
    }
  }

  // --- Title and Description ---
  // These are often further down
  if (property.title) {
    const titleInput = findInputByKeywords(document, ["Property Title", "Title"]);
    if (titleInput) {
      highlightElement(titleInput);
      setNativeValue(titleInput as HTMLInputElement, property.title);
    }
  }

  if (property.description) {
    const descInput = findInputByKeywords(document, ["Description", "Describe your property"]);
    if (descInput) {
      highlightElement(descInput);
      setNativeValue(descInput as HTMLTextAreaElement, property.description);
    }
  }

  // --- Bedrooms / Bathrooms ---
  if (property.bedrooms) {
    const bedInput = findInputByKeywords(document, ["Bedrooms", "Beds"]);
    if (bedInput) {
      highlightElement(bedInput);
      setNativeValue(bedInput as HTMLInputElement, String(property.bedrooms));
    } else {
      // Look for grouping buttons
      // e.g. a section with "Bedrooms" header and buttons 1, 2, 3...
      // Naive approach: find 'Bedrooms' text, look at next siblings for buttons
    }
  }

  if (property.bathrooms) {
    const bathInput = findInputByKeywords(document, ["Bathrooms", "Baths"]);
    if (bathInput) {
      highlightElement(bathInput);
      setNativeValue(bathInput as HTMLInputElement, String(property.bathrooms));
    }
  }

  // --- Images ---
  if (property.images && property.images.length > 0) {
    // Trigger file input if possible, but this usually requires user interaction to open dialog
    // or finding the hidden file input.
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
      // Automated file upload is restricted by browser security without user action usually.
      // We can try calling our utils if they work via DataTransfer
      try {
        await uploadImages('input[type="file"]', property.images);
        console.log("Attempted image upload");
      } catch (e) {
        console.warn("Image upload failed", e);
      }
    } else {
      // Try finding the "Upload" button to highlight it at least
      const uploadBtn = findInputByKeywords(document, ["Upload", "Add Photos", "Images"]) as unknown as HTMLElement; // findInput returns inputs, but maybe we change it or just use similar logic
      if (uploadBtn) highlightElement(uploadBtn);
    }
  }

  console.log("AXIS Autofill: Profolio form fill completed");
}

browser.runtime.onMessage.addListener(
  async (
    message: RuntimeMessage,
    sender: browser.Runtime.MessageSender
  ): Promise<{ ready?: boolean; initialized?: boolean; success?: boolean; error?: string; lead?: any }> => {
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

    // Handle EXTRACT_LEAD message
    if ("action" in message && message.action === "EXTRACT_LEAD") {
      try {
        const lead = extractLeadFromCurrentPage();
        if (lead) {
          showToast("Lead extracted successfully");
          return { success: true, lead };
        } else {
          showToast("No lead information found on this page");
          return { success: false, error: "No lead information found" };
        }
      } catch (error) {
        console.error("Lead extraction error", error);
        const errorMsg = error instanceof Error ? error.message : String(error);
        showToast(`Lead extraction failed: ${errorMsg}`);
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

