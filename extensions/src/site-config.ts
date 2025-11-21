export type ListingSiteKey = "zillow" | "zameen" | "realtor";

export type FieldMapping = {
  selector: string;
  attribute?: "value" | "innerText" | "textContent";
};

export type SiteAdapterConfig = {
  key: ListingSiteKey;
  label: string;
  description?: string;
  hostPatterns: RegExp[];
};

export const SUPPORTED_SITES: SiteAdapterConfig[] = [
  {
    key: "zillow",
    label: "Zillow",
    description: "Autofills price, address, city, state, zip code, bedrooms, bathrooms, square footage, description, and photos.",
    hostPatterns: [/^(.*\.)?zillow\.com$/i],
  },
  {
    key: "zameen",
    label: "Zameen",
    description: "Autofills price, address, location, city, property type, purpose (rent/sell), bedrooms, bathrooms, area, description, and photos.",
    hostPatterns: [/\.zameen\.com$/i, /^zameen\.com$/i],
  },
  {
    key: "realtor",
    label: "Realtor",
    description: "Autofills price, address, city, state, zip code, bedrooms, bathrooms, square footage, description, and photos.",
    hostPatterns: [/^(.*\.)?realtor\.com$/i],
  },
];

export function matchSiteFromLocation(location: Location): ListingSiteKey | null {
  const host = location.hostname.toLowerCase();
  for (const site of SUPPORTED_SITES) {
    if (site.hostPatterns.some((pattern) => pattern.test(host))) {
      return site.key;
    }
  }
  return null;
}

