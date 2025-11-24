import type { AutofillAdapter, AutofillPayload } from "./types";
import { setInputValue, setSelectValue, uploadImages, waitForSelector } from "./utils";

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

  setInputValue('input[placeholder*="title" i], input[placeholder*="Title" i]', property.title);

  setInputValue(
    'textarea[placeholder*="description" i], textarea[placeholder*="Describe" i]',
    property.description ?? ""
  );

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

    if (property.images?.length) {
      const uploadBtn = Array.from(document.querySelectorAll("button")).find((btn) =>
        btn.textContent?.toLowerCase().includes("upload image")
      );
      if (uploadBtn) {
        (uploadBtn as HTMLButtonElement).click();
        await new Promise((resolve) => setTimeout(resolve, 500));
        await uploadImages('input[type="file"]', property.images);
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

