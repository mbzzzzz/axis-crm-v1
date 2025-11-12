# Clerk Middleware Fix for Upload Error

## Issue
Error when uploading: `Clerk: auth() was called but Clerk can't detect usage of clerkMiddleware()`

## Root Cause
In Clerk v6, the middleware callback needs to be `async` and `auth.protect()` needs to be awaited. The middleware was missing the `async` keyword and `await` for `auth.protect()`.

## Fix Applied

### Updated `middleware.ts`

**Before:**
```typescript
export default clerkMiddleware((auth, request) => {
  if (!isPublicRoute(request)) {
    auth.protect();
  }
});
```

**After:**
```typescript
export default clerkMiddleware(async (auth, request) => {
  // Protect all routes except public ones
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});
```

## Changes Made

1. ✅ Made middleware callback `async`
2. ✅ Added `await` to `auth.protect()`
3. ✅ Added comment for clarity

## Why This Fixes the Issue

In Clerk v6:
- The middleware callback must be `async` when using `auth.protect()`
- `auth.protect()` is an async function and must be awaited
- Without `await`, Clerk can't properly detect that the middleware is protecting routes
- This causes the error when `currentUser()` is called in API routes

## Testing

After restarting the dev server:
1. Navigate to properties page
2. Click "Add Property"
3. Try uploading an image
4. The upload should work without the middleware error

## Important Notes

- **Restart Required**: You must restart the Next.js dev server for middleware changes to take effect
- **Middleware Location**: The middleware is at the root level (`middleware.ts`), which is correct for Next.js even with a `src` directory
- **API Routes**: All API routes use `currentUser()` correctly, which requires the middleware to run first

## Verification

To verify the fix:
1. Check that the middleware file has `async` and `await`
2. Restart the dev server
3. Test image upload functionality
4. No more Clerk middleware errors should occur

