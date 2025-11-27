import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { maintenanceRequests, tenants, properties } from '@/db/schema-postgres';
import { eq, and, desc } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

async function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded.type !== 'tenant') return null;
    return decoded;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const decoded = await verifyToken(request);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required', code: 'MISSING_ID' },
        { status: 400 }
      );
    }

    // Verify tenant ID matches token
    if (parseInt(tenantId) !== decoded.tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 403 }
      );
    }

    // Fetch maintenance requests for tenant's property
    // First, we need to get the tenant's propertyId
    const tenant = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, parseInt(tenantId)))
      .limit(1);

    if (tenant.length === 0) {
      return NextResponse.json(
        { error: 'Tenant not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const propertyId = tenant[0].propertyId;

    if (!propertyId) {
      return NextResponse.json(
        { error: 'No active property for this tenant', code: 'NO_PROPERTY' },
        { status: 404 }
      );
    }

    // Fetch maintenance requests for the property
    const requests = await db
      .select({
        id: maintenanceRequests.id,
        title: maintenanceRequests.title,
        description: maintenanceRequests.description,
        status: maintenanceRequests.status,
        urgency: maintenanceRequests.urgency,
        reportedDate: maintenanceRequests.reportedDate,
        location: maintenanceRequests.location,
      })
      .from(maintenanceRequests)
      .where(eq(maintenanceRequests.propertyId, propertyId))
      .orderBy(desc(maintenanceRequests.reportedDate));

    return NextResponse.json(requests, { status: 200 });
  } catch (error) {
    console.error('GET maintenance mobile error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const decoded = await verifyToken(request);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, description, imageUri } = body;

    if (!title?.trim()) {
      return NextResponse.json(
        { error: 'Title is required', code: 'MISSING_TITLE' },
        { status: 400 }
      );
    }

    if (!description?.trim()) {
      return NextResponse.json(
        { error: 'Description is required', code: 'MISSING_DESCRIPTION' },
        { status: 400 }
      );
    }

    // Get tenant's propertyId
    const { tenants } = await import('@/db/schema-postgres');
    const tenant = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, decoded.tenantId))
      .limit(1);

    if (tenant.length === 0 || !tenant[0].propertyId) {
      return NextResponse.json(
        { error: 'Tenant property not found', code: 'NO_PROPERTY' },
        { status: 400 }
      );
    }

    // Create maintenance request
    // Note: We use the property owner's userId for the request
    // In a real scenario, you'd want to track which tenant created it
    const property = await db
      .select()
      .from(properties)
      .where(eq(properties.id, tenant[0].propertyId!))
      .limit(1);

    if (property.length === 0) {
      return NextResponse.json(
        { error: 'Property not found', code: 'PROPERTY_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Create maintenance request with property owner's userId
    // This ensures the request appears in the agent's web app
    // The userId is the property owner (agent), so the request will show up
    // in their maintenance dashboard filtered by userId
    const newRequest = await db
      .insert(maintenanceRequests)
      .values({
        userId: property[0].userId, // Property owner's userId (agent) - ensures it shows in web app
        propertyId: tenant[0].propertyId, // Tenant's property - ensures it's linked correctly
        title: title.trim(),
        description: description.trim(),
        urgency: 'medium',
        status: 'open',
        location: property[0].address || '',
        reportedDate: new Date().toISOString().split('T')[0],
      })
      .returning();

    return NextResponse.json(newRequest[0], { status: 201 });
  } catch (error) {
    console.error('POST maintenance mobile error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

