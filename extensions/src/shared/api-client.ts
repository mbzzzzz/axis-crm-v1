import { getCardTheme } from "@/lib/card-themes";
import type { AxisPropertyRecord, ExtensionTheme } from "./types";

const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
};

function toAbsoluteUrl(baseUrl: string, path: string) {
  const normalizedBase = baseUrl.replace(/\/+$/, "");
  return `${normalizedBase}${path.startsWith("/") ? path : `/${path}`}`;
}

async function axisFetch<T>(baseUrl: string, path: string): Promise<T> {
  const FETCH_TIMEOUT = 30000; // 30 seconds
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  let response: Response;
  try {
    response = await fetch(toAbsoluteUrl(baseUrl, path), {
      method: "GET",
      headers: DEFAULT_HEADERS,
      credentials: "include",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
  } catch (fetchError) {
    clearTimeout(timeoutId);
    if (fetchError instanceof Error && fetchError.name === "AbortError") {
      const timeoutError = new Error("Request timed out");
      (timeoutError as any).status = 408;
      throw timeoutError;
    }
    throw fetchError;
  }

  // Check Content-Type to detect HTML responses (which means we got redirected or hit wrong endpoint)
  const contentType = response.headers.get("content-type") || "";
  const isHtml = contentType.includes("text/html") || contentType.includes("application/xhtml");
  
  if (isHtml) {
    const text = await response.text().catch(() => "");
    // Check if this looks like a login page or tenant portal
    const isLoginPage = text.includes("login") || text.includes("sign in") || text.includes("tenant-portal");
    const isTenantPortal = text.includes("tenant-portal") || path.includes("tenant");
    
    let errorMessage = "Received HTML instead of JSON. ";
    if (isTenantPortal) {
      errorMessage += "You're trying to access the tenant portal. The extension only works with the agent dashboard. Please log into the main dashboard at the root URL (not /tenant-portal).";
    } else if (isLoginPage || response.status === 401 || response.status === 403) {
      errorMessage += "You're not signed in or your session expired. Please:\n1. Open AXIS CRM dashboard in a new tab\n2. Log in as an agent (not tenant)\n3. Make sure you're on the main dashboard (not tenant portal)\n4. Then try syncing again.";
    } else {
      errorMessage += "The API endpoint returned an HTML page. This usually means:\n1. You're not logged in as an agent\n2. You're on the tenant portal instead of the main dashboard\n3. The API URL in settings is incorrect";
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
      errorMessage = "Not signed in. Please log into AXIS CRM dashboard as an agent (not tenant portal), then try syncing again.";
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

  let response: Response;
  try {
    response = await fetch(toAbsoluteUrl(baseUrl, path), {
      method: "POST",
      headers: DEFAULT_HEADERS,
      credentials: "include",
      signal: controller.signal,
      body: JSON.stringify(body),
    });
    clearTimeout(timeoutId);
  } catch (fetchError) {
    clearTimeout(timeoutId);
    if (fetchError instanceof Error && fetchError.name === "AbortError") {
      const timeoutError = new Error("Request timed out");
      (timeoutError as any).status = 408;
      throw timeoutError;
    }
    throw fetchError;
  }

  // Check Content-Type to detect HTML responses
  const contentType = response.headers.get("content-type") || "";
  const isHtml = contentType.includes("text/html") || contentType.includes("application/xhtml");
  
  if (isHtml) {
    const text = await response.text().catch(() => "");
    const isTenantPortal = text.includes("tenant-portal") || path.includes("tenant");
    
    let errorMessage = "Received HTML instead of JSON. ";
    if (isTenantPortal) {
      errorMessage += "The extension only works with the agent dashboard, not the tenant portal.";
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

