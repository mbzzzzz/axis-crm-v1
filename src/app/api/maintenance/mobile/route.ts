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

    // Fetch tenant by ID and verify email matches token for security
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

    // Verify tenant email matches token email - ensures tenants only see their own property's requests
    if (tenant[0].email.toLowerCase() !== decoded.email?.toLowerCase()) {
      return NextResponse.json(
        { error: 'Unauthorized - email mismatch', code: 'UNAUTHORIZED' },
        { status: 403 }
      );
    }

    const propertyId = tenant[0].propertyId;

    if (!propertyId) {
      return NextResponse.json(
        { error: 'No active property for this tenant', code: 'NO_PROPERTY' },
        { status: 404 }
      );
    }

    // Fetch maintenance requests ONLY for the tenant's property
    // These requests are created by tenants and show up in landlord's panel via userId
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

    // Get tenant's propertyId - verify tenant exists and has property linked to their email
    const { tenants } = await import('@/db/schema-postgres');
    const tenant = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, decoded.tenantId))
      .limit(1);

    if (tenant.length === 0) {
      return NextResponse.json(
        { error: 'Tenant not found', code: 'TENANT_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Verify tenant email matches token email for security
    if (tenant[0].email.toLowerCase() !== decoded.email?.toLowerCase()) {
      return NextResponse.json(
        { error: 'Unauthorized - email mismatch', code: 'UNAUTHORIZED' },
        { status: 403 }
      );
    }

    if (!tenant[0].propertyId) {
      return NextResponse.json(
        { error: 'No property assigned to this tenant. Please contact your property manager.', code: 'NO_PROPERTY' },
        { status: 400 }
      );
    }

    // Fetch property to get owner's userId - ensures request shows in landlord's panel
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
    // CRITICAL: Using property owner's userId ensures the request appears in the landlord's/agent's web app
    // The maintenance panel filters by userId, so requests created by tenants will show up
    // in the property owner's maintenance dashboard
    const newRequest = await db
      .insert(maintenanceRequests)
      .values({
        userId: property[0].userId, // Property owner's userId (landlord/agent) - ensures it shows in web app maintenance panel
        propertyId: tenant[0].propertyId!, // Tenant's property - ensures it's linked correctly
        title: title.trim(),
        description: description.trim(),
        urgency: 'medium',
        status: 'open',
        location: property[0].address || '',
        reportedDate: new Date().toISOString().split('T')[0],
        notes: `Created by tenant: ${tenant[0].name} (${tenant[0].email})`, // Track which tenant created it
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

