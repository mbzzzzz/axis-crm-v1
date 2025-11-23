# Mobile App Setup Guide

## Prerequisites

1. **Node.js** (v18 or higher)
2. **Expo CLI**: `npm install -g expo-cli`
3. **iOS Simulator** (Mac only) or **Android Studio** (for Android)

## Installation Steps

1. **Navigate to mobile directory:**
   ```bash
   cd mobile
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   Create a `.env` file in the `mobile/` directory:
   ```env
   EXPO_PUBLIC_API_URL=https://axis-crm-v1.vercel.app
   ```

4. **Start the development server:**
   ```bash
   npm start
   ```

5. **Run on device/simulator:**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on your phone

## Project Structure

```
mobile/
├── app/
│   ├── _layout.tsx          # Root layout
│   ├── (auth)/
│   │   ├── _layout.tsx      # Auth stack
│   │   └── login.tsx        # Login screen
│   └── (tabs)/
│       ├── _layout.tsx      # Bottom tabs
│       ├── index.tsx        # Home/Dashboard
│       ├── maintenance.tsx  # Maintenance requests
│       └── payments.tsx     # Invoices/Payments
├── assets/                  # Images, icons
├── global.css              # NativeWind styles
└── package.json
```

## API Endpoints Required

The mobile app requires these backend API endpoints:

1. **Authentication:**
   - `POST /api/auth/tenant/login` - Tenant login

2. **Tenant Data:**
   - `GET /api/tenants/mobile?id={id}` - Get tenant with property

3. **Invoices:**
   - `GET /api/invoices/mobile?tenantEmail={email}` - Get tenant invoices

4. **Maintenance:**
   - `GET /api/maintenance/mobile?tenantId={id}` - Get requests
   - `POST /api/maintenance/mobile` - Create request

## Environment Variables

**Backend (.env.local):**
```env
JWT_SECRET=your-secret-jwt-key-here
```

**Mobile (.env):**
```env
EXPO_PUBLIC_API_URL=https://axis-crm-v1.vercel.app
```

## Notes

- The app uses **JWT tokens** for authentication (separate from Clerk)
- Tenants authenticate with their **email** (must exist in `tenants` table)
- Password authentication is currently simplified (TODO: implement proper hashing)
- All API endpoints verify JWT tokens before returning data

## Troubleshooting

1. **"Module not found" errors:**
   - Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`

2. **Metro bundler issues:**
   - Clear cache: `expo start -c`

3. **NativeWind not working:**
   - Ensure `babel.config.js` includes NativeWind preset
   - Restart Metro bundler

4. **API connection errors:**
   - Verify `EXPO_PUBLIC_API_URL` is set correctly
   - Check backend server is running
   - Verify CORS settings on backend

