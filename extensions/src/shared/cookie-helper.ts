/**
 * Helper functions to get cookies for extension requests
 * Extensions need explicit cookie access due to cross-origin restrictions
 */

import browser from "webextension-polyfill";

export interface Cookie {
  name: string;
  value: string;
}

/**
 * Get all cookies for a given domain
 */
export async function getCookiesForDomain(url: string): Promise<Cookie[]> {
  try {
    // Parse the URL to get the domain
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    
    // Use Chrome/Firefox cookies API
    if (browser.cookies) {
      // Try to get cookies for the exact URL first (most reliable)
      let cookies = await browser.cookies.getAll({ url }).catch(() => []);
      
      // If that fails or returns empty, try getting all cookies for the domain
      if (cookies.length === 0) {
        // Get cookies for the domain (without subdomain matching)
        const domainParts = hostname.split('.');
        const baseDomain = domainParts.length > 1 
          ? '.' + domainParts.slice(-2).join('.') // e.g., .vercel.app
          : hostname;
        
        cookies = await browser.cookies.getAll({ domain: baseDomain }).catch(() => []);
      }
      
      // Filter for cookies that match the path or are root cookies
      const path = urlObj.pathname;
      return cookies
        .filter((cookie) => {
          // Include root cookies or cookies that match the path
          return !cookie.path || path.startsWith(cookie.path);
        })
        .map((cookie) => ({
          name: cookie.name,
          value: cookie.value,
        }));
    }
    
    // Fallback: return empty array if cookies API not available
    return [];
  } catch (error) {
    console.error("Error getting cookies:", error);
    return [];
  }
}

/**
 * Convert cookies array to Cookie header string
 */
export function cookiesToHeader(cookies: Cookie[]): string {
  return cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");
}

/**
 * Get cookies and format as Cookie header for fetch requests
 */
export async function getCookieHeader(url: string): Promise<string> {
  const cookies = await getCookiesForDomain(url);
  return cookiesToHeader(cookies);
}

