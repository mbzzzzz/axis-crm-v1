/**
 * Shadow DOM Utilities
 * Provides utilities to find elements in Shadow DOM
 */

/**
 * Recursively search all shadow roots for an element matching the selector
 */
export function findInShadowDOM(selector: string): HTMLElement[] {
  const results: HTMLElement[] = [];

  // First check regular DOM
  try {
    const regularElements = document.querySelectorAll<HTMLElement>(selector);
    results.push(...Array.from(regularElements));
  } catch {
    // Invalid selector
  }

  // Then search all shadow roots
  const allElements = document.querySelectorAll('*');
  for (const el of allElements) {
    if (el.shadowRoot) {
      try {
        const shadowElements = el.shadowRoot.querySelectorAll<HTMLElement>(selector);
        results.push(...Array.from(shadowElements));
      } catch {
        // Invalid selector or no matches
      }

      // Recursively search nested shadow roots
      const nestedElements = el.shadowRoot.querySelectorAll('*');
      for (const nestedEl of nestedElements) {
        if (nestedEl.shadowRoot) {
          try {
            const nestedShadowElements = nestedEl.shadowRoot.querySelectorAll<HTMLElement>(selector);
            results.push(...Array.from(nestedShadowElements));
          } catch {
            // Invalid selector or no matches
          }
        }
      }
    }
  }

  // Remove duplicates
  return Array.from(new Set(results));
}

/**
 * Find all file inputs including those in Shadow DOM
 */
export function findFileInputsInShadowDOM(): HTMLInputElement[] {
  const selectors = [
    'input[type="file"]',
    'input[type="file"][accept*="image"]',
    'input[type="file"][name*="image" i]',
    'input[type="file"][name*="photo" i]',
    'input[type="file"][name*="picture" i]',
  ];

  const results: HTMLInputElement[] = [];

  for (const selector of selectors) {
    const elements = findInShadowDOM(selector);
    for (const el of elements) {
      if (el instanceof HTMLInputElement && el.type === 'file') {
        results.push(el);
      }
    }
  }

  // Remove duplicates
  return Array.from(new Set(results));
}

/**
 * Wait for an element to appear in Shadow DOM
 */
export function waitForShadowDOMElement(
  selector: string,
  timeout = 8000
): Promise<HTMLElement | null> {
  return new Promise((resolve) => {
    // Check immediately
    const immediate = findInShadowDOM(selector);
    if (immediate.length > 0) {
      resolve(immediate[0]);
      return;
    }

    // Set up observer for regular DOM
    const observer = new MutationObserver(() => {
      const found = findInShadowDOM(selector);
      if (found.length > 0) {
        observer.disconnect();
        resolve(found[0]);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Timeout
    setTimeout(() => {
      observer.disconnect();
      const final = findInShadowDOM(selector);
      resolve(final.length > 0 ? final[0] : null);
    }, timeout);
  });
}

