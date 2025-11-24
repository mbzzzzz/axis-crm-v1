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

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    let errorMessage = `Request failed (${response.status}): ${text || response.statusText}`;
    
    if (response.status === 401 || response.status === 403) {
      errorMessage = "Not signed in. Please log into AXIS CRM dashboard first.";
    } else if (response.status === 404) {
      errorMessage = "API endpoint not found. Check your AXIS CRM URL in settings.";
    } else if (response.status >= 500) {
      errorMessage = "AXIS CRM server error. Please try again later.";
    }
    
    const error = new Error(errorMessage);
    (error as any).status = response.status;
    throw error;
  }

  return (await response.json()) as T;
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

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    let errorMessage = `Request failed (${response.status}): ${text || response.statusText}`;
    
    if (response.status === 401 || response.status === 403) {
      errorMessage = "Not signed in. Please log into AXIS CRM dashboard first.";
    } else if (response.status === 404) {
      errorMessage = "API endpoint not found. Check your AXIS CRM URL in settings.";
    } else if (response.status >= 500) {
      errorMessage = "AXIS CRM server error. Please try again later.";
    }
    
    const error = new Error(errorMessage);
    (error as any).status = response.status;
    throw error;
  }

  return (await response.json()) as T;
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

