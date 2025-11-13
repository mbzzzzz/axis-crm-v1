import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { properties } from '@/db/schema';
import { eq, like, and, or, desc } from 'drizzle-orm';
import { currentUser } from '@clerk/nextjs/server';

const VALID_PROPERTY_TYPES = ['residential', 'commercial', 'land', 'multi_family'];
const VALID_STATUSES = ['available', 'under_contract', 'sold', 'rented', 'pending'];

// Helper function to get current authenticated user
async function getCurrentUser() {
  const user = await currentUser();
  if (!user) return null;
  return {
    id: user.id,
    name: user.fullName || user.firstName || 'User',
    email: user.primaryEmailAddress?.emailAddress || '',
  };
}

export async function GET(request: NextRequest) {
  try {
    // CRITICAL: Authenticate user first
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single property by ID - with ownership check
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      // CRITICAL: Filter by userId to ensure data isolation
      const property = await db
        .select()
        .from(properties)
        .where(
          and(
            eq(properties.id, parseInt(id)),
            eq(properties.userId, user.id) // Use Clerk user ID
          )
        )
        .limit(1);

      if (property.length === 0) {
        return NextResponse.json(
          { error: 'Property not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(property[0], { status: 200 });
    }

    // List properties - CRITICAL: Only return current user's properties
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '100'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const propertyType = searchParams.get('propertyType');
    const status = searchParams.get('status');
    const city = searchParams.get('city');

    const conditions = [
      // CRITICAL: Always filter by current user's ID
      eq(properties.userId, user.id) // Use Clerk user ID
    ];

    // Search across title, address, city
    if (search) {
      conditions.push(
        or(
          like(properties.title, `%${search}%`),
          like(properties.address, `%${search}%`),
          like(properties.city, `%${search}%`)
        )
      );
    }

    // Filter by propertyType
    if (propertyType) {
      conditions.push(eq(properties.propertyType, propertyType));
    }

    // Filter by status
    if (status) {
      conditions.push(eq(properties.status, status));
    }

    // Filter by city
    if (city) {
      conditions.push(eq(properties.city, city));
    }

    const results = await db
      .select()
      .from(properties)
      .where(and(...conditions))
      .orderBy(desc(properties.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // CRITICAL: Authenticate user first
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.title || !body.title.trim()) {
      return NextResponse.json(
        { error: 'title is required', code: 'MISSING_TITLE' },
        { status: 400 }
      );
    }

    if (!body.address || !body.address.trim()) {
      return NextResponse.json(
        { error: 'address is required', code: 'MISSING_ADDRESS' },
        { status: 400 }
      );
    }

    if (!body.city || !body.city.trim()) {
      return NextResponse.json(
        { error: 'city is required', code: 'MISSING_CITY' },
        { status: 400 }
      );
    }

    if (!body.state || !body.state.trim()) {
      return NextResponse.json(
        { error: 'state is required', code: 'MISSING_STATE' },
        { status: 400 }
      );
    }

    if (!body.zipCode || !body.zipCode.trim()) {
      return NextResponse.json(
        { error: 'zipCode is required', code: 'MISSING_ZIP_CODE' },
        { status: 400 }
      );
    }

    if (!body.propertyType) {
      return NextResponse.json(
        { error: 'propertyType is required', code: 'MISSING_PROPERTY_TYPE' },
        { status: 400 }
      );
    }

    if (!VALID_PROPERTY_TYPES.includes(body.propertyType)) {
      return NextResponse.json(
        {
          error: `propertyType must be one of: ${VALID_PROPERTY_TYPES.join(', ')}`,
          code: 'INVALID_PROPERTY_TYPE',
        },
        { status: 400 }
      );
    }

    if (!body.status) {
      return NextResponse.json(
        { error: 'status is required', code: 'MISSING_STATUS' },
        { status: 400 }
      );
    }

    if (!VALID_STATUSES.includes(body.status)) {
      return NextResponse.json(
        {
          error: `status must be one of: ${VALID_STATUSES.join(', ')}`,
          code: 'INVALID_STATUS',
        },
        { status: 400 }
      );
    }

    if (body.price === undefined || body.price === null) {
      return NextResponse.json(
        { error: 'price is required', code: 'MISSING_PRICE' },
        { status: 400 }
      );
    }

    if (typeof body.price !== 'number' || body.price <= 0) {
      return NextResponse.json(
        { error: 'price must be a positive number', code: 'INVALID_PRICE' },
        { status: 400 }
      );
    }

    // Validate optional positive integers
    if (body.sizeSqft !== undefined && body.sizeSqft !== null) {
      if (!Number.isInteger(body.sizeSqft) || body.sizeSqft <= 0) {
        return NextResponse.json(
          { error: 'sizeSqft must be a positive integer', code: 'INVALID_SIZE_SQFT' },
          { status: 400 }
        );
      }
    }

    if (body.bedrooms !== undefined && body.bedrooms !== null) {
      if (!Number.isInteger(body.bedrooms) || body.bedrooms <= 0) {
        return NextResponse.json(
          { error: 'bedrooms must be a positive integer', code: 'INVALID_BEDROOMS' },
          { status: 400 }
        );
      }
    }

    if (body.yearBuilt !== undefined && body.yearBuilt !== null) {
      if (!Number.isInteger(body.yearBuilt) || body.yearBuilt <= 0) {
        return NextResponse.json(
          { error: 'yearBuilt must be a positive integer', code: 'INVALID_YEAR_BUILT' },
          { status: 400 }
        );
      }
    }

    // Validate optional positive numbers
    if (body.bathrooms !== undefined && body.bathrooms !== null) {
      if (typeof body.bathrooms !== 'number' || body.bathrooms <= 0) {
        return NextResponse.json(
          { error: 'bathrooms must be a positive number', code: 'INVALID_BATHROOMS' },
          { status: 400 }
        );
      }
    }

    if (body.purchasePrice !== undefined && body.purchasePrice !== null) {
      if (typeof body.purchasePrice !== 'number' || body.purchasePrice < 0) {
        return NextResponse.json(
          { error: 'purchasePrice must be a non-negative number', code: 'INVALID_PURCHASE_PRICE' },
          { status: 400 }
        );
      }
    }

    if (body.estimatedValue !== undefined && body.estimatedValue !== null) {
      if (typeof body.estimatedValue !== 'number' || body.estimatedValue < 0) {
        return NextResponse.json(
          { error: 'estimatedValue must be a non-negative number', code: 'INVALID_ESTIMATED_VALUE' },
          { status: 400 }
        );
      }
    }

    if (body.monthlyExpenses !== undefined && body.monthlyExpenses !== null) {
      if (typeof body.monthlyExpenses !== 'number' || body.monthlyExpenses < 0) {
        return NextResponse.json(
          { error: 'monthlyExpenses must be a non-negative number', code: 'INVALID_MONTHLY_EXPENSES' },
          { status: 400 }
        );
      }
    }

    if (body.commissionRate !== undefined && body.commissionRate !== null) {
      if (typeof body.commissionRate !== 'number' || body.commissionRate < 0) {
        return NextResponse.json(
          { error: 'commissionRate must be a non-negative number', code: 'INVALID_COMMISSION_RATE' },
          { status: 400 }
        );
      }
    }

    // Prepare insert data - CRITICAL: Always use authenticated user's ID (text)
    // NOTE: Do NOT include 'id' field - it's a serial and will auto-increment
    // NOTE: createdAt and updatedAt have defaults, but we set them explicitly for consistency
    const now = new Date();
    const insertData: Record<string, any> = {
      userId: user.id, // CRITICAL: Use Clerk user ID
      title: body.title.trim(),
      address: body.address.trim(),
      city: body.city.trim(),
      state: body.state.trim(),
      zipCode: body.zipCode.trim(),
      propertyType: body.propertyType,
      status: body.status,
      price: body.price,
      createdAt: now,
      updatedAt: now,
    };

    // Add currency if provided, otherwise let default handle it
    if (body.currency) {
      insertData.currency = body.currency;
    }

    // Add optional fields only if they are explicitly provided and not null/empty
    if (body.description !== undefined && body.description !== null && body.description.trim() !== '') {
      insertData.description = body.description.trim();
    }
    if (body.sizeSqft !== undefined && body.sizeSqft !== null) {
      insertData.sizeSqft = body.sizeSqft;
    }
    if (body.bedrooms !== undefined && body.bedrooms !== null) {
      insertData.bedrooms = body.bedrooms;
    }
    if (body.bathrooms !== undefined && body.bathrooms !== null) {
      insertData.bathrooms = body.bathrooms;
    }
    if (body.yearBuilt !== undefined && body.yearBuilt !== null) {
      insertData.yearBuilt = body.yearBuilt;
    }
    // Only include amenities if it's a non-empty array
    if (body.amenities !== undefined && body.amenities !== null && Array.isArray(body.amenities) && body.amenities.length > 0) {
      insertData.amenities = body.amenities;
    }
    // Only include images if it's a non-empty array
    if (body.images !== undefined && body.images !== null && Array.isArray(body.images) && body.images.length > 0) {
      insertData.images = body.images;
    }
    if (body.purchasePrice !== undefined && body.purchasePrice !== null && body.purchasePrice > 0) {
      insertData.purchasePrice = body.purchasePrice;
    }
    if (body.estimatedValue !== undefined && body.estimatedValue !== null && body.estimatedValue > 0) {
      insertData.estimatedValue = body.estimatedValue;
    }
    if (body.monthlyExpenses !== undefined && body.monthlyExpenses !== null && body.monthlyExpenses > 0) {
      insertData.monthlyExpenses = body.monthlyExpenses;
    }
    if (body.commissionRate !== undefined && body.commissionRate !== null && body.commissionRate > 0) {
      insertData.commissionRate = body.commissionRate;
    }

    // Use type-safe insert - Drizzle will handle serial fields and defaults correctly
    const newProperty = await db.insert(properties).values(insertData).returning();

    return NextResponse.json(newProperty[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // CRITICAL: Authenticate user first
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if property exists AND belongs to current user
    const existingProperty = await db
      .select()
      .from(properties)
      .where(
        and(
          eq(properties.id, parseInt(id)),
          eq(properties.userId, user.id) // Use Clerk user ID
        )
      )
      .limit(1);

    if (existingProperty.length === 0) {
      return NextResponse.json(
        { error: 'Property not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const updates: any = {
      updatedAt: new Date(),
    };

    // Validate and add fields if provided
    if (body.title !== undefined) {
      if (!body.title.trim()) {
        return NextResponse.json(
          { error: 'title cannot be empty', code: 'INVALID_TITLE' },
          { status: 400 }
        );
      }
      updates.title = body.title.trim();
    }

    if (body.description !== undefined) {
      updates.description = body.description;
    }

    if (body.address !== undefined) {
      if (!body.address.trim()) {
        return NextResponse.json(
          { error: 'address cannot be empty', code: 'INVALID_ADDRESS' },
          { status: 400 }
        );
      }
      updates.address = body.address.trim();
    }

    if (body.city !== undefined) {
      if (!body.city.trim()) {
        return NextResponse.json(
          { error: 'city cannot be empty', code: 'INVALID_CITY' },
          { status: 400 }
        );
      }
      updates.city = body.city.trim();
    }

    if (body.state !== undefined) {
      if (!body.state.trim()) {
        return NextResponse.json(
          { error: 'state cannot be empty', code: 'INVALID_STATE' },
          { status: 400 }
        );
      }
      updates.state = body.state.trim();
    }

    if (body.zipCode !== undefined) {
      if (!body.zipCode.trim()) {
        return NextResponse.json(
          { error: 'zipCode cannot be empty', code: 'INVALID_ZIP_CODE' },
          { status: 400 }
        );
      }
      updates.zipCode = body.zipCode.trim();
    }

    if (body.propertyType !== undefined) {
      if (!VALID_PROPERTY_TYPES.includes(body.propertyType)) {
        return NextResponse.json(
          {
            error: `propertyType must be one of: ${VALID_PROPERTY_TYPES.join(', ')}`,
            code: 'INVALID_PROPERTY_TYPE',
          },
          { status: 400 }
        );
      }
      updates.propertyType = body.propertyType;
    }

    if (body.status !== undefined) {
      if (!VALID_STATUSES.includes(body.status)) {
        return NextResponse.json(
          {
            error: `status must be one of: ${VALID_STATUSES.join(', ')}`,
            code: 'INVALID_STATUS',
          },
          { status: 400 }
        );
      }
      updates.status = body.status;
    }

    if (body.price !== undefined) {
      if (typeof body.price !== 'number' || body.price <= 0) {
        return NextResponse.json(
          { error: 'price must be a positive number', code: 'INVALID_PRICE' },
          { status: 400 }
        );
      }
      updates.price = body.price;
    }

    if (body.currency !== undefined) {
      updates.currency = body.currency;
    }

    if (body.sizeSqft !== undefined) {
      if (body.sizeSqft !== null && (!Number.isInteger(body.sizeSqft) || body.sizeSqft <= 0)) {
        return NextResponse.json(
          { error: 'sizeSqft must be a positive integer', code: 'INVALID_SIZE_SQFT' },
          { status: 400 }
        );
      }
      updates.sizeSqft = body.sizeSqft;
    }

    if (body.bedrooms !== undefined) {
      if (body.bedrooms !== null && (!Number.isInteger(body.bedrooms) || body.bedrooms <= 0)) {
        return NextResponse.json(
          { error: 'bedrooms must be a positive integer', code: 'INVALID_BEDROOMS' },
          { status: 400 }
        );
      }
      updates.bedrooms = body.bedrooms;
    }

    if (body.bathrooms !== undefined) {
      if (body.bathrooms !== null && (typeof body.bathrooms !== 'number' || body.bathrooms <= 0)) {
        return NextResponse.json(
          { error: 'bathrooms must be a positive number', code: 'INVALID_BATHROOMS' },
          { status: 400 }
        );
      }
      updates.bathrooms = body.bathrooms;
    }

    if (body.yearBuilt !== undefined) {
      if (body.yearBuilt !== null && (!Number.isInteger(body.yearBuilt) || body.yearBuilt <= 0)) {
        return NextResponse.json(
          { error: 'yearBuilt must be a positive integer', code: 'INVALID_YEAR_BUILT' },
          { status: 400 }
        );
      }
      updates.yearBuilt = body.yearBuilt;
    }

    if (body.amenities !== undefined) {
      updates.amenities = body.amenities;
    }

    if (body.images !== undefined && Array.isArray(body.images)) {
      updates.images = body.images;
    }

    if (body.purchasePrice !== undefined) {
      if (body.purchasePrice !== null && (typeof body.purchasePrice !== 'number' || body.purchasePrice < 0)) {
        return NextResponse.json(
          { error: 'purchasePrice must be a non-negative number', code: 'INVALID_PURCHASE_PRICE' },
          { status: 400 }
        );
      }
      updates.purchasePrice = body.purchasePrice;
    }

    if (body.estimatedValue !== undefined) {
      if (body.estimatedValue !== null && (typeof body.estimatedValue !== 'number' || body.estimatedValue < 0)) {
        return NextResponse.json(
          { error: 'estimatedValue must be a non-negative number', code: 'INVALID_ESTIMATED_VALUE' },
          { status: 400 }
        );
      }
      updates.estimatedValue = body.estimatedValue;
    }

    if (body.monthlyExpenses !== undefined) {
      if (body.monthlyExpenses !== null && (typeof body.monthlyExpenses !== 'number' || body.monthlyExpenses < 0)) {
        return NextResponse.json(
          { error: 'monthlyExpenses must be a non-negative number', code: 'INVALID_MONTHLY_EXPENSES' },
          { status: 400 }
        );
      }
      updates.monthlyExpenses = body.monthlyExpenses;
    }

    if (body.commissionRate !== undefined) {
      if (body.commissionRate !== null && (typeof body.commissionRate !== 'number' || body.commissionRate < 0)) {
        return NextResponse.json(
          { error: 'commissionRate must be a non-negative number', code: 'INVALID_COMMISSION_RATE' },
          { status: 400 }
        );
      }
      updates.commissionRate = body.commissionRate;
    }

    const updatedProperty = await db
      .update(properties)
      .set(updates)
      .where(
        and(
          eq(properties.id, parseInt(id)),
          eq(properties.userId, user.id) // Use Clerk user ID
        )
      )
      .returning();

    return NextResponse.json(updatedProperty[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // CRITICAL: Authenticate user first
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if property exists AND belongs to current user
    const existingProperty = await db
      .select()
      .from(properties)
      .where(
        and(
          eq(properties.id, parseInt(id)),
          eq(properties.userId, user.id) // Use Clerk user ID
        )
      )
      .limit(1);

    if (existingProperty.length === 0) {
      return NextResponse.json(
        { error: 'Property not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const deleted = await db
      .delete(properties)
      .where(
        and(
          eq(properties.id, parseInt(id)),
          eq(properties.userId, user.id) // Use Clerk user ID
        )
      )
      .returning();

    return NextResponse.json(
      {
        message: 'Property deleted successfully',
        property: deleted[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}