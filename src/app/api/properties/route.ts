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

            // CRITICAL SECURITY: Filter by userId to ensure data isolation
            // This ensures users can ONLY access properties they created
            if (!user.id || typeof user.id !== 'string') {
                console.error('Invalid user ID in GET /api/properties?id=', id, user.id);
                return NextResponse.json(
                    { error: 'Invalid user authentication', code: 'INVALID_USER' },
                    { status: 401 }
                );
            }

            const property = await db
                .select()
                .from(properties)
                .where(
                    and(
                        eq(properties.id, parseInt(id)),
                        eq(properties.userId, user.id) // REQUIRED: Use Clerk user ID for security
                    )
                )
                .limit(1);

            if (property.length === 0) {
                // Property doesn't exist OR doesn't belong to this user
                // We return "not found" to avoid revealing if property exists for other users
                return NextResponse.json(
                    { error: 'Property not found', code: 'NOT_FOUND' },
                    { status: 404 }
                );
            }

            // Log for debugging (only in development)
            if (process.env.NODE_ENV === 'development') {
                console.log(`[GET /api/properties?id=${id}] User ${user.id} accessed property ${id}`);
            }

            return NextResponse.json(property[0], { status: 200 });
        }

        // List properties - CRITICAL: Only return current user's properties
        // SECURITY: This ensures users can ONLY see their own properties
        if (!user.id || typeof user.id !== 'string') {
            console.error('Invalid user ID in GET /api/properties:', user.id);
            return NextResponse.json(
                { error: 'Invalid user authentication', code: 'INVALID_USER' },
                { status: 401 }
            );
        }

        const limit = Math.min(parseInt(searchParams.get('limit') ?? '100'), 100);
        const offset = parseInt(searchParams.get('offset') ?? '0');
        const search = searchParams.get('search');
        const propertyType = searchParams.get('propertyType');
        const status = searchParams.get('status');
        const city = searchParams.get('city');

        // CRITICAL SECURITY: Always filter by current user's ID - this is the PRIMARY security check
        // This ensures that users can ONLY see properties they created
        const conditions = [
            eq(properties.userId, user.id) // Use Clerk user ID - REQUIRED for data isolation
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

        // Execute query with user_id filter - this ensures data isolation
        const results = await db
            .select()
            .from(properties)
            .where(and(...conditions)) // conditions always includes user.id filter
            .orderBy(desc(properties.createdAt))
            .limit(limit)
            .offset(offset);

        // Log for debugging (only in development)
        if (process.env.NODE_ENV === 'development') {
            console.log(`[GET /api/properties] User ${user.id} retrieved ${results.length} properties`);
        }

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

        // Helper to sanitize numeric fields
        const sanitizeNumeric = (val: any) => (val === '' ? null : val);

        // Sanitize optional numeric fields
        body.sizeSqft = sanitizeNumeric(body.sizeSqft);
        body.bedrooms = sanitizeNumeric(body.bedrooms);
        body.bathrooms = sanitizeNumeric(body.bathrooms);
        body.yearBuilt = sanitizeNumeric(body.yearBuilt);
        body.purchasePrice = sanitizeNumeric(body.purchasePrice);
        body.estimatedValue = sanitizeNumeric(body.estimatedValue);
        body.monthlyExpenses = sanitizeNumeric(body.monthlyExpenses);
        body.commissionRate = sanitizeNumeric(body.commissionRate);

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
        // SECURITY: This ensures properties are always associated with the creating user
        if (!user.id || typeof user.id !== 'string') {
            console.error('Invalid user ID in POST /api/properties:', user.id);
            return NextResponse.json(
                { error: 'Invalid user authentication', code: 'INVALID_USER' },
                { status: 401 }
            );
        }

        // NOTE: Do NOT include 'id' field - it's a serial and will auto-increment
        // NOTE: createdAt and updatedAt have defaults in the schema, let the database handle them
        const insertData: Record<string, any> = {
            userId: user.id, // CRITICAL SECURITY: Use Clerk user ID - REQUIRED for data isolation
            title: body.title.trim(),
            address: body.address.trim(),
            city: body.city.trim(),
            state: body.state.trim(),
            zipCode: body.zipCode.trim(),
            propertyType: body.propertyType,
            status: body.status,
            price: body.price,
        };

        // Add currency if provided, otherwise let default handle it
        if (body.currency) {
            insertData.currency = body.currency;
        }

        // Add optional fields - explicitly set to null if not provided to avoid Drizzle default issues
        // Handle description - convert empty strings to null
        if (body.description !== undefined && body.description !== null && typeof body.description === 'string' && body.description.trim() !== '') {
            insertData.description = body.description.trim();
        } else {
            insertData.description = null; // Store null instead of empty string
        }

        if (body.sizeSqft !== undefined && body.sizeSqft !== null) {
            insertData.sizeSqft = body.sizeSqft;
        } else {
            insertData.sizeSqft = null;
        }

        if (body.bedrooms !== undefined && body.bedrooms !== null) {
            insertData.bedrooms = body.bedrooms;
        } else {
            insertData.bedrooms = null;
        }

        if (body.bathrooms !== undefined && body.bathrooms !== null) {
            insertData.bathrooms = body.bathrooms;
        } else {
            insertData.bathrooms = null;
        }

        if (body.yearBuilt !== undefined && body.yearBuilt !== null) {
            insertData.yearBuilt = body.yearBuilt;
        } else {
            insertData.yearBuilt = null;
        }

        // Handle amenities - ensure it's a proper array (not a string)
        if (body.amenities !== undefined && body.amenities !== null) {
            if (Array.isArray(body.amenities)) {
                insertData.amenities = body.amenities;
            } else if (typeof body.amenities === 'string') {
                // Parse if it's a JSON string
                try {
                    insertData.amenities = JSON.parse(body.amenities);
                } catch {
                    insertData.amenities = [];
                }
            } else {
                insertData.amenities = [];
            }
        } else {
            insertData.amenities = [];
        }

        // Handle images - ensure it's a proper array (not a string)
        if (body.images !== undefined && body.images !== null) {
            if (Array.isArray(body.images)) {
                insertData.images = body.images;
            } else if (typeof body.images === 'string') {
                // Parse if it's a JSON string
                try {
                    insertData.images = JSON.parse(body.images);
                } catch {
                    insertData.images = [];
                }
            } else {
                insertData.images = [];
            }
        } else {
            insertData.images = [];
        }

        // Handle purchasePrice - set to null if not provided or 0
        if (body.purchasePrice !== undefined && body.purchasePrice !== null && body.purchasePrice > 0) {
            insertData.purchasePrice = body.purchasePrice;
        } else {
            insertData.purchasePrice = null;
        }

        // Handle estimatedValue - set to null if not provided or 0
        if (body.estimatedValue !== undefined && body.estimatedValue !== null && body.estimatedValue > 0) {
            insertData.estimatedValue = body.estimatedValue;
        } else {
            insertData.estimatedValue = null;
        }

        // Handle monthlyExpenses - set to null if not provided or 0
        if (body.monthlyExpenses !== undefined && body.monthlyExpenses !== null && body.monthlyExpenses > 0) {
            insertData.monthlyExpenses = body.monthlyExpenses;
        } else {
            insertData.monthlyExpenses = null;
        }

        // Handle commissionRate - set to null if not provided or 0
        if (body.commissionRate !== undefined && body.commissionRate !== null && body.commissionRate > 0) {
            insertData.commissionRate = body.commissionRate;
        } else {
            insertData.commissionRate = null;
        }

        // Use type-safe insert - Drizzle will handle serial fields and defaults correctly
        // Note: Do not include 'id', 'createdAt', or 'updatedAt' in insertData
        // They are handled by the database (SERIAL for id, defaultNow() for timestamps)
        // SECURITY: insertData.userId is always set to the authenticated user's ID
        const newProperty = await db.insert(properties).values(insertData).returning();

        // Log for debugging (only in development)
        if (process.env.NODE_ENV === 'development') {
            console.log(`[POST /api/properties] User ${user.id} created property ${newProperty[0].id}`);
        }

        return NextResponse.json(newProperty[0], { status: 201 });
    } catch (error) {
        console.error('POST error:', error);

        // Extract PostgreSQL-specific error details
        let errorMessage = 'Unknown error';
        let errorDetails: any = {};

        if (error instanceof Error) {
            errorMessage = error.message;
            errorDetails = {
                message: error.message,
                stack: error.stack,
                name: error.name,
            };

            // Check if it's a postgres error with additional properties
            const pgError = error as any;
            if (pgError.code) errorDetails.code = pgError.code;
            if (pgError.detail) errorDetails.detail = pgError.detail;
            if (pgError.hint) errorDetails.hint = pgError.hint;
            if (pgError.position) errorDetails.position = pgError.position;
            if (pgError.internalPosition) errorDetails.internalPosition = pgError.internalPosition;
            if (pgError.internalQuery) errorDetails.internalQuery = pgError.internalQuery;
            if (pgError.where) errorDetails.where = pgError.where;
            if (pgError.schema) errorDetails.schema = pgError.schema;
            if (pgError.table) errorDetails.table = pgError.table;
            if (pgError.column) errorDetails.column = pgError.column;
            if (pgError.dataType) errorDetails.dataType = pgError.dataType;
            if (pgError.constraint) errorDetails.constraint = pgError.constraint;
        } else {
            errorMessage = String(error);
            errorDetails = { raw: error };
        }

        console.error('POST error details:', errorDetails);

        return NextResponse.json(
            {
                error: 'Internal server error: ' + errorMessage,
                details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
            },
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

    // Helper to sanitize numeric fields
    const sanitizeNumeric = (val: any) => (val === '' ? null : val);

    // Sanitize optional numeric fields if they are present
    if (body.sizeSqft !== undefined) body.sizeSqft = sanitizeNumeric(body.sizeSqft);
    if (body.bedrooms !== undefined) body.bedrooms = sanitizeNumeric(body.bedrooms);
    if (body.bathrooms !== undefined) body.bathrooms = sanitizeNumeric(body.bathrooms);
    if (body.yearBuilt !== undefined) body.yearBuilt = sanitizeNumeric(body.yearBuilt);
    if (body.purchasePrice !== undefined) body.purchasePrice = sanitizeNumeric(body.purchasePrice);
    if (body.estimatedValue !== undefined) body.estimatedValue = sanitizeNumeric(body.estimatedValue);
    if (body.monthlyExpenses !== undefined) body.monthlyExpenses = sanitizeNumeric(body.monthlyExpenses);
    if (body.commissionRate !== undefined) body.commissionRate = sanitizeNumeric(body.commissionRate);

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
      // Convert empty strings to null
      if (typeof body.description === 'string' && body.description.trim() === '') {
        updates.description = null;
      } else if (body.description === null || body.description === '') {
        updates.description = null;
      } else {
        updates.description = typeof body.description === 'string' ? body.description.trim() : body.description;
      }
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
      // Ensure it's a proper array (not a string)
      if (Array.isArray(body.amenities)) {
        updates.amenities = body.amenities;
      } else if (typeof body.amenities === 'string') {
        // Parse if it's a JSON string
        try {
          updates.amenities = JSON.parse(body.amenities);
        } catch {
          updates.amenities = [];
        }
      } else {
        updates.amenities = [];
      }
    }

    if (body.images !== undefined) {
      // Ensure it's a proper array (not a string)
      if (Array.isArray(body.images)) {
        updates.images = body.images;
      } else if (typeof body.images === 'string') {
        // Parse if it's a JSON string
        try {
          updates.images = JSON.parse(body.images);
        } catch {
          updates.images = [];
        }
      } else {
        updates.images = [];
      }
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
