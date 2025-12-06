/**
 * Hybrid Image Storage System
 * Manages image storage with size limits and fallback strategies
 */

import browser from "webextension-polyfill";

const MAX_ITEM_SIZE = 9 * 1024 * 1024; // 9MB (leave 1MB buffer for chrome.storage.local 10MB limit)
const MAX_THUMBNAIL_SIZE_KB = 200; // 200KB per thumbnail
const IMAGE_STORAGE_PREFIX = "axis:images:";
const IMAGE_THUMBNAILS_PREFIX = "axis:thumbnails:";

/**
 * Compress base64 image to target size
 */
export async function compressImage(
  base64: string,
  maxSizeKB: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // Calculate target dimensions to achieve desired file size
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      
      // Start with quality 0.8 and reduce if needed
      let quality = 0.8;
      let compressed = '';
      
      // Try different quality levels
      for (let q = quality; q >= 0.3; q -= 0.1) {
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        compressed = canvas.toDataURL('image/jpeg', q);
        
        // Check size (base64 is ~33% larger than binary)
        const sizeKB = (compressed.length * 3) / 4 / 1024;
        if (sizeKB <= maxSizeKB) {
          resolve(compressed);
          return;
        }
        
        // If still too large, reduce dimensions
        width = Math.floor(width * 0.9);
        height = Math.floor(height * 0.9);
      }
      
      // If still too large, return the smallest we got
      resolve(compressed || base64);
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = base64;
  });
}

/**
 * Convert URL to base64 (for local files or CORS-enabled URLs)
 */
export async function convertUrlToBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    throw new Error(`Failed to convert URL to base64: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Store images with size management
 * Uses hybrid approach: URLs as primary, compressed thumbnails as fallback
 */
export async function storeImages(
  propertyId: number,
  images: string[]
): Promise<void> {
  if (!images.length) {
    return;
  }

  const storageKey = `${IMAGE_STORAGE_PREFIX}${propertyId}`;
  const thumbnailKey = `${IMAGE_THUMBNAILS_PREFIX}${propertyId}`;

  // Primary storage: URLs (lightweight)
  try {
    await browser.storage.local.set({
      [storageKey]: images,
    });
  } catch (error) {
    console.warn('AXIS Autofill: Failed to store image URLs', error);
  }

  // Fallback: Compressed thumbnails (for offline/local files)
  // Only store thumbnails if URLs might not work (local files, etc.)
  const thumbnails: string[] = [];
  
  for (const image of images) {
    // Skip if it's already a data URL (base64)
    if (image.startsWith('data:')) {
      try {
        const compressed = await compressImage(image, MAX_THUMBNAIL_SIZE_KB);
        thumbnails.push(compressed);
      } catch (error) {
        console.warn('AXIS Autofill: Failed to compress thumbnail', error);
      }
    } else if (image.startsWith('blob:') || image.startsWith('file:')) {
      // Local file - convert to base64 and compress
      try {
        const base64 = await convertUrlToBase64(image);
        const compressed = await compressImage(base64, MAX_THUMBNAIL_SIZE_KB);
        thumbnails.push(compressed);
      } catch (error) {
        console.warn('AXIS Autofill: Failed to process local file', error);
      }
    }
    // For HTTP/HTTPS URLs, we don't store thumbnails (use URLs directly)
  }

  // Store thumbnails if we have any
  if (thumbnails.length > 0) {
    try {
      // Check size before storing
      const thumbnailsSize = JSON.stringify(thumbnails).length;
      if (thumbnailsSize < MAX_ITEM_SIZE) {
        await browser.storage.local.set({
          [thumbnailKey]: thumbnails,
        });
      } else {
        console.warn('AXIS Autofill: Thumbnails too large, skipping storage');
      }
    } catch (error) {
      console.warn('AXIS Autofill: Failed to store thumbnails', error);
    }
  }
}

/**
 * Retrieve images with fallback logic
 */
export async function retrieveImages(propertyId: number): Promise<string[]> {
  const storageKey = `${IMAGE_STORAGE_PREFIX}${propertyId}`;
  const thumbnailKey = `${IMAGE_THUMBNAILS_PREFIX}${propertyId}`;

  const data = await browser.storage.local.get([storageKey, thumbnailKey]);

  // Primary: Use URLs if available
  const urls = data[storageKey] as string[] | undefined;
  if (urls && urls.length > 0) {
    return urls;
  }

  // Fallback: Use thumbnails if URLs not available
  const thumbnails = data[thumbnailKey] as string[] | undefined;
  if (thumbnails && thumbnails.length > 0) {
    return thumbnails;
  }

  return [];
}

/**
 * Clean up old/unused images
 */
export async function cleanupImages(activePropertyIds: number[]): Promise<void> {
  const allData = await browser.storage.local.get(null);
  const keysToRemove: string[] = [];

  for (const key in allData) {
    if (key.startsWith(IMAGE_STORAGE_PREFIX) || key.startsWith(IMAGE_THUMBNAILS_PREFIX)) {
      const propertyId = parseInt(key.split(':').pop() || '0', 10);
      if (!activePropertyIds.includes(propertyId)) {
        keysToRemove.push(key);
      }
    }
  }

  if (keysToRemove.length > 0) {
    await browser.storage.local.remove(keysToRemove);
    console.log(`AXIS Autofill: Cleaned up ${keysToRemove.length} unused image storage keys`);
  }
}

