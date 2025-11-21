import type { AxisPropertyRecord, ExtensionTheme } from "@axis/shared/types";
import type { ListingSiteKey } from "../../site-config";

export type AutofillPayload = {
  property: AxisPropertyRecord;
  theme: ExtensionTheme | null;
};

export type AutofillAdapter = {
  key: ListingSiteKey;
  matches(location: Location): boolean;
  apply(payload: AutofillPayload): Promise<void>;
};

