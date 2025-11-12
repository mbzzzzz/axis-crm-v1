# Property Listing Test Documentation

## Test Overview

This document describes the property listing functionality and how to test it with mock data.

## Required Fields

When creating a property listing, the following fields are **required**:

1. **title** (string) - Property title/name
2. **address** (string) - Street address
3. **city** (string) - City name
4. **state** (string) - State/Province
5. **zipCode** (string) - Postal/ZIP code
6. **propertyType** (string) - Must be one of:
   - `residential`
   - `commercial`
   - `land`
   - `multi_family`
7. **status** (string) - Must be one of:
   - `available`
   - `under_contract`
   - `sold`
   - `rented`
   - `pending`
8. **price** (number) - Must be a positive number

## Optional Fields

- **description** (string) - Property description
- **currency** (string) - Currency code (defaults to 'USD')
- **sizeSqft** (number) - Property size in square feet
- **bedrooms** (number) - Number of bedrooms
- **bathrooms** (number) - Number of bathrooms
- **yearBuilt** (number) - Year the property was built
- **purchasePrice** (number) - Original purchase price
- **estimatedValue** (number) - Current estimated value
- **monthlyExpenses** (number) - Monthly maintenance expenses
- **commissionRate** (number) - Commission rate percentage
- **amenities** (string[]) - Array of amenity names
- **images** (string[]) - Array of image URLs

## Mock Property Data Example

```json
{
  "title": "Luxury Downtown Apartment",
  "description": "Beautiful 2-bedroom apartment in the heart of downtown with stunning city views.",
  "address": "123 Main Street",
  "city": "New York",
  "state": "NY",
  "zipCode": "10001",
  "propertyType": "residential",
  "status": "available",
  "price": 2500000,
  "currency": "USD",
  "sizeSqft": 1200,
  "bedrooms": 2,
  "bathrooms": 2,
  "yearBuilt": 2020,
  "purchasePrice": 2000000,
  "estimatedValue": 2800000,
  "monthlyExpenses": 500,
  "commissionRate": 5.5,
  "amenities": ["Swimming Pool", "Gym", "Parking", "Security", "Elevator"],
  "images": []
}
```

## API Endpoint

**POST** `/api/properties`

**Headers:**
```
Content-Type: application/json
```

**Authentication:** Required (Clerk authentication)

**Response:**
- **201 Created** - Property created successfully
- **400 Bad Request** - Validation error
- **401 Unauthorized** - Not authenticated
- **500 Internal Server Error** - Server error

## Testing Steps

### 1. Browser Testing (Manual)

1. Navigate to `http://localhost:3000/properties`
2. Click "Add Property" button
3. Fill in the form with mock data:
   - Title: "Luxury Downtown Apartment"
   - Address: "123 Main Street"
   - City: "New York"
   - State: "NY"
   - ZIP Code: "10001"
   - Property Type: "Residential"
   - Status: "Available"
   - Price: $2,500,000
   - Currency: USD
   - Add optional fields as needed
4. Click "Save" or "Create Property"
5. Verify the property appears in the list

### 2. API Testing (Programmatic)

```javascript
// Using fetch API
const response = await fetch('/api/properties', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    title: "Luxury Downtown Apartment",
    address: "123 Main Street",
    city: "New York",
    state: "NY",
    zipCode: "10001",
    propertyType: "residential",
    status: "available",
    price: 2500000,
    currency: "USD",
  }),
});

const property = await response.json();
```

### 3. Using cURL

```bash
curl -X POST http://localhost:3000/api/properties \
  -H "Content-Type: application/json" \
  -H "Cookie: [your-auth-cookie]" \
  -d '{
    "title": "Luxury Downtown Apartment",
    "address": "123 Main Street",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "propertyType": "residential",
    "status": "available",
    "price": 2500000,
    "currency": "USD"
  }'
```

## Currency Support

The application supports multiple currencies:
- **USD** (US Dollar) - Default
- **INR** (Indian Rupee) - Uses Indian numbering (Lakhs/Crores)
- **PKR** (Pakistani Rupee) - Uses Indian numbering (Lakhs/Crores)
- Other currencies as configured

## Image Upload

Properties can include images:
1. Images are uploaded to Supabase Storage
2. Maximum file size: 5 MB
3. Allowed types: JPEG, PNG, WebP
4. Images are stored in the `property-images` bucket
5. Each user can only access their own images

## Validation Rules

- **title**: Cannot be empty
- **address**: Cannot be empty
- **city**: Cannot be empty
- **state**: Cannot be empty
- **zipCode**: Cannot be empty
- **propertyType**: Must be a valid type
- **status**: Must be a valid status
- **price**: Must be a positive number
- **purchasePrice**: Must be positive if provided
- **estimatedValue**: Must be positive if provided
- **monthlyExpenses**: Must be positive if provided

## Error Responses

### Missing Required Field
```json
{
  "error": "title is required",
  "code": "MISSING_TITLE"
}
```

### Invalid Property Type
```json
{
  "error": "propertyType must be one of: residential, commercial, land, multi_family",
  "code": "INVALID_PROPERTY_TYPE"
}
```

### Unauthorized
```json
{
  "error": "Unauthorized. Please log in.",
  "code": "UNAUTHORIZED"
}
```

## Success Response

```json
{
  "id": 1,
  "userId": "user_abc123",
  "title": "Luxury Downtown Apartment",
  "address": "123 Main Street",
  "city": "New York",
  "state": "NY",
  "zipCode": "10001",
  "propertyType": "residential",
  "status": "available",
  "price": 2500000,
  "currency": "USD",
  "createdAt": "2025-11-13T12:00:00.000Z",
  "updatedAt": "2025-11-13T12:00:00.000Z"
}
```

## Notes

- All properties are automatically associated with the authenticated user
- Users can only see and manage their own properties
- The `userId` field is automatically set from Clerk authentication
- Timestamps (`createdAt`, `updatedAt`) are automatically managed

