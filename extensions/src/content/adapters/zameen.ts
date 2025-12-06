import type { AutofillAdapter, AutofillPayload } from "./types";
import { setInputValue, setSelectValue, uploadImages, waitForSelector } from "./utils";
import { findFieldByType } from "./field-detection";
import { highlightField } from "./field-highlight";
import { handleMultiStepUpload } from "./image-upload-patterns";

function clickButtonByText(text: string, partial = false): boolean {
  const buttons = Array.from(document.querySelectorAll("button"));
  const match = buttons.find((btn) => {
    const btnText = btn.textContent?.trim() || "";
    return partial ? btnText.includes(text) : btnText === text;
  });
  if (match) {
    match.click();
    return true;
  }
  return false;
}

function selectPropertyType(type: string) {
  const typeMap: Record<string, string> = {
    residential: "House",
    multi_family: "House",
    commercial: "Commercial",
    land: "Plots",
  };
  const targetType = typeMap[type] || "House";
  clickButtonByText(targetType, true);
}

function selectPurpose(status: string) {
  const purpose = status === "rented" || status === "available" ? "Rent" : "Sell";
  clickButtonByText(purpose, true);
}

async function fillZameenForm(payload: AutofillPayload) {
  console.log("AXIS Autofill: Starting Zameen form fill", payload.property);
  
  try {
    const { property } = payload;

    await waitForSelector("body", 2000);

  selectPurpose(property.status);

  await new Promise((resolve) => setTimeout(resolve, 300));

  selectPropertyType(property.propertyType);

  await new Promise((resolve) => setTimeout(resolve, 300));

  // Fill Title using universal field detection
  const titleField = findFieldByType('propertyTitle', true);
  if (titleField && property.title) {
    if (titleField instanceof HTMLInputElement || titleField instanceof HTMLTextAreaElement) {
      titleField.focus();
      titleField.value = property.title;
      titleField.dispatchEvent(new Event("input", { bubbles: true }));
      titleField.dispatchEvent(new Event("change", { bubbles: true }));
      highlightField(titleField);
    }
  } else {
    setInputValue('input[placeholder*="title" i], input[placeholder*="Title" i]', property.title);
  }

  // Fill Description using universal field detection
  const descField = findFieldByType('description', true);
  if (descField && property.description) {
    if (descField instanceof HTMLTextAreaElement || descField instanceof HTMLInputElement) {
      descField.focus();
      descField.value = property.description;
      descField.dispatchEvent(new Event("input", { bubbles: true }));
      descField.dispatchEvent(new Event("change", { bubbles: true }));
      highlightField(descField);
    }
  } else {
    setInputValue(
      'textarea[placeholder*="description" i], textarea[placeholder*="Describe" i]',
      property.description ?? ""
    );
  }

  const cityInput = await waitForSelector('input[placeholder*="City" i], input[placeholder*="Select City" i]');
  if (cityInput) {
    (cityInput as HTMLInputElement).focus();
    (cityInput as HTMLInputElement).value = property.city;
    (cityInput as HTMLInputElement).dispatchEvent(new Event("input", { bubbles: true }));
    (cityInput as HTMLInputElement).dispatchEvent(new Event("change", { bubbles: true }));
  }

  const locationInput = await waitForSelector('input[placeholder*="Location" i], input[placeholder*="Search Location" i]');
  if (locationInput) {
    (locationInput as HTMLInputElement).value = `${property.address}, ${property.city}`;
    (locationInput as HTMLInputElement).dispatchEvent(new Event("input", { bubbles: true }));
    (locationInput as HTMLInputElement).dispatchEvent(new Event("change", { bubbles: true }));
  }

  const priceInput = await waitForSelector('input[placeholder*="Price" i], input[placeholder*="Enter Price" i]');
  if (priceInput) {
    (priceInput as HTMLInputElement).value = String(property.price);
    (priceInput as HTMLInputElement).dispatchEvent(new Event("input", { bubbles: true }));
    (priceInput as HTMLInputElement).dispatchEvent(new Event("change", { bubbles: true }));
  }

  const areaInput = await waitForSelector('input[placeholder*="Area" i], input[placeholder*="Unit" i]');
  if (areaInput && property.sizeSqft) {
    (areaInput as HTMLInputElement).value = String(property.sizeSqft);
    (areaInput as HTMLInputElement).dispatchEvent(new Event("input", { bubbles: true }));
    (areaInput as HTMLInputElement).dispatchEvent(new Event("change", { bubbles: true }));
  }

  // Find the filter panel container for bedrooms/bathrooms
  const filterPanel = document.querySelector('[class*="filter"], [class*="Filter"], [data-testid*="filter"], section[aria-label*="filter" i]') as HTMLElement | null;
  const searchContainer = filterPanel || document.body;

  if (property.bedrooms) {
    const bedroomBtn = Array.from(searchContainer.querySelectorAll("button")).find((btn) => {
      const text = btn.textContent?.trim();
      const matchesText = text === String(property.bedrooms);
      if (filterPanel) {
        return matchesText && filterPanel.contains(btn);
      }
      return matchesText;
    });
    if (bedroomBtn) {
      bedroomBtn.click();
    }
  }

  if (property.bathrooms != null) {
    const bathroomCount = Math.floor(property.bathrooms);
    const bathroomBtn = Array.from(searchContainer.querySelectorAll("button")).find((btn) => {
      const text = btn.textContent?.trim();
      const matchesText = text === String(bathroomCount);
      if (filterPanel) {
        return matchesText && filterPanel.contains(btn);
      }
      return matchesText;
    });
    if (bathroomBtn) {
      bathroomBtn.click();
    }
  }

    // Enhanced image upload with multi-step support
    if (property.images?.length) {
      console.log(`AXIS Autofill: Starting image upload for ${property.images.length} images`);
      
      // Try to find upload button
      const uploadBtn = Array.from(document.querySelectorAll("button")).find((btn) =>
        btn.textContent?.toLowerCase().includes("upload image") ||
        btn.textContent?.toLowerCase().includes("add photo") ||
        btn.textContent?.toLowerCase().includes("add image")
      );
      
      if (uploadBtn) {
        (uploadBtn as HTMLButtonElement).click();
        await new Promise((resolve) => setTimeout(resolve, 800));
      }

      // Try direct upload first
      const uploadResult = await uploadImages('input[type="file"]', property.images, 'zameen');
      
      // If direct upload failed or only partial success, try multi-step
      if (!uploadResult.success || uploadResult.uploadedCount < property.images.length) {
        console.log("AXIS Autofill: Attempting multi-step upload for remaining images");
        
        // Convert URLs to Files for multi-step upload
        const remainingUrls = property.images.slice(uploadResult.uploadedCount);
        if (remainingUrls.length > 0) {
          // Fetch remaining images
          const files: File[] = [];
          for (const url of remainingUrls) {
            try {
              const response = await fetch(url, { mode: 'cors' });
              const blob = await response.blob();
              const fileName = url.split("/").pop()?.split("?")[0] || `axis-image-${Date.now()}.jpg`;
              files.push(new File([blob], fileName, { type: blob.type || "image/jpeg" }));
            } catch (error) {
              console.warn(`AXIS Autofill: Failed to fetch image for multi-step: ${url}`, error);
            }
          }

          if (files.length > 0) {
            const multiStepResult = await handleMultiStepUpload(files, 5, 10);
            console.log(`AXIS Autofill: Multi-step upload completed: ${multiStepResult.uploadedCount} images`);
          }
        }
      }
    }
    
    console.log("AXIS Autofill: Zameen form fill completed successfully");
  } catch (error) {
    console.error("AXIS Autofill: Zameen form fill failed", error);
    throw error;
  }
}

const ZameenAdapter: AutofillAdapter = {
  key: "zameen",
  matches: (location) => location.hostname.includes("zameen.com") || location.hostname.includes("profolio.zameen.com"),
  apply: fillZameenForm,
};

export default ZameenAdapter;

