/**
 * Image Upload Patterns
 * Handles different upload UI patterns across platforms
 */

import { findFileInputsInShadowDOM } from './shadow-dom-utils';

export type UploadPattern = 'direct' | 'hidden' | 'drag-drop' | 'multi-step';

export interface UploadResult {
  success: boolean;
  pattern: UploadPattern;
  uploadedCount: number;
  error?: string;
}

/**
 * Pattern 1: Direct File Input
 * Upload directly to visible file input
 */
export function uploadToDirectInput(inputElement: HTMLInputElement, imageFiles: File[]): boolean {
  try {
    const dataTransfer = new DataTransfer();
    
    imageFiles.forEach(file => {
      dataTransfer.items.add(file);
    });
    
    inputElement.files = dataTransfer.files;
    
    // Trigger change events
    inputElement.dispatchEvent(new Event('change', { bubbles: true }));
    inputElement.dispatchEvent(new Event('input', { bubbles: true }));
    
    return true;
  } catch (error) {
    console.error('AXIS Autofill: Direct input upload failed', error);
    return false;
  }
}

/**
 * Pattern 2: Hidden Input + Button Click
 * Find upload trigger button and associated hidden input
 */
export async function uploadViaHiddenInput(imageFiles: File[]): Promise<boolean> {
  const uploadButtonSelectors = [
    'button:contains("Upload")',
    'button:contains("Add Photo")',
    'button[data-action="upload"]',
    '.upload-button',
    '[role="button"][aria-label*="upload" i]',
  ];

  // Find buttons by text content
  const buttons = Array.from(document.querySelectorAll('button'));
  const uploadButton = buttons.find(btn => {
    const text = btn.textContent?.toLowerCase() || '';
    return text.includes('upload') || text.includes('add photo') || text.includes('add image');
  });

  if (!uploadButton) {
    // Try data attributes
    const dataButton = document.querySelector('button[data-action="upload"], button[data-testid*="upload"]');
    if (dataButton) {
      (dataButton as HTMLButtonElement).click();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Find associated hidden input
      const hiddenInput = findFileInputsInShadowDOM()[0] ||
                         document.querySelector<HTMLInputElement>('input[type="file"][style*="display: none"], input[type="file"][hidden]');
      
      if (hiddenInput) {
        return uploadToDirectInput(hiddenInput, imageFiles);
      }
    }
    return false;
  }

  (uploadButton as HTMLButtonElement).click();
  await new Promise(resolve => setTimeout(resolve, 500));

  // Find associated hidden input
  const hiddenInput = findFileInputsInShadowDOM()[0] ||
                     document.querySelector<HTMLInputElement>('input[type="file"][style*="display: none"], input[type="file"][hidden]') ||
                     uploadButton.nextElementSibling?.querySelector<HTMLInputElement>('input[type="file"]') ||
                     uploadButton.querySelector<HTMLInputElement>('input[type="file"]');

  if (hiddenInput) {
    return uploadToDirectInput(hiddenInput, imageFiles);
  }

  return false;
}

/**
 * Pattern 3: Drag & Drop Zones
 * Upload via drag and drop event
 */
export function uploadToDragDropZone(imageFiles: File[]): boolean {
  const dropZoneSelectors = [
    '[data-drop-zone]',
    '.dropzone',
    '[ondrop]',
    '[data-upload-area]',
    '.file-upload-area',
  ];

  let dropZone: HTMLElement | null = null;

  for (const selector of dropZoneSelectors) {
    try {
      dropZone = document.querySelector<HTMLElement>(selector);
      if (dropZone) break;
    } catch {
      continue;
    }
  }

  if (!dropZone) {
    return false;
  }

  try {
    const dataTransfer = new DataTransfer();
    imageFiles.forEach(file => dataTransfer.items.add(file));

    // Create drag events
    const dragEnterEvent = new DragEvent('dragenter', {
      bubbles: true,
      cancelable: true,
      dataTransfer: dataTransfer,
    });

    const dragOverEvent = new DragEvent('dragover', {
      bubbles: true,
      cancelable: true,
      dataTransfer: dataTransfer,
    });

    const dropEvent = new DragEvent('drop', {
      bubbles: true,
      cancelable: true,
      dataTransfer: dataTransfer,
    });

    dropZone.dispatchEvent(dragEnterEvent);
    dropZone.dispatchEvent(dragOverEvent);
    dropZone.dispatchEvent(dropEvent);

    return true;
  } catch (error) {
    console.error('AXIS Autofill: Drag-drop upload failed', error);
    return false;
  }
}

/**
 * Pattern 4: Multi-Step Upload
 * Upload images in batches with "Add More" button clicks
 */
export async function handleMultiStepUpload(
  imageFiles: File[],
  maxBatchSize = 5,
  maxSteps = 10
): Promise<{ success: boolean; uploadedCount: number }> {
  let currentStep = 0;
  let totalUploaded = 0;

  async function uploadNextBatch(): Promise<void> {
    if (currentStep >= maxSteps || totalUploaded >= imageFiles.length) {
      return;
    }

    // Find current upload input
    const uploadInputs = findFileInputsInShadowDOM();
    const uploadInput = uploadInputs[0] || document.querySelector<HTMLInputElement>('input[type="file"]');

    if (!uploadInput) {
      // Try clicking "Add More" button
      const addMoreButtons = Array.from(document.querySelectorAll('button')).find(btn => {
        const text = btn.textContent?.toLowerCase() || '';
        return text.includes('add more') || text.includes('upload more') || text.includes('add photos');
      });

      if (addMoreButtons) {
        (addMoreButtons as HTMLButtonElement).click();
        await new Promise(resolve => setTimeout(resolve, 800));
        return uploadNextBatch();
      }
      return;
    }

    // Upload current batch
    const batchStart = currentStep * maxBatchSize;
    const batchEnd = Math.min(batchStart + maxBatchSize, imageFiles.length);
    const batch = imageFiles.slice(batchStart, batchEnd);

    if (batch.length > 0) {
      const success = uploadToDirectInput(uploadInput, batch);
      if (success) {
        totalUploaded += batch.length;
        console.log(`AXIS Autofill: Uploaded batch ${currentStep + 1} (${batch.length} images)`);
      }

      currentStep++;
      
      // Wait before next batch
      if (totalUploaded < imageFiles.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return uploadNextBatch();
      }
    }
  }

  await uploadNextBatch();

  return {
    success: totalUploaded > 0,
    uploadedCount: totalUploaded,
  };
}

/**
 * Detect which upload pattern to use
 */
export function detectUploadPattern(): UploadPattern {
  // Check for drag-drop zones first
  const dropZones = document.querySelectorAll('[data-drop-zone], .dropzone, [ondrop]');
  if (dropZones.length > 0) {
    return 'drag-drop';
  }

  // Check for hidden inputs with buttons
  const uploadButtons = Array.from(document.querySelectorAll('button')).filter(btn => {
    const text = btn.textContent?.toLowerCase() || '';
    return text.includes('upload') || text.includes('add photo');
  });

  if (uploadButtons.length > 0) {
    const hiddenInput = document.querySelector<HTMLInputElement>('input[type="file"][style*="display: none"], input[type="file"][hidden]');
    if (hiddenInput) {
      return 'hidden';
    }
  }

  // Check for visible file inputs
  const visibleInputs = findFileInputsInShadowDOM().filter(input => {
    const style = window.getComputedStyle(input);
    return style.display !== 'none' && !input.hidden;
  });

  if (visibleInputs.length > 0) {
    return 'direct';
  }

  // Default to multi-step if we can't determine
  return 'multi-step';
}

