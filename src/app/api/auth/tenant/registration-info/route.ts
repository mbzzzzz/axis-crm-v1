import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tenants } from '@/db/schema-postgres';
import { eq } from 'drizzle-orm';

/**
 * Public endpoint to fetch tenant registration info (email) by tenantId
 * This is used by the registration page to pre-fill the email field
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId || isNaN(parseInt(tenantId))) {
      return NextResponse.json(
        { error: 'Valid tenant ID is required' },
        { status: 400 }
      );
    }

    // Fetch tenant (public - no auth required for registration)
    const tenant = await db
      .select({
        id: tenants.id,
        email: tenants.email,
        name: tenants.name,
      })
      .from(tenants)
      .where(eq(tenants.id, parseInt(tenantId)))
      .limit(1);

    if (tenant.length === 0) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Only return email and name for registration purposes
    return NextResponse.json({
      email: tenant[0].email,
      name: tenant[0].name,
    });
  } catch (error: any) {
    console.error('Error fetching tenant registration info:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch tenant information' },
      { status: 500 }
    );
  }
}

