# Building APK for Testing

## Option 1: EAS Build (Cloud Build - Recommended)

### Step 1: Login to EAS
```bash
cd mobile
npx eas-cli login
```
Enter your Expo account email and password. If you don't have an account, create one at https://expo.dev

### Step 2: Build APK
```bash
npx eas-cli build --platform android --profile preview
```

This will:
- Build an APK file in the cloud
- Take about 10-15 minutes
- Provide a download link when complete

### Step 3: Download APK
After the build completes, you'll get a download link. Download the APK file and install it on your Android device.

---

## Option 2: Local Build (Requires Android Studio)

### Prerequisites
1. Install Android Studio: https://developer.android.com/studio
2. Set up Android SDK and environment variables
3. Install Java JDK

### Build Command
```bash
cd mobile
npx expo run:android --variant release
```

This will:
- Build APK locally
- Output location: `android/app/build/outputs/apk/release/app-release.apk`

---

## Option 3: Development Build (Quick Testing)

For quick testing without building APK:

```bash
cd mobile
npm start
```

Then:
- Install Expo Go app on your Android device
- Scan the QR code to run the app

---

## Environment Setup

Make sure you have a `.env` file in the `mobile/` directory:

```env
EXPO_PUBLIC_API_URL=https://axis-crm-v1.vercel.app
```

---

## Troubleshooting

### EAS Build Issues
- Make sure you're logged in: `npx eas-cli whoami`
- Check your `eas.json` configuration
- Verify `app.json` has correct Android package name

### Local Build Issues
- Ensure Android Studio is installed
- Set ANDROID_HOME environment variable
- Run `npx expo prebuild` first if needed

### Build Fails
- Check that all dependencies are installed: `npm install`
- Clear cache: `npx expo start -c`
- Check for TypeScript errors: `npx tsc --noEmit`

