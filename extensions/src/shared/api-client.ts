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
  const response = await fetch(toAbsoluteUrl(baseUrl, path), {
    method: "GET",
    headers: DEFAULT_HEADERS,
    credentials: "include",
  });

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
  const results = await axisFetch<AxisPropertyRecord[]>(baseUrl, "/api/properties?limit=200");
  return results.map((item) => ({
    ...item,
    images: Array.isArray(item.images) ? item.images : [],
    amenities: Array.isArray(item.amenities) ? item.amenities : [],
  }));
}

