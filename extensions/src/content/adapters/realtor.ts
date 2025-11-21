import type { AutofillAdapter, AutofillPayload } from "./types";
import { setInputValue, setSelectValue, uploadImages } from "./utils";

async function fillRealtorForm(payload: AutofillPayload) {
  const { property } = payload;
  setInputValue('input[name="listing_price"]', property.price);
  setInputValue('input[name="address_line1"]', property.address);
  setInputValue('input[name="city"]', property.city);
  setSelectValue('select[name="state"]', property.state);
  setInputValue('input[name="postal_code"]', property.zipCode);
  setInputValue('textarea[name="remarks"]', property.description ?? "");
  setInputValue('input[name="bedrooms"]', property.bedrooms ?? "");
  setInputValue('input[name="bathrooms"]', property.bathrooms ?? "");
  setInputValue('input[name="sqft"]', property.sizeSqft ?? "");

  if (property.images?.length) {
    await uploadImages('input[type="file"][name="photos"]', property.images);
  }
}

const RealtorAdapter: AutofillAdapter = {
  key: "realtor",
  matches: (location) => location.hostname.includes("realtor.com"),
  apply: fillRealtorForm,
};

export default RealtorAdapter;

