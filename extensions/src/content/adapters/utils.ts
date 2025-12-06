export function setInputValue(selector: string, value: string | number | undefined | null) {
  const element = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector);
  if (!element || value === undefined || value === null) return;
  
  // Focus the element first (React forms often need this)
  element.focus();
  
  // Get native value setter
  const nativeDescriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(element), "value");
  
  // Set the value using native setter to bypass React's value tracking
  if (nativeDescriptor?.set) {
    nativeDescriptor.set.call(element, String(value));
  } else {
    element.value = String(value);
  }
  
  // Trigger all possible events that React might be listening to
  const events = [
    new Event("input", { bubbles: true, cancelable: true }),
    new Event("change", { bubbles: true, cancelable: true }),
    new KeyboardEvent("keydown", { bubbles: true, cancelable: true }),
    new KeyboardEvent("keyup", { bubbles: true, cancelable: true }),
  ];
  
  events.forEach(event => {
    element.dispatchEvent(event);
  });
  
  // Also trigger React's synthetic events by creating a custom event
  const reactEvent = new Event("input", { bubbles: true, cancelable: true });
  Object.defineProperty(reactEvent, "target", { value: element, enumerable: true });
  element.dispatchEvent(reactEvent);
  
  // Blur to trigger validation if needed
  element.blur();
  element.focus();
}

import { findFileInputsInShadowDOM } from './shadow-dom-utils';
import { validateImages, getPlatformRequirements } from './image-validation';
import {
  detectUploadPattern,
  uploadToDirectInput,
  uploadViaHiddenInput,
  uploadToDragDropZone,
  handleMultiStepUpload,
} from './image-upload-patterns';

export function setSelectValue(selector: string, value: string | undefined | null) {
  const element = document.querySelector<HTMLSelectElement>(selector);
  if (!element || !value) return;
  element.value = value;
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
}

export async function uploadImages(
  selector: string,
  urls: string[],
  platform?: string
): Promise<{ success: boolean; uploadedCount: number; errors: string[] }> {
  if (!urls.length) {
    console.log("AXIS Autofill: No images to upload");
    return { success: false, uploadedCount: 0, errors: ['No images provided'] };
  }

  // Find file input (check Shadow DOM if not found in regular DOM)
  let input = document.querySelector<HTMLInputElement>(selector);
  if (!input) {
    const shadowInputs = findFileInputsInShadowDOM();
    input = shadowInputs[0] || null;
  }

  if (!input) {
    console.warn(`AXIS Autofill: Image input not found for selector: ${selector}`);
    return { success: false, uploadedCount: 0, errors: ['File input not found'] };
  }

  console.log(`AXIS Autofill: Found image input, uploading ${urls.length} images`);

  const dataTransfer = new DataTransfer();
  const FETCH_TIMEOUT = 15000;
  const errors: string[] = [];
  let successCount = 0;
  let failCount = 0;
  const files: File[] = [];

  // Fetch and convert URLs to Files
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    try {
      console.log(`AXIS Autofill: Fetching image ${i + 1}/${urls.length}: ${url}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

      const response = await fetch(url, {
        signal: controller.signal,
        mode: 'cors',
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const blob = await response.blob();
      const fileName = url.split("/").pop()?.split("?")[0] || `axis-image-${Date.now()}-${i}.jpg`;
      const file = new File([blob], fileName, { type: blob.type || "image/jpeg" });
      files.push(file);
      successCount++;
      console.log(`AXIS Autofill: Image ${i + 1} fetched successfully`);
    } catch (error) {
      failCount++;
      const errorMsg = `Failed to fetch image ${i + 1}: ${error instanceof Error ? error.message : String(error)}`;
      errors.push(errorMsg);
      console.warn(`AXIS Autofill: ${errorMsg}`);
    }
  }

  if (files.length === 0) {
    return { success: false, uploadedCount: 0, errors };
  }

  // Validate images if platform is specified
  if (platform) {
    console.log(`AXIS Autofill: Validating ${files.length} images for platform: ${platform}`);
    const validation = await validateImages(files, platform);
    
    if (!validation.valid) {
      validation.errors.forEach(err => {
        errors.push(`Image ${err.imageIndex + 1}: ${err.message}`);
      });
    }

    if (validation.validFiles.length === 0) {
      return { success: false, uploadedCount: 0, errors };
    }

    // Use only valid files
    files.splice(0, files.length, ...validation.validFiles);
    console.log(`AXIS Autofill: ${validation.validFiles.length} valid images after validation`);
  }

  // Try different upload patterns
  const uploadPattern = detectUploadPattern();
  console.log(`AXIS Autofill: Detected upload pattern: ${uploadPattern}`);

  let uploadSuccess = false;
  let uploadedCount = 0;

  try {
    switch (uploadPattern) {
      case 'direct':
        uploadSuccess = uploadToDirectInput(input, files);
        uploadedCount = uploadSuccess ? files.length : 0;
        break;

      case 'hidden':
        uploadSuccess = await uploadViaHiddenInput(files);
        uploadedCount = uploadSuccess ? files.length : 0;
        break;

      case 'drag-drop':
        uploadSuccess = uploadToDragDropZone(files);
        uploadedCount = uploadSuccess ? files.length : 0;
        break;

      case 'multi-step':
        const result = await handleMultiStepUpload(files);
        uploadSuccess = result.success;
        uploadedCount = result.uploadedCount;
        break;
    }
  } catch (error) {
    const errorMsg = `Upload failed: ${error instanceof Error ? error.message : String(error)}`;
    errors.push(errorMsg);
    console.error(`AXIS Autofill: ${errorMsg}`);
  }

  if (uploadSuccess && uploadedCount > 0) {
    console.log(`AXIS Autofill: Successfully uploaded ${uploadedCount}/${files.length} images`);
  } else {
    console.error(`AXIS Autofill: Failed to upload images (pattern: ${uploadPattern})`);
    if (errors.length === 0) {
      errors.push(`Upload failed using ${uploadPattern} pattern`);
    }
  }

  return {
    success: uploadSuccess && uploadedCount > 0,
    uploadedCount,
    errors,
  };
}

export function waitForSelector(selector: string, timeout = 8000): Promise<Element | null> {
  return new Promise((resolve) => {
    const existing = document.querySelector(selector);
    if (existing) {
      resolve(existing);
      return;
    }

    const observer = new MutationObserver(() => {
      const match = document.querySelector(selector);
      if (match) {
        observer.disconnect();
        resolve(match);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeout);
  });
}

