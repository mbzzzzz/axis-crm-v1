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
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Tenant ID is required', code: 'MISSING_ID' },
        { status: 400 }
      );
    }

    // Verify the tenant ID matches the token
    if (parseInt(id) !== decoded.tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 403 }
      );
    }

    // Fetch tenant with property
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
      .where(eq(tenants.id, parseInt(id)))
      .limit(1);

    if (tenant.length === 0) {
      return NextResponse.json(
        { error: 'Tenant not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const tenantData = tenant[0];

    // Fetch property if exists - ONLY the property linked to this tenant
    // Security: Tenant can ONLY see their own property
    let property = null;
    if (tenantData.propertyId) {
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

      if (propertyResult.length > 0) {
        property = propertyResult[0];
      } else {
        // Tenant has propertyId but property doesn't exist
        return NextResponse.json(
          { error: 'Property not found', code: 'PROPERTY_NOT_FOUND' },
          { status: 404 }
        );
      }
    } else {
      // Tenant has no property assigned
      return NextResponse.json(
        { error: 'No property assigned to this tenant', code: 'NO_PROPERTY' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...tenantData,
      property,
    }, { status: 200 });
  } catch (error) {
    console.error('GET tenant mobile error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

