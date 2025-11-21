export type ListingSiteKey = "zillow" | "zameen" | "realtor";

export type FieldMapping = {
  selector: string;
  attribute?: "value" | "innerText" | "textContent";
};

export type SiteAdapterConfig = {
  key: ListingSiteKey;
  label: string;
  hostPatterns: RegExp[];
};

export const SUPPORTED_SITES: SiteAdapterConfig[] = [
  {
    key: "zillow",
    label: "Zillow",
    hostPatterns: [/\.zillow\.com$/i, /^www\.zillow\.com$/i],
  },
  {
    key: "zameen",
    label: "Zameen",
    hostPatterns: [/\.zameen\.com$/i, /^zameen\.com$/i],
  },
  {
    key: "realtor",
    label: "Realtor",
    hostPatterns: [/\.realtor\.com$/i, /^www\.realtor\.com$/i],
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

