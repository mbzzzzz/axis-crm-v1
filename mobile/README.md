# Axis CRM Tenant Mobile App

React Native mobile application for tenants using Expo, NativeWind, and Expo Router.

## Setup Instructions

1. **Install Dependencies:**
   ```bash
   cd mobile
   npm install
   ```

2. **Configure Environment:**
   Create a `.env` file:
   ```env
   EXPO_PUBLIC_API_URL=https://axis-crm-v1.vercel.app
   ```

3. **Start Development Server:**
   ```bash
   npm start
   ```

4. **Run on Device:**
   - iOS: `npm run ios`
   - Android: `npm run android`
   - Web: `npm run web`

## Project Structure

```
mobile/
├── app/
│   ├── _layout.tsx          # Root layout with SafeAreaProvider
│   ├── (auth)/
│   │   ├── _layout.tsx      # Auth stack layout
│   │   └── login.tsx        # Login screen
│   └── (tabs)/
│       ├── _layout.tsx      # Bottom tab navigation
│       ├── index.tsx        # Home/Dashboard tab
│       ├── maintenance.tsx  # Maintenance requests tab
│       └── payments.tsx     # Payments/Invoices tab
├── components/              # Reusable components
├── assets/                  # Images, icons, etc.
├── global.css              # NativeWind styles
└── package.json
```

## Features

- ✅ Dark theme matching web app
- ✅ Tenant authentication
- ✅ Property dashboard with balance
- ✅ Maintenance request management
- ✅ Invoice viewing and PDF download
- ✅ Bottom tab navigation

## API Endpoints Required

The mobile app expects these API endpoints:
- `POST /api/auth/tenant/login` - Tenant authentication
- `GET /api/tenants/mobile?id={id}` - Get tenant data with property
- `GET /api/invoices/mobile?tenantEmail={email}` - Get tenant invoices
- `GET /api/maintenance/mobile?tenantId={id}` - Get maintenance requests
- `POST /api/maintenance/mobile` - Create maintenance request

