#!/bin/bash
# Test script using Newman (Postman CLI)

echo "🧪 Testing AXIS CRM Properties API with Newman (Postman CLI)"
echo ""

# Check if server is running
echo "1️⃣ Checking if server is running..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200\|404\|401"; then
    echo "✅ Server is running"
else
    echo "❌ Server is not running!"
    echo "💡 Start the server with: npm run dev"
    exit 1
fi

echo ""
echo "2️⃣ Running Postman collection tests..."
echo ""

# Run Newman with the collection
newman run postman/axis-crm-properties.postman_collection.json \
    -e postman/axis-crm.postman_environment.json \
    --reporters cli,json \
    --reporter-json-export newman-results.json

echo ""
echo "📊 Test results saved to: newman-results.json"

