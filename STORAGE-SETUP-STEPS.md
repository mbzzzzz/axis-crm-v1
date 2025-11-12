# Storage Bucket Setup - Step-by-Step Guide

## Overview
You need to create a storage bucket named `property-images` and set up 3 policies for secure file access.

---

## Step 1: Create the Storage Bucket

1. **Navigate to Storage:**
   - Go to [Supabase Dashboard](https://supabase.com/dashboard/project/mzmcibaxgelkndbvopwa)
   - Click **Storage** in the left sidebar
   - Click **Buckets** tab

2. **Create New Bucket:**
   - Click **New bucket** button
   - Fill in the details:
     - **Name:** `property-images` (exactly this name - case sensitive)
     - **Public bucket:** ✅ **Enable this** (check the box)
     - **File size limit:** `5` MB (or leave default)
     - **Allowed MIME types:** `image/jpeg, image/jpg, image/png, image/webp`
   - Click **Create bucket**

---

## Step 2: Create INSERT Policy (Upload Permission)

This allows authenticated users to upload images.

1. **Open Policies:**
   - Click on the `property-images` bucket
   - Go to **Policies** tab
   - Click **New Policy** or **Add Policy**

2. **Configure INSERT Policy:**
   - **Policy name:** `Allow authenticated users to upload`
   - **Allowed operation:** ✅ Check **INSERT** only
   - **Target roles:** Leave as default (or select "authenticated" if available)
   - **Policy definition:** Enter this SQL:
     ```sql
     bucket_id = 'property-images' AND auth.role() = 'authenticated'
     ```
   - Click **Review** then **Save**

**What this does:** Allows logged-in users (via Clerk) to upload files to the bucket.

---

## Step 3: Create SELECT Policy (Public Read Access)

This allows anyone to view/download images (public URLs).

1. **Add Another Policy:**
   - Still in the **Policies** tab
   - Click **New Policy** again

2. **Configure SELECT Policy:**
   - **Policy name:** `Allow public read access`
   - **Allowed operation:** ✅ Check **SELECT** only
   - **Target roles:** Leave as default (public)
   - **Policy definition:** Enter this SQL:
     ```sql
     bucket_id = 'property-images'
     ```
   - Click **Review** then **Save**

**What this does:** Makes all images in the bucket publicly accessible via URLs (needed for displaying images in your app).

---

## Step 4: Create DELETE Policy (User-Specific Delete)

This allows users to delete only their own files.

1. **Add Third Policy:**
   - Still in the **Policies** tab
   - Click **New Policy** again

2. **Configure DELETE Policy:**
   - **Policy name:** `Allow users to delete their own files`
   - **Allowed operation:** ✅ Check **DELETE** only
   - **Target roles:** Leave as default (or select "authenticated" if available)
   - **Policy definition:** Enter this SQL:
     ```sql
     bucket_id = 'property-images' AND auth.role() = 'authenticated' AND (storage.foldername(name))[1] = auth.uid()::text
     ```
   - Click **Review** then **Save**

**What this does:** Users can only delete files in folders that match their user ID (enforces ownership).

---

## Step 5: Verify Setup

1. **Check Bucket:**
   - Go to **Storage** → **Buckets**
   - Verify `property-images` exists and is marked as **Public**

2. **Check Policies:**
   - Click on `property-images` bucket
   - Go to **Policies** tab
   - You should see 3 policies:
     - ✅ Allow authenticated users to upload (INSERT)
     - ✅ Allow public read access (SELECT)
     - ✅ Allow users to delete their own files (DELETE)

3. **Test Upload (Optional):**
   - Try uploading an image through your application
   - Verify the image appears in the bucket
   - Check that the public URL works

---

## Policy SQL Reference

### INSERT Policy (Upload)
```sql
bucket_id = 'property-images' AND auth.role() = 'authenticated'
```

### SELECT Policy (Public Read)
```sql
bucket_id = 'property-images'
```

### DELETE Policy (User-Specific)
```sql
bucket_id = 'property-images' AND auth.role() = 'authenticated' AND (storage.foldername(name))[1] = auth.uid()::text
```

---

## Troubleshooting

### Policy Not Working?
- **Check bucket name:** Must be exactly `property-images` (case-sensitive)
- **Check authentication:** User must be logged in via Clerk
- **Check role:** Policy should use `auth.role() = 'authenticated'`

### Images Not Displaying?
- **Verify bucket is public:** Check the "Public bucket" setting
- **Check SELECT policy:** Must allow public read access
- **Verify URL format:** Should be `https://[project].supabase.co/storage/v1/object/public/property-images/...`

### Upload Fails?
- **Check INSERT policy:** Must be enabled for authenticated users
- **Check file size:** Must be under 5MB
- **Check file type:** Only JPEG, PNG, WebP allowed

### Delete Fails?
- **Check DELETE policy:** Must match user's folder structure
- **Verify file path:** Files should be in `{userId}/{propertyId}/filename` format

---

## File Structure

Images are stored with this structure:
```
property-images/
  └── {userId}/              ← Clerk user ID
      └── {propertyId}/      ← Property ID or 'new'
          └── {timestamp}.{ext}
```

Example:
```
property-images/
  └── user_abc123/
      └── 456/
          └── 1700000000000.jpg
```

This structure:
- Organizes files by user
- Groups images by property
- Prevents filename conflicts
- Enables user-specific delete policies

---

## Security Notes

✅ **What's Secure:**
- Only authenticated users can upload
- Users can only delete their own files
- File types are restricted to images
- File sizes are limited (5MB)

✅ **What's Public:**
- Image URLs are publicly accessible (needed for displaying in app)
- Anyone with the URL can view the image
- This is intentional for property listings

---

## Quick Checklist

- [ ] Bucket `property-images` created
- [ ] Bucket set to **Public**
- [ ] INSERT policy created (authenticated users)
- [ ] SELECT policy created (public read)
- [ ] DELETE policy created (user-specific)
- [ ] All policies saved and active
- [ ] Test upload works
- [ ] Test image display works

---

**Once complete, your storage is ready for property image uploads!** 🎉

