export function setInputValue(selector: string, value: string | number | undefined | null) {
  const element = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector);
  if (!element || value === undefined || value === null) return;
  const nativeDescriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(element), "value");
  nativeDescriptor?.set?.call(element, String(value));
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
}

export function setSelectValue(selector: string, value: string | undefined | null) {
  const element = document.querySelector<HTMLSelectElement>(selector);
  if (!element || !value) return;
  element.value = value;
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
}

export async function uploadImages(selector: string, urls: string[]) {
  if (!urls.length) return;
  const input = document.querySelector<HTMLInputElement>(selector);
  if (!input) return;

  const dataTransfer = new DataTransfer();
  const FETCH_TIMEOUT = 10000; // 10 seconds
  
  for (const url of urls.slice(0, input.multiple ? urls.length : 1)) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
      
      let response: Response;
      try {
        response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError instanceof Error && fetchError.name === "AbortError") {
          throw new Error(`Request timed out after ${FETCH_TIMEOUT}ms`);
        }
        throw fetchError;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const fileName = url.split("/").pop() || "axis-media.jpg";
      const file = new File([blob], fileName, { type: blob.type });
      dataTransfer.items.add(file);
    } catch (error) {
      console.warn("Failed to download media", error);
    }
  }

  input.files = dataTransfer.files;
  input.dispatchEvent(new Event("change", { bubbles: true }));
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

