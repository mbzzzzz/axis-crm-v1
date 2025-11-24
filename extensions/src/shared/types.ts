import type { CardTheme } from "@/lib/card-themes";
import type { ListingSiteKey } from "../site-config";

export type AxisPropertyRecord = {
  id: number;
  title: string;
  description?: string | null;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  propertyType: string;
  status: string;
  price: number;
  currency?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  sizeSqft?: number | null;
  amenities?: string[] | null;
  images?: string[] | null;
};

export type ExtensionTheme = {
  key: string;
  data: CardTheme;
};

export type SyncStatus = "idle" | "loading" | "error" | "success";

export type ExtensionSettings = {
  apiBaseUrl: string;
  lastSyncAt?: string;
};

export type ExtensionState = {
  theme: ExtensionTheme | null;
  properties: AxisPropertyRecord[];
  selectedPropertyId: number | null;
  settings: ExtensionSettings;
  status: SyncStatus;
  error?: string;
};

export type RuntimeMessage =
  | { type: "GET_STATE" }
  | { type: "SYNC_DATA" }
  | { type: "SET_SELECTED_PROPERTY"; payload: number | null }
  | { type: "GET_SELECTED_PROPERTY" }
  | { type: "AUTOFILL_ACTIVE_TAB"; site?: ListingSiteKey }
  | { type: "UPDATE_SETTINGS"; payload: Partial<ExtensionSettings> };

export type RuntimeMessageResponse =
  | { ok: true; type: "STATE"; state: ExtensionState }
  | { ok: true; type: "PROPERTY"; property: AxisPropertyRecord | null; theme: ExtensionTheme | null }
  | { ok: true; type: "MESSAGE"; message: string }
  | { ok: false; type: "ERROR"; error: string; code?: string };

