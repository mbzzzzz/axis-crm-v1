import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tenants, properties } from '@/db/schema-postgres';
import { eq } from 'drizzle-orm';
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
    const emailParam = searchParams.get('email')?.toLowerCase() ?? null;

    // Always use email from token for security - tenants can only access their own data
    const tenantEmail = decoded.email?.toLowerCase();
    
    if (!tenantEmail) {
      return NextResponse.json(
        { error: 'Invalid token - email not found', code: 'INVALID_TOKEN' },
        { status: 401 }
      );
    }

    // Verify email param matches token email (if provided)
    if (emailParam && emailParam !== tenantEmail) {
      return NextResponse.json(
        { error: 'Unauthorized - email mismatch', code: 'UNAUTHORIZED' },
        { status: 403 }
      );
    }

    // Fetch tenant by email from token - ensures tenants only see their own property
    const tenant = await db
      .select({
        id: tenants.id,
        name: tenants.name,
        email: tenants.email,
        phone: tenants.phone,
        propertyId: tenants.propertyId,
        leaseStart: tenants.leaseStart,
        leaseEnd: tenants.leaseEnd,
        leaseStatus: tenants.leaseStatus,
        monthlyRent: tenants.monthlyRent,
      })
      .from(tenants)
      .where(eq(tenants.email, tenantEmail))
      .limit(1);

    if (tenant.length === 0) {
      return NextResponse.json(
        { error: 'Tenant not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const tenantData = tenant[0];

    // Verify tenant ID from database matches token
    if (tenantData.id !== decoded.tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized - tenant ID mismatch', code: 'UNAUTHORIZED' },
        { status: 403 }
      );
    }

    if (!tenantData.propertyId) {
      const responseCode = tenantData.leaseStatus === 'terminated' ? 'LEASE_TERMINATED' : 'NO_PROPERTY';
      const message =
        responseCode === 'LEASE_TERMINATED'
          ? 'This lease has been terminated by your property manager.'
          : 'No property assigned to this tenant';

      return NextResponse.json(
        { error: message, code: responseCode, tenant: tenantData },
        { status: 404 }
      );
    }

    // Fetch property linked to tenant's email - ensures tenants only see their assigned property
    const propertyResult = await db
      .select({
        id: properties.id,
        title: properties.title,
        address: properties.address,
        city: properties.city,
        state: properties.state,
        images: properties.images,
      })
      .from(properties)
      .where(eq(properties.id, tenantData.propertyId))
      .limit(1);

    if (propertyResult.length === 0) {
      return NextResponse.json(
        { error: 'Property not found', code: 'PROPERTY_NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...tenantData,
      property: propertyResult[0],
    }, { status: 200 });
  } catch (error) {
    console.error('GET tenant mobile error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

