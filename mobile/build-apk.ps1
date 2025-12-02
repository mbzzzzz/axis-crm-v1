# Build APK Script for Windows PowerShell
# This script helps build the Android APK for testing

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Axis CRM Mobile - APK Build Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the mobile directory
if (-not (Test-Path "app.json")) {
    Write-Host "Error: Please run this script from the mobile/ directory" -ForegroundColor Red
    exit 1
}

# Check if EAS CLI is available
Write-Host "Checking EAS CLI..." -ForegroundColor Yellow
$easVersion = npx eas-cli --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: EAS CLI not found. Installing..." -ForegroundColor Red
    npm install -g eas-cli
}

Write-Host "EAS CLI version: $easVersion" -ForegroundColor Green
Write-Host ""

# Check if logged in
Write-Host "Checking EAS login status..." -ForegroundColor Yellow
$whoami = npx eas-cli whoami 2>&1
if ($whoami -like "*Not logged in*") {
    Write-Host "You need to log in to EAS first." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please run:" -ForegroundColor Cyan
    Write-Host "  npx eas-cli login" -ForegroundColor White
    Write-Host ""
    Write-Host "Then run this script again, or run:" -ForegroundColor Cyan
    Write-Host "  npx eas-cli build --platform android --profile preview" -ForegroundColor White
    exit 1
}

Write-Host "Logged in as: $whoami" -ForegroundColor Green
Write-Host ""

# Check environment file
if (-not (Test-Path ".env")) {
    Write-Host "Creating .env file..." -ForegroundColor Yellow
    @"
EXPO_PUBLIC_API_URL=https://axis-crm-v1.vercel.app
"@ | Out-File -FilePath ".env" -Encoding utf8
    Write-Host ".env file created" -ForegroundColor Green
} else {
    Write-Host ".env file exists" -ForegroundColor Green
}

Write-Host ""
Write-Host "Starting APK build..." -ForegroundColor Cyan
Write-Host "This will take about 10-15 minutes..." -ForegroundColor Yellow
Write-Host ""

# Build APK
npx eas-cli build --platform android --profile preview

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Build completed successfully!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Check the output above for the download link." -ForegroundColor Cyan
    Write-Host "Download the APK and install it on your Android device." -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "Build failed. Check the error messages above." -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
}

