import { NextRequest, NextResponse } from 'next/server';
import { getTenantFromToken } from '@/lib/tenant-auth';
import { db } from '@/db';
import { properties } from '@/db/schema-postgres';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const tenant = await getTenantFromToken(token);

    if (!tenant) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch property data if tenant has a property assigned
    let property = null;
    if (tenant.propertyId) {
      const propertyData = await db
        .select()
        .from(properties)
        .where(eq(properties.id, tenant.propertyId))
        .limit(1);
      
      if (propertyData.length > 0) {
        property = propertyData[0];
      }
    }

    return NextResponse.json({ 
      tenant: {
        ...tenant,
        property: property,
      }
    });
  } catch (error) {
    console.error('Error fetching tenant info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

