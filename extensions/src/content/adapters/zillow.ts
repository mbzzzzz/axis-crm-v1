import type { AutofillAdapter, AutofillPayload } from "./types";
import { setInputValue, uploadImages, waitForSelector } from "./utils";

async function fillZillowForm(payload: AutofillPayload) {
  const { property } = payload;
  setInputValue('input[name="price"]', property.price);
  setInputValue('input[name="streetAddress"]', property.address);
  setInputValue('input[name="city"]', property.city);
  setInputValue('input[name="state"]', property.state);
  setInputValue('input[name="zipCode"]', property.zipCode);
  setInputValue('textarea[name="description"]', property.description ?? "");
  setInputValue('input[name="bedrooms"]', property.bedrooms ?? "");
  setInputValue('input[name="bathrooms"]', property.bathrooms ?? "");
  setInputValue('input[name="squareFeet"]', property.sizeSqft ?? "");

  const photoSection = await waitForSelector('input[type="file"][accept*="image"]');
  if (photoSection && property.images?.length) {
    await uploadImages('input[type="file"][accept*="image"]', property.images);
  }
}

const ZillowAdapter: AutofillAdapter = {
  key: "zillow",
  matches: (location) => location.hostname.includes("zillow.com"),
  apply: fillZillowForm,
};

export default ZillowAdapter;

