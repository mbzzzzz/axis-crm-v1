bi# Authentication Architecture - Complete Solution

## Problem Identified

The extension sync issue was **NOT** caused by mixing tenant and agent authentication. They are already properly separated:

- **Agents**: Use Supabase Auth (`auth.users` table) - cookie-based sessions
- **Tenants**: Use custom `tenant_auth` table - JWT token-based (stored in localStorage)

## Root Cause

The extension couldn't access Supabase session cookies due to:
1. **Cookie domain/path restrictions** - Supabase cookies are set with specific domain/path attributes
2. **HttpOnly cookies** - While browser.cookies API can access them, domain matching is strict
3. **Cross-origin restrictions** - Extension context has limited cookie access

## Solution: Extension API Token System

Instead of relying on cookies, we've implemented a **dedicated API token system** for extensions:

### How It Works

1. **User logs into dashboard** (Supabase Auth)
2. **Extension requests token** from `/api/auth/extension-token`
3. **Server generates unique token** and stores it in `user_preferences.extension_token`
4. **Extension stores token** in extension storage (not cookies)
5. **Extension uses token** in `Authorization: Bearer <token>` header for all API calls
6. **API routes check token first**, then fall back to cookie-based auth

### Benefits

✅ **No cookie dependency** - Works regardless of cookie restrictions
✅ **Secure** - Tokens are unique, long (64 hex chars), and stored in database
✅ **Persistent** - Token doesn't expire (user can regenerate if needed)
✅ **Isolated** - Separate from web app authentication
✅ **Simple** - Extension just needs to store and send one token

## Database Changes

### Migration Applied
```sql
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS extension_token TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS user_preferences_extension_token_idx 
  ON user_preferences(extension_token) WHERE extension_token IS NOT NULL;
```

## API Endpoints

### 1. Get Extension Token
**GET** `/api/auth/extension-token`
- Requires: Supabase session (cookie-based auth)
- Returns: `{ token: string }`
- Generates new token if doesn't exist, returns existing if present

### 2. Verify Extension Token
**POST** `/api/auth/extension-token`
- Body: `{ token: string }`
- Returns: `{ authenticated: boolean, userId: string }`

## Code Changes

### 1. Extension Token Endpoint (`src/app/api/auth/extension-token/route.ts`)
- Generates secure random tokens
- Stores in `user_preferences.extension_token`
- Verifies tokens for API authentication

### 2. API Auth Helper (`src/lib/api-auth.ts`)
- Added `getAuthenticatedUserFromExtensionToken()` function
- Checks extension token before falling back to cookie auth

### 3. Properties API (`src/app/api/properties/route.ts`)
- Updated to accept extension tokens in `Authorization: Bearer <token>` header
- Falls back to cookie-based auth if no token provided

### 4. Database Schema (`src/db/schema-postgres.ts`)
- Added `extensionToken` field to `userPreferences` table

## Extension Implementation (Next Steps)

The extension needs to be updated to:

1. **On first sync or when token missing:**
   - Call `GET /api/auth/extension-token` (with cookies)
   - Store token in extension storage
   
2. **On all API calls:**
   - Include `Authorization: Bearer <token>` header
   - Remove cookie dependency

3. **Token refresh:**
   - If API returns 401, try getting new token
   - If that fails, prompt user to log in again

## Security Considerations

✅ **Token is unique** - 64 hex characters (256 bits of entropy)
✅ **Stored securely** - In database, not in cookies
✅ **One per user** - Each user has one extension token
✅ **Can be regenerated** - User can get new token (invalidates old one)
✅ **Database indexed** - Fast lookups

## Testing

1. **Generate token:**
   ```bash
   curl -X GET https://your-domain.com/api/auth/extension-token \
     -H "Cookie: sb-xxx-auth-token=..."
   ```

2. **Use token:**
   ```bash
   curl -X GET https://your-domain.com/api/properties \
     -H "Authorization: Bearer <token>"
   ```

## Migration Path

1. ✅ Database migration applied
2. ✅ API endpoints created
3. ✅ API routes updated to accept tokens
4. ⏳ Extension code needs update (next step)

## Why This Solves the Problem

- **No cookie access needed** - Extension uses token in header
- **Works across domains** - Token works regardless of cookie domain
- **Persistent** - Token stored in extension storage, not cookies
- **Secure** - Token is unique and tied to user account
- **Simple** - One token, one header, works everywhere

