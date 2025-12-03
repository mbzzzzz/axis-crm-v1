import { createClient, SupabaseClient } from '@supabase/supabase-js';

const LEASE_BUCKET_NAME = 'lease-documents';

let supabaseClient: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing Supabase environment variables');
  }

  supabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return supabaseClient;
}

/**
 * Upload lease PDF to Supabase Storage
 * @param pdfBuffer - PDF file buffer
 * @param userId - User ID for folder organization
 * @param leaseId - Lease ID
 * @param leaseNumber - Lease number for filename
 * @returns Public URL of uploaded PDF
 */
export async function uploadLeasePDF(
  pdfBuffer: Buffer,
  userId: string,
  leaseId: number,
  leaseNumber: string
): Promise<string> {
  try {
    const supabase = getSupabaseClient();
    
    // Create unique filename
    const fileName = `${userId}/leases/${leaseId}/${leaseNumber}-${Date.now()}.pdf`;
    
    // Upload PDF
    const { data, error } = await supabase.storage
      .from(LEASE_BUCKET_NAME)
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: true, // Allow overwriting if exists
      });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(LEASE_BUCKET_NAME)
      .getPublicUrl(fileName);

    if (!urlData?.publicUrl) {
      throw new Error('Failed to get public URL');
    }

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading lease PDF:', error);
    throw error;
  }
}

/**
 * Delete lease PDF from Supabase Storage
 * @param documentUrl - Public URL of the document to delete
 */
export async function deleteLeasePDF(documentUrl: string): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    
    // Extract file path from URL
    const urlParts = documentUrl.split('/');
    const bucketIndex = urlParts.findIndex(part => part === LEASE_BUCKET_NAME);
    if (bucketIndex === -1) {
      throw new Error('Invalid document URL');
    }
    
    const filePath = urlParts.slice(bucketIndex + 1).join('/');

    const { error } = await supabase.storage
      .from(LEASE_BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }
  } catch (error) {
    console.error('Error deleting lease PDF:', error);
    throw error;
  }
}

