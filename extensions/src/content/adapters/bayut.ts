import type { AutofillAdapter, AutofillPayload } from "./types";
import { setInputValue, setSelectValue, uploadImages, waitForSelector } from "./utils";
import { findFieldByType } from "./field-detection";
import { highlightField } from "./field-highlight";
import { getPlatformRequirements } from "./image-validation";

async function fillBayutForm(payload: AutofillPayload) {
  console.log("AXIS Autofill: Starting Bayut form fill", payload.property);
  
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

    // Fill Location/Address
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

    // Fill Area/Size
    await new Promise((resolve) => setTimeout(resolve, 300));
    if (property.sizeSqft) {
      const areaInput = await waitForSelector('input[placeholder*="Area" i], input[placeholder*="Size" i], input[placeholder*="Sqft" i], input[name*="area" i]');
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
        'button:has-text("' + property.bedrooms + '")',
      ];
      let bedroomInput: HTMLElement | null = null;
      for (const selector of bedroomSelectors) {
        bedroomInput = document.querySelector(selector);
        if (bedroomInput) break;
      }
      if (!bedroomInput) {
        const buttons = Array.from(document.querySelectorAll("button"));
        bedroomInput = buttons.find((btn) => btn.textContent?.trim() === String(property.bedrooms)) || null;
      }
      if (bedroomInput) {
        if (bedroomInput instanceof HTMLInputElement || bedroomInput instanceof HTMLSelectElement) {
          bedroomInput.value = String(property.bedrooms);
          bedroomInput.dispatchEvent(new Event("change", { bubbles: true }));
        } else if (bedroomInput instanceof HTMLButtonElement) {
          bedroomInput.click();
        }
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
      if (!bathroomInput) {
        const buttons = Array.from(document.querySelectorAll("button"));
        bathroomInput = buttons.find((btn) => btn.textContent?.trim() === String(bathroomCount)) || null;
      }
      if (bathroomInput) {
        if (bathroomInput instanceof HTMLInputElement || bathroomInput instanceof HTMLSelectElement) {
          bathroomInput.value = String(bathroomCount);
          bathroomInput.dispatchEvent(new Event("change", { bubbles: true }));
        } else if (bathroomInput instanceof HTMLButtonElement) {
          bathroomInput.click();
        }
      }
    }

    // Enhanced image upload with Bayut-specific requirements
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (property.images?.length) {
      const requirements = getPlatformRequirements('bayut');
      
      // Check minimum image requirement
      if (property.images.length < requirements.minCount) {
        console.warn(`AXIS Autofill: Bayut requires minimum ${requirements.minCount} images, but only ${property.images.length} provided`);
      }

      const uploadBtn = Array.from(document.querySelectorAll("button")).find((btn) =>
        btn.textContent?.toLowerCase().includes("upload") || 
        btn.textContent?.toLowerCase().includes("image") ||
        btn.textContent?.toLowerCase().includes("photo") ||
        btn.getAttribute('data-testid')?.toLowerCase().includes('upload')
      );
      
      if (uploadBtn) {
        (uploadBtn as HTMLButtonElement).click();
        await new Promise((resolve) => setTimeout(resolve, 1000));
        
        const uploadResult = await uploadImages('input[type="file"]', property.images, 'bayut');
        
        if (uploadResult.success) {
          console.log(`AXIS Autofill: Successfully uploaded ${uploadResult.uploadedCount} images to Bayut`);
        } else {
          console.warn(`AXIS Autofill: Image upload issues: ${uploadResult.errors.join(', ')}`);
        }
      } else {
        // Try direct upload without button click
        const uploadResult = await uploadImages('input[type="file"]', property.images, 'bayut');
        if (!uploadResult.success) {
          console.warn(`AXIS Autofill: Could not find upload button and direct upload failed`);
        }
      }
    }
    
    console.log("AXIS Autofill: Bayut form fill completed successfully");
  } catch (error) {
    console.error("AXIS Autofill: Bayut form fill failed", error);
    throw error;
  }
}

const BayutAdapter: AutofillAdapter = {
  key: "bayut",
  matches: (location) => location.hostname.includes("bayut.com") || location.hostname.includes("bayut.ae"),
  apply: fillBayutForm,
};

export default BayutAdapter;

