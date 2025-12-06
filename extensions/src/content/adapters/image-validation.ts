/**
 * Image Validation
 * Validates images before upload with platform-specific requirements
 */

export interface ImageRequirements {
  minCount: number;
  maxCount: number;
  minDimension: number;
  maxFileSizeMB: number;
  allowedTypes: string[];
  notes?: string;
}

export interface ValidationError {
  imageIndex: number;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  validFiles: File[];
}

const PLATFORM_REQUIREMENTS: Record<string, ImageRequirements> = {
  zameen: {
    minCount: 5,
    maxCount: 50,
    minDimension: 600,
    maxFileSizeMB: 5,
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png'],
    notes: 'Images auto-watermarked by Zameen',
  },
  bayut: {
    minCount: 10,
    maxCount: 50,
    minDimension: 600,
    maxFileSizeMB: 5,
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png'],
    notes: 'Need minimum 10 quality photos for TruCheck verification, preferred size 900x600',
  },
  dubizzle: {
    minCount: 3,
    maxCount: 50,
    minDimension: 600,
    maxFileSizeMB: 5,
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png'],
    notes: 'No watermarks, company names, or phone numbers on images',
  },
  zillow: {
    minCount: 4,
    maxCount: 50,
    minDimension: 600,
    maxFileSizeMB: 5,
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png'],
    notes: 'Professional photos recommended for better visibility',
  },
  realtor: {
    minCount: 4,
    maxCount: 50,
    minDimension: 600,
    maxFileSizeMB: 5,
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png'],
    notes: 'High-quality photos recommended',
  },
  propertyfinder: {
    minCount: 5,
    maxCount: 50,
    minDimension: 600,
    maxFileSizeMB: 5,
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png'],
  },
  propsearch: {
    minCount: 3,
    maxCount: 50,
    minDimension: 600,
    maxFileSizeMB: 5,
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png'],
  },
  generic: {
    minCount: 3,
    maxCount: 50,
    minDimension: 600,
    maxFileSizeMB: 5,
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png'],
  },
};

/**
 * Get platform-specific requirements
 */
export function getPlatformRequirements(platform: string): ImageRequirements {
  return PLATFORM_REQUIREMENTS[platform.toLowerCase()] || PLATFORM_REQUIREMENTS.generic;
}

/**
 * Validate a single image file
 */
export async function validateImageFile(
  file: File,
  requirements: ImageRequirements,
  index: number
): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];

  // Check file type
  if (!requirements.allowedTypes.includes(file.type)) {
    errors.push({
      imageIndex: index,
      message: `Invalid format (${file.type}). Use JPG or PNG.`,
    });
  }

  // Check file size
  const sizeMB = file.size / (1024 * 1024);
  if (sizeMB > requirements.maxFileSizeMB) {
    errors.push({
      imageIndex: index,
      message: `Too large (${sizeMB.toFixed(2)}MB). Maximum ${requirements.maxFileSizeMB}MB.`,
    });
  }

  // Check image dimensions
  try {
    const dimensions = await getImageDimensions(file);
    if (dimensions.width < requirements.minDimension || dimensions.height < requirements.minDimension) {
      errors.push({
        imageIndex: index,
        message: `Too small (${dimensions.width}x${dimensions.height}px). Minimum ${requirements.minDimension}x${requirements.minDimension}px.`,
      });
    }
  } catch (error) {
    errors.push({
      imageIndex: index,
      message: 'Could not read image dimensions. File may be corrupted.',
    });
  }

  return errors;
}

/**
 * Get image dimensions from file
 */
function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Validate all images for a platform
 */
export async function validateImages(
  files: File[],
  platform: string
): Promise<ValidationResult> {
  const requirements = getPlatformRequirements(platform);
  const errors: ValidationError[] = [];
  const validFiles: File[] = [];

  // Check count
  if (files.length < requirements.minCount) {
    errors.push({
      imageIndex: -1,
      message: `Minimum ${requirements.minCount} images required. You have ${files.length}.`,
    });
  }

  if (files.length > requirements.maxCount) {
    errors.push({
      imageIndex: -1,
      message: `Maximum ${requirements.maxCount} images allowed. You have ${files.length}.`,
    });
  }

  // Validate each file
  for (let i = 0; i < files.length; i++) {
    const fileErrors = await validateImageFile(files[i], requirements, i);
    if (fileErrors.length === 0) {
      validFiles.push(files[i]);
    } else {
      errors.push(...fileErrors);
    }
  }

  return {
    valid: errors.length === 0 && validFiles.length >= requirements.minCount,
    errors,
    validFiles,
  };
}

