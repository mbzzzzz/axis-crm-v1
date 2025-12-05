export function setInputValue(selector: string, value: string | number | undefined | null) {
  const element = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector);
  if (!element || value === undefined || value === null) return;
  
  // Focus the element first (React forms often need this)
  element.focus();
  
  // Get native value setter
  const nativeDescriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(element), "value");
  
  // Set the value using native setter to bypass React's value tracking
  if (nativeDescriptor?.set) {
    nativeDescriptor.set.call(element, String(value));
  } else {
    element.value = String(value);
  }
  
  // Trigger all possible events that React might be listening to
  const events = [
    new Event("input", { bubbles: true, cancelable: true }),
    new Event("change", { bubbles: true, cancelable: true }),
    new KeyboardEvent("keydown", { bubbles: true, cancelable: true }),
    new KeyboardEvent("keyup", { bubbles: true, cancelable: true }),
  ];
  
  events.forEach(event => {
    element.dispatchEvent(event);
  });
  
  // Also trigger React's synthetic events by creating a custom event
  const reactEvent = new Event("input", { bubbles: true, cancelable: true });
  Object.defineProperty(reactEvent, "target", { value: element, enumerable: true });
  element.dispatchEvent(reactEvent);
  
  // Blur to trigger validation if needed
  element.blur();
  element.focus();
}

export function setSelectValue(selector: string, value: string | undefined | null) {
  const element = document.querySelector<HTMLSelectElement>(selector);
  if (!element || !value) return;
  element.value = value;
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
}

export async function uploadImages(selector: string, urls: string[]) {
  if (!urls.length) {
    console.log("AXIS Autofill: No images to upload");
    return;
  }
  
  const input = document.querySelector<HTMLInputElement>(selector);
  if (!input) {
    console.warn(`AXIS Autofill: Image input not found for selector: ${selector}`);
    return;
  }

  console.log(`AXIS Autofill: Found image input, uploading ${urls.length} images`);
  
  const dataTransfer = new DataTransfer();
  const FETCH_TIMEOUT = 15000; // Increased from 10s
  
  let successCount = 0;
  let failCount = 0;
  
  for (const url of urls.slice(0, input.multiple ? urls.length : 1)) {
    try {
      console.log(`AXIS Autofill: Fetching image: ${url}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
      
      const response = await fetch(url, { 
        signal: controller.signal,
        mode: 'cors' // Add CORS mode
      });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const blob = await response.blob();
      const fileName = url.split("/").pop()?.split("?")[0] || `axis-image-${Date.now()}.jpg`;
      const file = new File([blob], fileName, { type: blob.type || "image/jpeg" });
      
      dataTransfer.items.add(file);
      successCount++;
      console.log(`AXIS Autofill: Image ${successCount} uploaded successfully`);
    } catch (error) {
      failCount++;
      console.warn(`AXIS Autofill: Failed to upload image (${failCount}/${urls.length}):`, error);
    }
  }

  if (successCount > 0) {
    input.files = dataTransfer.files;
    input.dispatchEvent(new Event("change", { bubbles: true }));
    input.dispatchEvent(new Event("input", { bubbles: true }));
    console.log(`AXIS Autofill: Successfully uploaded ${successCount}/${urls.length} images`);
  } else {
    console.error("AXIS Autofill: Failed to upload any images");
  }
}

export function waitForSelector(selector: string, timeout = 8000): Promise<Element | null> {
  return new Promise((resolve) => {
    const existing = document.querySelector(selector);
    if (existing) {
      resolve(existing);
      return;
    }

    const observer = new MutationObserver(() => {
      const match = document.querySelector(selector);
      if (match) {
        observer.disconnect();
        resolve(match);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeout);
  });
}

