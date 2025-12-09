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
 * Specifically optimized for Supabase session cookies
 */
export async function getCookiesForDomain(url: string): Promise<Cookie[]> {
  try {
    // Parse the URL to get the domain
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    
    // Use Chrome/Firefox cookies API
    if (browser.cookies) {
      // Try multiple strategies to get cookies
      let cookies: browser.Cookies.Cookie[] = [];
      
      // Strategy 1: Get cookies for the exact URL (most reliable)
      try {
        cookies = await browser.cookies.getAll({ url });
      } catch (e) {
        console.warn("Failed to get cookies for exact URL:", e);
      }
      
      // Strategy 2: If empty, try getting all cookies for the domain
      if (cookies.length === 0) {
        try {
          // Get cookies for the exact hostname
          cookies = await browser.cookies.getAll({ domain: hostname });
        } catch (e) {
          console.warn("Failed to get cookies for hostname:", e);
        }
      }
      
      // Strategy 3: Try base domain (for subdomains like *.vercel.app)
      if (cookies.length === 0) {
        try {
          const domainParts = hostname.split('.');
          if (domainParts.length > 1) {
            // Try base domain (e.g., .vercel.app)
            const baseDomain = '.' + domainParts.slice(-2).join('.');
            cookies = await browser.cookies.getAll({ domain: baseDomain });
          }
        } catch (e) {
          console.warn("Failed to get cookies for base domain:", e);
        }
      }
      
      // Strategy 4: Get all cookies and filter by domain (last resort)
      if (cookies.length === 0) {
        try {
          const allCookies = await browser.cookies.getAll({});
          cookies = allCookies.filter((cookie) => {
            // Match cookies for this domain
            return cookie.domain === hostname || 
                   cookie.domain === `.${hostname}` ||
                   hostname.endsWith(cookie.domain || '');
          });
        } catch (e) {
          console.warn("Failed to get all cookies:", e);
        }
      }
      
      // Filter for cookies that match the path or are root cookies
      const path = urlObj.pathname;
      const filteredCookies = cookies
        .filter((cookie) => {
          // Include root cookies or cookies that match the path
          return !cookie.path || path.startsWith(cookie.path);
        })
        .map((cookie) => ({
          name: cookie.name,
          value: cookie.value,
        }));
      
      // Log for debugging (only Supabase cookies)
      const supabaseCookies = filteredCookies.filter(c => 
        c.name.startsWith('sb-') || 
        c.name.includes('supabase') || 
        c.name.includes('auth')
      );
      
      if (supabaseCookies.length > 0) {
        console.log(`[Extension] ✅ Found ${supabaseCookies.length} Supabase cookies:`, supabaseCookies.map(c => c.name));
      } else {
        console.warn(`[Extension] ⚠️ No Supabase cookies found for ${url}. Total cookies: ${filteredCookies.length}`);
        // Log all cookie names for debugging
        if (filteredCookies.length > 0) {
          console.log(`[Extension] Available cookies:`, filteredCookies.map(c => c.name).join(', '));
        } else {
          console.warn(`[Extension] No cookies found at all. This might indicate:`);
          console.warn(`  1. User is not logged in`);
          console.warn(`  2. Cookies are set for a different domain`);
          console.warn(`  3. Extension permissions issue`);
          console.warn(`  4. Cookies have HttpOnly flag (should still work with browser.cookies API)`);
        }
      }
      
      return filteredCookies;
    }
    
    // Fallback: return empty array if cookies API not available
    console.warn("[Extension] browser.cookies API not available");
    return [];
  } catch (error) {
    console.error("[Extension] Error getting cookies:", error);
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

