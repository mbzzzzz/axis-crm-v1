import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy initialization to avoid build-time errors when env vars are not available
let supabaseClient: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  return supabaseClient;
}

// Export a getter function instead of direct client to avoid build-time initialization
export function getSupabase() {
  return getSupabaseClient();
}

const BUCKET_NAME = 'property-images';

/**
 * Upload a file to Supabase Storage
 * @param file - File to upload
 * @param userId - User ID for folder organization
 * @param propertyId - Property ID (optional, for existing properties)
 * @returns Public URL of uploaded file
 */
export async function uploadPropertyImage(
  file: File,
  userId: string,
  propertyId?: number
): Promise<string> {
  try {
    // Create unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${propertyId || 'new'}/${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    // Upload file
    const supabase = getSupabase();
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      throw new Error('Failed to get public URL');
    }

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}

/**
 * Delete an image from Supabase Storage
 * @param imageUrl - Public URL of the image to delete
 */
export async function deletePropertyImage(imageUrl: string): Promise<void> {
  try {
    // Extract file path from URL
    const urlParts = imageUrl.split('/');
    const filePath = urlParts.slice(urlParts.indexOf(BUCKET_NAME) + 1).join('/');

    const supabase = getSupabase();
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
}

/**
 * Upload multiple images
 */
export async function uploadPropertyImages(
  files: File[],
  userId: string,
  propertyId?: number
): Promise<string[]> {
  const uploadPromises = files.map((file) => uploadPropertyImage(file, userId, propertyId));
  return Promise.all(uploadPromises);
}

