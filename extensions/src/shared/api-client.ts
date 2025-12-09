import { getCardTheme } from "@/lib/card-themes";
import type { AxisPropertyRecord, ExtensionTheme } from "./types";
import { getCookieHeader } from "./cookie-helper";
import { getExtensionToken, saveExtensionToken } from "./storage";

const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
};

function toAbsoluteUrl(baseUrl: string, path: string) {
  const normalizedBase = baseUrl.replace(/\/+$/, "");
  return `${normalizedBase}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Check if user is authenticated before making API calls
 * This helps provide better error messages
 * Uses extension token if available, falls back to cookies
 */
export async function checkAuthentication(baseUrl: string): Promise<{ authenticated: boolean; error?: string }> {
  try {
    // Try extension token first
    let token = await getExtensionToken();
    
    // If no token, try to get one
    if (!token) {
      token = await getOrRefreshExtensionToken(baseUrl);
    }
    
    const url = toAbsoluteUrl(baseUrl, "/api/auth/session-check");
    const headers: Record<string, string> = {
      ...DEFAULT_HEADERS,
    };
    
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    } else {
      // Fall back to cookies
      const cookieHeader = await getCookieHeader(url);
      if (cookieHeader) {
        headers["Cookie"] = cookieHeader;
      }
    }
    
    const response = await fetch(url, {
      method: "GET",
      headers,
      credentials: "include",
    });
    
    if (response.ok) {
      const data = await response.json();
      return { authenticated: data.authenticated === true };
    }
    
    return { authenticated: false, error: "Session check failed" };
  } catch (error) {
    console.warn("[Extension] Session check failed:", error);
    // Don't fail the request, just return unauthenticated
    return { authenticated: false };
  }
}

/**
 * Get or refresh extension token
 * Tries to get token from API using cookies, stores it for future use
 */
async function getOrRefreshExtensionToken(baseUrl: string): Promise<string | null> {
  try {
    // First, try to get existing token from storage
    let token = await getExtensionToken();
    
    if (token) {
      // Verify token is still valid
      const verifyUrl = toAbsoluteUrl(baseUrl, "/api/auth/extension-token");
      const cookieHeader = await getCookieHeader(verifyUrl);
      const verifyResponse = await fetch(verifyUrl, {
        method: "POST",
        headers: {
          ...DEFAULT_HEADERS,
          ...(cookieHeader ? { Cookie: cookieHeader } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ token }),
      });
      
      if (verifyResponse.ok) {
        const data = await verifyResponse.json();
        if (data.authenticated) {
          return token; // Token is valid
        }
      }
      
      // Token invalid, clear it
      await saveExtensionToken(null);
      token = null;
    }
    
    // No valid token, try to get new one using cookies
    const tokenUrl = toAbsoluteUrl(baseUrl, "/api/auth/extension-token");
    const cookieHeader = await getCookieHeader(tokenUrl);
    
    if (!cookieHeader) {
      console.warn("[Extension] No cookies available to get extension token");
      return null;
    }
    
    const tokenResponse = await fetch(tokenUrl, {
      method: "GET",
      headers: {
        ...DEFAULT_HEADERS,
        Cookie: cookieHeader,
      },
      credentials: "include",
    });
    
    if (tokenResponse.ok) {
      const data = await tokenResponse.json();
      if (data.token) {
        await saveExtensionToken(data.token);
        return data.token;
      }
    }
    
    return null;
  } catch (error) {
    console.error("[Extension] Error getting extension token:", error);
    return null;
  }
}

async function axisFetch<T>(baseUrl: string, path: string): Promise<T> {
  const FETCH_TIMEOUT = 30000; // 30 seconds
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  const url = toAbsoluteUrl(baseUrl, path);
  
  // Try to get extension token first (preferred method)
  let extensionToken = await getExtensionToken();
  
  // If no token or token might be invalid, try to get/refresh it
  if (!extensionToken) {
    extensionToken = await getOrRefreshExtensionToken(baseUrl);
  }
  
  // Build headers - prefer token over cookies
  const headers: Record<string, string> = {
    ...DEFAULT_HEADERS,
  };
  
  if (extensionToken) {
    // Use extension token (preferred - no cookie dependency)
    headers["Authorization"] = `Bearer ${extensionToken}`;
    console.log(`[Extension] Using extension token for ${path}`);
  } else {
    // Fall back to cookies (for initial token generation)
    const cookieHeader = await getCookieHeader(url);
    if (cookieHeader) {
      headers["Cookie"] = cookieHeader;
      console.log(`[Extension] Using cookies for ${path} (will try to get token)`);
    } else {
      console.warn(`[Extension] No authentication method available for ${path}`);
    }
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: "GET",
      headers,
      credentials: "include",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
  } catch (fetchError) {
    clearTimeout(timeoutId);
    if (fetchError instanceof Error && fetchError.name === "AbortError") {
      const timeoutError = new Error("Request timed out after 30 seconds. Please check your internet connection and try again.");
      (timeoutError as any).status = 408;
      throw timeoutError;
    }
    // Handle network errors (CORS, connection refused, etc.)
    if (fetchError instanceof TypeError && fetchError.message.includes("fetch")) {
      const networkError = new Error("Network error: Unable to connect to AXIS CRM.\n\nPlease:\n1. Check your internet connection\n2. Verify the AXIS CRM URL in extension settings\n3. Make sure the dashboard is accessible in your browser\n4. Try opening the dashboard in a new tab first");
      (networkError as any).status = 0;
      (networkError as any).isNetworkError = true;
      throw networkError;
    }
    throw fetchError;
  }

  // Check Content-Type to detect HTML responses (which means we got redirected or hit wrong endpoint)
  const contentType = response.headers.get("content-type") || "";
  const isHtml = contentType.includes("text/html") || contentType.includes("application/xhtml");
  
  if (isHtml) {
    const text = await response.text().catch(() => "");
    
    // More precise tenant portal detection - check URL and page structure
    const baseUrlLower = baseUrl.toLowerCase();
    const pathLower = path.toLowerCase();
    const urlContainsTenantPortal = baseUrlLower.includes("/tenant-portal") || pathLower.includes("/tenant-portal");
    
    // Check if HTML is clearly a tenant portal page (has tenant portal specific elements)
    const isTenantPortalPage = urlContainsTenantPortal || 
      (text.includes('tenant-portal/login') && text.includes('Tenant Portal')) ||
      (text.includes('tenant-portal/dashboard') && !text.includes('Dashboard') && text.includes('tenant'));
    
    // Check if it's a login/redirect page
    const isLoginRedirect = response.status === 401 || response.status === 403 || 
      (text.includes('login') && (text.includes('sign in') || text.includes('Log in'))) ||
      text.includes('redirectedFrom');
    
    let errorMessage = "Received HTML instead of JSON. ";
    
    if (isTenantPortalPage) {
      errorMessage += "You're trying to access the tenant portal. The extension only works with the agent dashboard.\n\nPlease:\n1. Make sure your AXIS CRM URL in settings points to the main dashboard (not /tenant-portal)\n2. Log into the main dashboard as an agent\n3. Try syncing again";
    } else if (isLoginRedirect) {
      errorMessage += "You're not signed in or your session expired.\n\nPlease:\n1. Open AXIS CRM dashboard in a new tab\n2. Log in as an agent (not tenant)\n3. Make sure you're on the main dashboard URL\n4. Then try syncing again";
    } else {
      // Generic HTML response - could be various issues
      errorMessage += "The API endpoint returned an HTML page instead of JSON.\n\nThis usually means:\n1. You're not logged in - please log into the dashboard first\n2. Your session expired - refresh the dashboard page\n3. The API URL in settings might be incorrect\n4. There's a server error - try again later";
    }
    
    const error = new Error(errorMessage);
    (error as any).status = response.status || 500;
    (error as any).isHtml = true;
    throw error;
  }

    if (!response.ok) {
    // If 401 and we were using token, try to refresh token
    if (response.status === 401 && extensionToken) {
      console.log("[Extension] Token invalid, trying to refresh...");
      // Clear invalid token
      await saveExtensionToken(null);
      // Try to get new token
      const newToken = await getOrRefreshExtensionToken(baseUrl);
      if (newToken) {
        // Retry request with new token
        const retryResponse = await fetch(url, {
          method: "GET",
          headers: {
            ...DEFAULT_HEADERS,
            Authorization: `Bearer ${newToken}`,
          },
          credentials: "include",
          signal: controller.signal,
        });
        
        if (retryResponse.ok) {
          clearTimeout(timeoutId);
          const jsonData = await retryResponse.json();
          return jsonData as T;
        }
      }
    }
    
    // Try to parse as JSON first (API routes now return JSON 401, not HTML redirect)
    let errorData: any = null;
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      try {
        errorData = await response.json();
      } catch {
        // Not JSON, continue with text
      }
    }
    
    const text = errorData?.error || await response.text().catch(() => "") || response.statusText;
    let errorMessage = `Request failed (${response.status}): ${text}`;
    
    if (response.status === 401 || response.status === 403) {
      if (extensionToken) {
        errorMessage = "Extension token expired or invalid.\n\nPlease:\n1. Open AXIS CRM dashboard in a new tab\n2. Make sure you're logged in as an agent (not tenant portal)\n3. Return to the extension and click 'Sync from AXIS' again\n\nThe extension will automatically get a new token.";
      } else {
        errorMessage = "Not signed in or session expired.\n\nIMPORTANT: The extension needs you to be logged into the dashboard in the same browser.\n\nPlease:\n1. Open AXIS CRM dashboard in a new tab (use the same browser)\n2. Log in if you're not already logged in\n3. Make sure you're on the main dashboard (not tenant portal)\n4. Keep the dashboard tab open\n5. Return to the extension and click 'Sync from AXIS' again\n\nNote: Your session must be active in the browser for the extension to access your data.";
      }
    } else if (response.status === 404) {
      errorMessage = "API endpoint not found. Check your AXIS CRM URL in settings. Make sure you're using the main dashboard URL, not the tenant portal.";
    } else if (response.status >= 500) {
      errorMessage = "AXIS CRM server error. Please try again later.";
    }
    
    const error = new Error(errorMessage);
    (error as any).status = response.status;
    throw error;
  }

  // Double-check we're getting JSON before parsing
  try {
    const jsonData = await response.json();
    return jsonData as T;
  } catch (jsonError) {
    // If JSON parsing fails, we might have received HTML
    const text = await response.text().catch(() => "");
    if (text.trim().startsWith("<!DOCTYPE") || text.trim().startsWith("<html")) {
      throw new Error("Received HTML page instead of JSON. Make sure you're logged into the agent dashboard (not tenant portal) and try again.");
    }
    throw new Error(`Failed to parse JSON response: ${jsonError instanceof Error ? jsonError.message : String(jsonError)}`);
  }
}

type ThemeResponse = {
  themeKey: string;
};

export async function fetchTheme(baseUrl: string): Promise<ExtensionTheme> {
  const data = await axisFetch<ThemeResponse>(baseUrl, "/api/preferences/theme");
  return {
    key: data.themeKey,
    data: getCardTheme(data.themeKey),
  };
}

export async function fetchProperties(baseUrl: string): Promise<AxisPropertyRecord[]> {
  const limit = 200;
  const allResults: AxisPropertyRecord[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const results = await axisFetch<AxisPropertyRecord[]>(
      baseUrl,
      `/api/properties?limit=${limit}&offset=${offset}`
    );
    
    if (results.length === 0) {
      hasMore = false;
    } else {
      allResults.push(...results);
      offset += limit;
      if (results.length < limit) {
        hasMore = false;
      }
    }
  }

  return allResults.map((item) => ({
    ...item,
    images: Array.isArray(item.images) ? item.images : [],
    amenities: Array.isArray(item.amenities) ? item.amenities : [],
  }));
}

export type LeadRecord = {
  id: number;
  name: string;
  phone: string;
  email?: string | null;
  budget?: number | null;
  preferredLocation?: string | null;
  source: string;
  status: string;
  notes?: string | null;
  propertyId?: number | null;
  createdAt: string;
  updatedAt: string;
};

async function axisPost<T>(baseUrl: string, path: string, body: any): Promise<T> {
  const FETCH_TIMEOUT = 30000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  const url = toAbsoluteUrl(baseUrl, path);
  
  // Get cookies explicitly for extension context
  const cookieHeader = await getCookieHeader(url);
  const headers = {
    ...DEFAULT_HEADERS,
    ...(cookieHeader ? { Cookie: cookieHeader } : {}),
  };

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers,
      credentials: "include",
      signal: controller.signal,
      body: JSON.stringify(body),
    });
    clearTimeout(timeoutId);
  } catch (fetchError) {
    clearTimeout(timeoutId);
    if (fetchError instanceof Error && fetchError.name === "AbortError") {
      const timeoutError = new Error("Request timed out after 30 seconds. Please check your internet connection and try again.");
      (timeoutError as any).status = 408;
      throw timeoutError;
    }
    // Handle network errors (CORS, connection refused, etc.)
    if (fetchError instanceof TypeError && fetchError.message.includes("fetch")) {
      const networkError = new Error("Network error: Unable to connect to AXIS CRM.\n\nPlease:\n1. Check your internet connection\n2. Verify the AXIS CRM URL in extension settings\n3. Make sure the dashboard is accessible in your browser\n4. Try opening the dashboard in a new tab first");
      (networkError as any).status = 0;
      (networkError as any).isNetworkError = true;
      throw networkError;
    }
    throw fetchError;
  }

  // Check Content-Type to detect HTML responses
  const contentType = response.headers.get("content-type") || "";
  const isHtml = contentType.includes("text/html") || contentType.includes("application/xhtml");
  
  if (isHtml) {
    const text = await response.text().catch(() => "");
    
    // More precise tenant portal detection
    const baseUrlLower = baseUrl.toLowerCase();
    const pathLower = path.toLowerCase();
    const urlContainsTenantPortal = baseUrlLower.includes("/tenant-portal") || pathLower.includes("/tenant-portal");
    const isTenantPortalPage = urlContainsTenantPortal || 
      (text.includes('tenant-portal/login') && text.includes('Tenant Portal'));
    
    let errorMessage = "Received HTML instead of JSON. ";
    if (isTenantPortalPage) {
      errorMessage += "The extension only works with the agent dashboard, not the tenant portal. Please use the main dashboard URL.";
    } else {
      errorMessage += "You're not signed in or your session expired. Please log into the agent dashboard and try again.";
    }
    
    const error = new Error(errorMessage);
    (error as any).status = response.status || 500;
    (error as any).isHtml = true;
    throw error;
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    let errorMessage = `Request failed (${response.status}): ${text || response.statusText}`;
    
    if (response.status === 401 || response.status === 403) {
      errorMessage = "Not signed in. Please log into AXIS CRM dashboard as an agent (not tenant portal), then try again.";
    } else if (response.status === 404) {
      errorMessage = "API endpoint not found. Check your AXIS CRM URL in settings.";
    } else if (response.status >= 500) {
      errorMessage = "AXIS CRM server error. Please try again later.";
    }
    
    const error = new Error(errorMessage);
    (error as any).status = response.status;
    throw error;
  }

  // Double-check we're getting JSON before parsing
  try {
    const jsonData = await response.json();
    return jsonData as T;
  } catch (jsonError) {
    const text = await response.text().catch(() => "");
    if (text.trim().startsWith("<!DOCTYPE") || text.trim().startsWith("<html")) {
      throw new Error("Received HTML page instead of JSON. Make sure you're logged into the agent dashboard (not tenant portal) and try again.");
    }
    throw new Error(`Failed to parse JSON response: ${jsonError instanceof Error ? jsonError.message : String(jsonError)}`);
  }
}

export async function createLead(baseUrl: string, lead: {
  name: string;
  phone: string;
  email?: string;
  source: string;
  preferredLocation?: string;
  budget?: number;
  notes?: string;
  propertyId?: number;
}): Promise<LeadRecord> {
  return axisPost<LeadRecord>(baseUrl, "/api/leads", lead);
}

export async function fetchLeads(baseUrl: string): Promise<LeadRecord[]> {
  return axisFetch<LeadRecord[]>(baseUrl, "/api/leads");
}

