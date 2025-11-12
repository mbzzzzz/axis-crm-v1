/**
 * Mock Property Listing Test
 * 
 * This script demonstrates how to create a property listing via the API.
 * 
 * Required fields:
 * - title: string (required)
 * - address: string (required)
 * - city: string (required)
 * - state: string (required)
 * - zipCode: string (required)
 * - propertyType: 'residential' | 'commercial' | 'land' | 'multi_family' (required)
 * - status: 'available' | 'under_contract' | 'sold' | 'rented' | 'pending' (required)
 * - price: number (required, must be positive)
 * - currency: string (optional, defaults to 'USD')
 * 
 * Optional fields:
 * - description: string
 * - sizeSqft: number
 * - bedrooms: number
 * - bathrooms: number
 * - yearBuilt: number
 * - purchasePrice: number
 * - estimatedValue: number
 * - monthlyExpenses: number
 * - commissionRate: number
 * - amenities: string[]
 * - images: string[]
 */

// Mock property data for testing
const mockProperty = {
  title: "Luxury Downtown Apartment",
  description: "Beautiful 2-bedroom apartment in the heart of downtown with stunning city views.",
  address: "123 Main Street",
  city: "New York",
  state: "NY",
  zipCode: "10001",
  propertyType: "residential",
  status: "available",
  price: 2500000,
  currency: "USD",
  sizeSqft: 1200,
  bedrooms: 2,
  bathrooms: 2,
  yearBuilt: 2020,
  purchasePrice: 2000000,
  estimatedValue: 2800000,
  monthlyExpenses: 500,
  commissionRate: 5.5,
  amenities: ["Swimming Pool", "Gym", "Parking", "Security", "Elevator"],
  images: []
};

// Example API call (requires authentication)
async function createPropertyListing(propertyData) {
  try {
    const response = await fetch('/api/properties', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(propertyData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create property');
    }

    const newProperty = await response.json();
    console.log('Property created successfully:', newProperty);
    return newProperty;
  } catch (error) {
    console.error('Error creating property:', error);
    throw error;
  }
}

// Test with mock data
console.log('Mock Property Data:');
console.log(JSON.stringify(mockProperty, null, 2));

console.log('\nTo test this:');
console.log('1. Ensure you are authenticated (logged in)');
console.log('2. Call createPropertyListing(mockProperty)');
console.log('3. Check the response for the created property');

// Export for use in tests
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { mockProperty, createPropertyListing };
}

