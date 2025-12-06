import type { AutofillAdapter, AutofillPayload } from "./types";
import { setInputValue, setSelectValue, uploadImages, waitForSelector } from "./utils";

async function fillPropsearchForm(payload: AutofillPayload) {
  console.log("AXIS Autofill: Starting Propsearch form fill", payload.property);
  
  try {
    const { property } = payload;

    await waitForSelector("body", 2000);

    // Fill Title
    await new Promise((resolve) => setTimeout(resolve, 300));
    setInputValue('input[placeholder*="title" i], input[placeholder*="Title" i], input[name*="title" i]', property.title);

    // Fill Description
    setInputValue(
      'textarea[placeholder*="description" i], textarea[placeholder*="Describe" i], textarea[name*="description" i]',
      property.description ?? ""
    );

    // Fill Location
    await new Promise((resolve) => setTimeout(resolve, 300));
    const locationInput = await waitForSelector('input[placeholder*="Location" i], input[placeholder*="Address" i], input[placeholder*="Area" i], input[name*="location" i]');
    if (locationInput) {
      const fullAddress = `${property.address}, ${property.city}${property.state ? `, ${property.state}` : ''}`.trim();
      (locationInput as HTMLInputElement).focus();
      (locationInput as HTMLInputElement).value = fullAddress;
      (locationInput as HTMLInputElement).dispatchEvent(new Event("input", { bubbles: true }));
      (locationInput as HTMLInputElement).dispatchEvent(new Event("change", { bubbles: true }));
    }

    // Fill Price
    await new Promise((resolve) => setTimeout(resolve, 300));
    const priceInput = await waitForSelector('input[placeholder*="Price" i], input[placeholder*="AED" i], input[name*="price" i]');
    if (priceInput && property.price) {
      (priceInput as HTMLInputElement).value = String(property.price);
      (priceInput as HTMLInputElement).dispatchEvent(new Event("input", { bubbles: true }));
      (priceInput as HTMLInputElement).dispatchEvent(new Event("change", { bubbles: true }));
    }

    // Fill Area
    await new Promise((resolve) => setTimeout(resolve, 300));
    if (property.sizeSqft) {
      const areaInput = await waitForSelector('input[placeholder*="Area" i], input[placeholder*="Size" i], input[name*="area" i]');
      if (areaInput) {
        (areaInput as HTMLInputElement).value = String(property.sizeSqft);
        (areaInput as HTMLInputElement).dispatchEvent(new Event("input", { bubbles: true }));
        (areaInput as HTMLInputElement).dispatchEvent(new Event("change", { bubbles: true }));
      }
    }

    // Fill Bedrooms
    await new Promise((resolve) => setTimeout(resolve, 300));
    if (property.bedrooms) {
      const bedroomSelectors = [
        'select[name*="bedroom" i]',
        'input[name*="bedroom" i]',
      ];
      let bedroomInput: HTMLElement | null = null;
      for (const selector of bedroomSelectors) {
        bedroomInput = document.querySelector(selector);
        if (bedroomInput) break;
      }
      if (bedroomInput instanceof HTMLInputElement || bedroomInput instanceof HTMLSelectElement) {
        bedroomInput.value = String(property.bedrooms);
        bedroomInput.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }

    // Fill Bathrooms
    await new Promise((resolve) => setTimeout(resolve, 300));
    if (property.bathrooms) {
      const bathroomCount = Math.floor(property.bathrooms);
      const bathroomSelectors = [
        'select[name*="bathroom" i]',
        'input[name*="bathroom" i]',
      ];
      let bathroomInput: HTMLElement | null = null;
      for (const selector of bathroomSelectors) {
        bathroomInput = document.querySelector(selector);
        if (bathroomInput) break;
      }
      if (bathroomInput instanceof HTMLInputElement || bathroomInput instanceof HTMLSelectElement) {
        bathroomInput.value = String(bathroomCount);
        bathroomInput.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }

    // Upload Images
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (property.images?.length) {
      const uploadResult = await uploadImages('input[type="file"]', property.images, 'propsearch');
      if (uploadResult.success) {
        console.log(`AXIS Autofill: Successfully uploaded ${uploadResult.uploadedCount} images to Propsearch`);
      } else if (uploadResult.errors.length > 0) {
        console.warn(`AXIS Autofill: Image upload issues: ${uploadResult.errors.join(', ')}`);
      }
    }
    
    console.log("AXIS Autofill: Propsearch form fill completed successfully");
  } catch (error) {
    console.error("AXIS Autofill: Propsearch form fill failed", error);
    throw error;
  }
}

const PropsearchAdapter: AutofillAdapter = {
  key: "propsearch",
  matches: (location) => location.hostname.includes("propsearch.ae") || location.hostname.includes("propsearch.com"),
  apply: fillPropsearchForm,
};

export default PropsearchAdapter;

