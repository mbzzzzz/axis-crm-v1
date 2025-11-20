# PowerShell script to test with Newman (Postman CLI)

Write-Host "🧪 Testing AXIS CRM Properties API with Newman (Postman CLI)" -ForegroundColor Cyan
Write-Host ""

# Check if server is running
Write-Host "1️⃣ Checking if server is running..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method Head -TimeoutSec 2 -ErrorAction Stop
    Write-Host "✅ Server is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Server is not running!" -ForegroundColor Red
    Write-Host "💡 Start the server with: npm run dev" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "2️⃣ Running Postman collection tests..." -ForegroundColor Yellow
Write-Host ""

# Run Newman with the collection
$collectionPath = "postman/axis-crm-properties.postman_collection.json"
$environmentPath = "postman/axis-crm.postman_environment.json"

if (-not (Test-Path $collectionPath)) {
    Write-Host "❌ Collection file not found: $collectionPath" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $environmentPath)) {
    Write-Host "⚠️  Environment file not found: $environmentPath" -ForegroundColor Yellow
    Write-Host "   Running without environment file..." -ForegroundColor Yellow
    newman run $collectionPath --reporters cli,json --reporter-json-export newman-results.json
} else {
    newman run $collectionPath -e $environmentPath --reporters cli,json --reporter-json-export newman-results.json
}

Write-Host ""
Write-Host "Test results saved to: newman-results.json" -ForegroundColor Green

