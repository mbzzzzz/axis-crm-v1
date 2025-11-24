export type ListingSiteKey = "zillow" | "zameen" | "realtor" | "bayut" | "propertyfinder" | "dubizzle" | "propsearch";

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
    hostPatterns: [/\.zameen\.com$/i, /^zameen\.com$/i, /profolio\.zameen\.com$/i],
  },
  {
    key: "realtor",
    label: "Realtor",
    description: "Autofills price, address, city, state, zip code, bedrooms, bathrooms, square footage, description, and photos.",
    hostPatterns: [/^(.*\.)?realtor\.com$/i],
  },
  {
    key: "bayut",
    label: "Bayut",
    description: "Autofills price, address, location, city, property type, bedrooms, bathrooms, area, description, and photos for UAE properties.",
    hostPatterns: [/^(.*\.)?bayut\.com$/i, /^(.*\.)?bayut\.ae$/i],
  },
  {
    key: "propertyfinder",
    label: "Property Finder",
    description: "Autofills price, address, location, city, property type, bedrooms, bathrooms, area, description, and photos for UAE properties.",
    hostPatterns: [/^(.*\.)?propertyfinder\.ae$/i, /^(.*\.)?propertyfinder\.com$/i],
  },
  {
    key: "dubizzle",
    label: "Dubizzle",
    description: "Autofills price, address, location, city, property type, bedrooms, bathrooms, area, description, and photos for UAE properties.",
    hostPatterns: [/^(.*\.)?dubizzle\.com$/i, /^(.*\.)?dubizzle\.ae$/i],
  },
  {
    key: "propsearch",
    label: "Propsearch",
    description: "Autofills price, address, location, city, property type, bedrooms, bathrooms, area, description, and photos for UAE properties.",
    hostPatterns: [/^(.*\.)?propsearch\.ae$/i, /^(.*\.)?propsearch\.com$/i],
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

