# Additional Features Setup Instructions

## 1. Lease PDF Storage in Supabase Storage

### Create Storage Bucket

1. Go to your Supabase Dashboard
2. Navigate to **Storage** → **Buckets**
3. Click **New Bucket**
4. Name: `lease-documents`
5. Public: **Yes** (or configure RLS policies if you prefer private)
6. Click **Create**

### Configure RLS Policies (if bucket is private)

If you set the bucket to private, add these policies:

```sql
-- Allow authenticated users to upload lease documents
CREATE POLICY "Users can upload lease documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'lease-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow users to read their own lease documents
CREATE POLICY "Users can read their lease documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'lease-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow tenants to read their lease documents (via service role)
-- This is handled server-side, so no RLS needed if using service role key
```

### Environment Variables

Ensure these are set:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (for server-side uploads)

**Note:** The code uses `SUPABASE_SERVICE_ROLE_KEY` if available, otherwise falls back to `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## 2. Email Notifications

### Resend Setup

1. Sign up at [resend.com](https://resend.com)
2. Get your API key from the dashboard
3. Verify your domain (or use the test domain)
4. Set environment variables:

```env
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com
RESEND_FROM_NAME=AXIS CRM
```

### Email Notifications Configured

The following notifications are automatically sent:

- **Lease Signing**: When tenant or owner signs a lease
- **Late Fees**: When late fees are applied to overdue invoices
- **Recurring Invoices**: When new invoices are generated from recurring templates
- **Tenant Registration**: When property manager sends registration invitation

### Testing Emails

Emails are sent automatically but won't fail the main operation if email sending fails. Check logs for any email errors.

## 3. Tenant Registration Link Generation

### How It Works

1. Property manager clicks the **UserPlus** icon next to a tenant in the tenants page
2. System generates a secure registration link with JWT token
3. Link expires in 7 days
4. Property manager can:
   - Copy the link manually
   - Send email directly to tenant

### Environment Variables

Set this for production:
```env
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

If not set, the system will try to use `VERCEL_URL` or default to `localhost:3000`.

### Registration Flow

1. Tenant receives link via email or manual sharing
2. Tenant clicks link → redirected to `/tenant-portal/register?tenantId=X&token=Y`
3. System validates token
4. Tenant creates password
5. Account is created and tenant can login

### Security

- Tokens expire after 7 days
- Tokens are tied to specific tenant ID and email
- Tokens cannot be reused after registration
- Email must match tenant record

## Testing Checklist

- [ ] Create `lease-documents` bucket in Supabase Storage
- [ ] Set `RESEND_API_KEY` environment variable
- [ ] Set `RESEND_FROM_EMAIL` environment variable
- [ ] Set `NEXT_PUBLIC_APP_URL` for production
- [ ] Test lease signing → PDF should upload to storage
- [ ] Test late fee cron job → Email should be sent
- [ ] Test recurring invoice generation → Email should be sent
- [ ] Test tenant registration link generation
- [ ] Test sending registration email
- [ ] Test tenant registration with token

## Troubleshooting

### Lease PDF Not Uploading

- Check Supabase Storage bucket exists: `lease-documents`
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set
- Check bucket permissions (public or RLS policies)
- Review server logs for upload errors

### Emails Not Sending

- Verify `RESEND_API_KEY` is set correctly
- Check Resend dashboard for email status
- Verify `RESEND_FROM_EMAIL` is verified in Resend
- Check server logs for email errors
- Note: Email failures don't break the main operation

### Registration Links Not Working

- Verify `NEXT_PUBLIC_APP_URL` is set correctly
- Check token expiration (7 days)
- Verify tenant email matches token email
- Check server logs for token validation errors

## Next Steps

1. **Set up Supabase Storage bucket** - Create `lease-documents` bucket
2. **Configure Resend** - Get API key and verify domain
3. **Set environment variables** - Add all required env vars
4. **Test features** - Test each feature end-to-end
5. **Deploy** - Push to production

All features are implemented and ready to use once the above setup is complete!

