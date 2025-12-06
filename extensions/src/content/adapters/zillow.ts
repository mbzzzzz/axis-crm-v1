import type { AutofillAdapter, AutofillPayload } from "./types";
import { setInputValue, uploadImages, waitForSelector } from "./utils";

async function fillZillowForm(payload: AutofillPayload) {
  console.log("AXIS Autofill: Starting Zillow form fill", payload.property);
  
  try {
    const { property } = payload;
    
    // Validate required fields
  const requiredFields = {
    price: property.price,
    address: property.address,
    city: property.city,
    state: property.state,
    zipCode: property.zipCode,
  };
  
  const missingFields = Object.entries(requiredFields)
    .filter(([_, value]) => value === null || value === undefined || (typeof value === "string" && value.trim() === ""))
    .map(([key]) => key);
  
  if (missingFields.length > 0) {
    const errorMsg = `Missing required fields: ${missingFields.join(", ")}`;
    console.warn("Zillow autofill validation failed:", errorMsg);
    throw new Error(errorMsg);
  }
  
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
      const uploadResult = await uploadImages('input[type="file"][accept*="image"]', property.images, 'zillow');
      if (uploadResult.success) {
        console.log(`AXIS Autofill: Successfully uploaded ${uploadResult.uploadedCount} images to Zillow`);
      } else if (uploadResult.errors.length > 0) {
        console.warn(`AXIS Autofill: Image upload issues: ${uploadResult.errors.join(', ')}`);
      }
    }
    
    console.log("AXIS Autofill: Zillow form fill completed successfully");
  } catch (error) {
    console.error("AXIS Autofill: Zillow form fill failed", error);
    throw error;
  }
}

const ZillowAdapter: AutofillAdapter = {
  key: "zillow",
  matches: (location) => location.hostname.includes("zillow.com"),
  apply: fillZillowForm,
};

export default ZillowAdapter;

