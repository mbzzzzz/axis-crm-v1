/**
 * Universal Field Detection System
 * Provides comprehensive field detection with multiple selector strategies
 */

// Universal field selector definitions
export const FIELD_SELECTORS = {
  contactName: [
    'input[name*="name" i]',
    'input[name*="contact" i]',
    'input[id*="name" i]',
    'input[placeholder*="name" i]',
    'input[aria-label*="name" i]',
    'input[autocomplete="name"]',
    'input[data-field*="name"]',
  ],
  email: [
    'input[type="email"]',
    'input[name*="email" i]',
    'input[id*="email" i]',
    'input[placeholder*="email" i]',
    'input[autocomplete="email"]',
  ],
  phone: [
    'input[type="tel"]',
    'input[name*="phone" i]',
    'input[name*="mobile" i]',
    'input[name*="contact" i]',
    'input[id*="phone" i]',
    'input[id*="mobile" i]',
    'input[placeholder*="phone" i]',
    'input[autocomplete="tel"]',
  ],
  whatsapp: [
    'input[name*="whatsapp" i]',
    'input[id*="whatsapp" i]',
    'input[placeholder*="whatsapp" i]',
  ],
  propertyTitle: [
    'input[name*="title" i]',
    'input[name*="heading" i]',
    'input[id*="title" i]',
    'textarea[name*="title" i]',
    'input[placeholder*="title" i]',
    'input[data-field*="title"]',
  ],
  description: [
    'textarea[name*="description" i]',
    'textarea[id*="description" i]',
    'textarea[placeholder*="description" i]',
    'div[contenteditable="true"]',
    'textarea[name*="details" i]',
    'textarea[aria-label*="description" i]',
  ],
  price: [
    'input[name*="price" i]',
    'input[id*="price" i]',
    'input[name*="rent" i]',
    'input[name*="amount" i]',
    'input[placeholder*="price" i]',
    'input[type="number"][name*="price"]',
    'input[data-field*="price"]',
  ],
  area: [
    'input[name*="area" i]',
    'input[name*="size" i]',
    'input[id*="area" i]',
    'input[name*="sqft" i]',
    'input[name*="square" i]',
    'input[placeholder*="area" i]',
    'input[placeholder*="size" i]',
  ],
  bedrooms: [
    'input[name*="bedroom" i]',
    'input[name*="bed" i]',
    'select[name*="bedroom" i]',
    'input[id*="bedroom" i]',
    'select[id*="bedroom" i]',
    'input[placeholder*="bedroom" i]',
    'input[aria-label*="bedroom" i]',
  ],
  bathrooms: [
    'input[name*="bathroom" i]',
    'input[name*="bath" i]',
    'select[name*="bathroom" i]',
    'input[id*="bathroom" i]',
    'select[id*="bathroom" i]',
  ],
  propertyType: [
    'select[name*="type" i]',
    'select[name*="property" i]',
    'select[id*="type" i]',
    'input[name*="type" i]',
    'select[aria-label*="type" i]',
    'div[data-field*="propertyType"]',
  ],
  purpose: [
    'select[name*="purpose" i]',
    'select[name*="intent" i]',
    'input[name*="sale" i]',
    'input[name*="rent" i]',
    'select[id*="purpose" i]',
    'select[aria-label*="purpose" i]',
  ],
  city: [
    'input[name*="city" i]',
    'select[name*="city" i]',
    'input[id*="city" i]',
    'input[placeholder*="city" i]',
    'select[aria-label*="city" i]',
  ],
  locality: [
    'input[name*="locality" i]',
    'input[name*="area" i]',
    'input[name*="neighborhood" i]',
    'select[name*="locality" i]',
    'input[placeholder*="locality" i]',
  ],
  address: [
    'input[name*="address" i]',
    'textarea[name*="address" i]',
    'input[id*="address" i]',
    'input[name*="location" i]',
    'input[placeholder*="address" i]',
  ],
} as const;

export type FieldType = keyof typeof FIELD_SELECTORS;

/**
 * Find a field using multiple selector strategies
 * Tries each selector until one is found
 */
export function findField(selectors: string[]): HTMLElement | null {
  for (const selector of selectors) {
    try {
      const element = document.querySelector<HTMLElement>(selector);
      if (element) {
        return element;
      }
    } catch (error) {
      // Invalid selector, continue to next
      continue;
    }
  }
  return null;
}

/**
 * Find a field in Shadow DOM
 * Recursively searches all shadow roots
 */
export function findFieldInShadowDOM(selectors: string[]): HTMLElement | null {
  // First try regular DOM
  const regularResult = findField(selectors);
  if (regularResult) return regularResult;

  // Then search Shadow DOM
  const allElements = document.querySelectorAll('*');
  for (const el of allElements) {
    if (el.shadowRoot) {
      for (const selector of selectors) {
        try {
          const shadowElement = el.shadowRoot.querySelector<HTMLElement>(selector);
          if (shadowElement) {
            return shadowElement;
          }
        } catch {
          continue;
        }
      }
      // Recursively search nested shadow roots
      const nestedShadowElements = el.shadowRoot.querySelectorAll('*');
      for (const nestedEl of nestedShadowElements) {
        if (nestedEl.shadowRoot) {
          for (const selector of selectors) {
            try {
              const shadowElement = nestedEl.shadowRoot.querySelector<HTMLElement>(selector);
              if (shadowElement) {
                return shadowElement;
              }
            } catch {
              continue;
            }
          }
        }
      }
    }
  }
  return null;
}

/**
 * Find all fields matching a field type
 * Returns all matching elements
 */
export function findAllFields(fieldType: FieldType): HTMLElement[] {
  const selectors = FIELD_SELECTORS[fieldType];
  const results: HTMLElement[] = [];

  for (const selector of selectors) {
    try {
      const elements = document.querySelectorAll<HTMLElement>(selector);
      results.push(...Array.from(elements));
    } catch {
      continue;
    }
  }

  // Remove duplicates
  return Array.from(new Set(results));
}

/**
 * Find a specific field type using universal selectors
 */
export function findFieldByType(fieldType: FieldType, includeShadowDOM = false): HTMLElement | null {
  const selectors = FIELD_SELECTORS[fieldType];
  if (includeShadowDOM) {
    return findFieldInShadowDOM(selectors);
  }
  return findField(selectors);
}

