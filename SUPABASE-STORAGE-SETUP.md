# Supabase Storage Setup Guide

This guide will help you set up Supabase Storage for property image uploads.

## Prerequisites

- Supabase project created (see `SUPABASE-SETUP.md`)
- Environment variables configured in `.env.local`

## Step 1: Create Storage Bucket

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Storage** in the left sidebar
4. Click **New bucket**
5. Configure the bucket:
   - **Name:** `property-images`
   - **Public bucket:** ✅ Enable (so images can be accessed via public URLs)
   - **File size limit:** 5 MB (or your preferred limit)
   - **Allowed MIME types:** `image/jpeg, image/jpg, image/png, image/webp`
6. Click **Create bucket**

## Step 2: Set Up Storage Policies (Row Level Security)

1. In the Storage section, click on the `property-images` bucket
2. Go to **Policies** tab
3. Create a policy for **INSERT** (upload):
   - Policy name: `Allow authenticated users to upload`
   - Allowed operation: `INSERT`
   - Policy definition:
   ```sql
   (bucket_id = 'property-images'::text) AND (auth.role() = 'authenticated'::text)
   ```
4. Create a policy for **SELECT** (read):
   - Policy name: `Allow public read access`
   - Allowed operation: `SELECT`
   - Policy definition:
   ```sql
   bucket_id = 'property-images'::text
   ```
5. Create a policy for **DELETE**:
   - Policy name: `Allow users to delete their own files`
   - Allowed operation: `DELETE`
   - Policy definition:
   ```sql
   (bucket_id = 'property-images'::text) AND (auth.role() = 'authenticated'::text) AND (storage.foldername(name))[1] = auth.uid()::text
   ```

## Step 3: Verify Environment Variables

Ensure your `.env.local` file has:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Step 4: Test Image Upload

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to the properties page
3. Create or edit a property
4. Try uploading an image using the image upload component

## Troubleshooting

### Error: "Bucket not found"
- Verify the bucket name is exactly `property-images`
- Check that the bucket is created in the correct Supabase project

### Error: "New row violates row-level security policy"
- Check that storage policies are correctly configured
- Ensure the user is authenticated (logged in via Clerk)

### Images not displaying
- Verify the bucket is set to **Public**
- Check that the public URL is correctly generated
- Ensure Next.js Image component is configured (see `next.config.ts`)

### Upload fails with 413 error
- Check file size limits in bucket settings
- Verify the file is under 5MB (or your configured limit)

## File Structure

Images are stored with the following structure:
```
property-images/
  └── {userId}/
      └── {propertyId or 'new'}/
          └── {timestamp}-{random}.{ext}
```

This structure:
- Organizes images by user
- Groups images by property
- Uses unique filenames to prevent conflicts

## Security Notes

- All uploads are authenticated (require user login)
- Users can only delete their own files (enforced by RLS policy)
- File types are validated (only images allowed)
- File sizes are limited (5MB default)

