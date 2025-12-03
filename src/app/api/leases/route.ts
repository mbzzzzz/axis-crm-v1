import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { leases, tenants, properties } from '@/db/schema-postgres';
import { eq, and } from 'drizzle-orm';
import { getAuthenticatedUser } from '@/lib/api-auth';
import { logActivityServer } from '@/lib/audit-log';

export async function GET(request: NextRequest) {
  try {
    // Support tenant portal access via JWT token
    const authHeader = request.headers.get('authorization');
    let user: any = null;
    let userId: string | null = null;
    let tenantIdFromToken: number | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      try {
        const { verifyTenantToken } = await import('@/lib/tenant-auth');
        const token = authHeader.substring(7);
        const payload = verifyTenantToken(token);
        if (payload) {
          tenantIdFromToken = payload.tenantId;
        }
      } catch (e) {
        // Not a tenant token, try regular auth
      }
    }

    if (!tenantIdFromToken) {
      user = await getAuthenticatedUser();
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = user.id;
    }

    const searchParams = request.nextUrl.searchParams;
    const tenantId = searchParams.get('tenantId') || (tenantIdFromToken ? tenantIdFromToken.toString() : null);
    const propertyId = searchParams.get('propertyId');
    const status = searchParams.get('status');

    let query = db
      .select({
        id: leases.id,
        userId: leases.userId,
        tenantId: leases.tenantId,
        propertyId: leases.propertyId,
        leaseType: leases.leaseType,
        startDate: leases.startDate,
        endDate: leases.endDate,
        monthlyRent: leases.monthlyRent,
        deposit: leases.deposit,
        terms: leases.terms,
        status: leases.status,
        signedByTenant: leases.signedByTenant,
        signedByOwner: leases.signedByOwner,
        signedAt: leases.signedAt,
        documentUrl: leases.documentUrl,
        createdAt: leases.createdAt,
        updatedAt: leases.updatedAt,
        tenant: {
          id: tenants.id,
          name: tenants.name,
          email: tenants.email,
        },
        property: {
          id: properties.id,
          title: properties.title,
          address: properties.address,
        },
      })
      .from(leases)
      .leftJoin(tenants, eq(leases.tenantId, tenants.id))
      .leftJoin(properties, eq(leases.propertyId, properties.id))
      .where(userId ? eq(leases.userId, userId) : undefined as any);

    // Apply filters
    const conditions: any[] = [];
    if (userId) {
      conditions.push(eq(leases.userId, userId));
    } else if (tenantId) {
      // For tenant portal, filter by tenantId only
      conditions.push(eq(leases.tenantId, parseInt(tenantId)));
    }
    if (propertyId) {
      conditions.push(eq(leases.propertyId, parseInt(propertyId)));
    }
    if (status) {
      conditions.push(eq(leases.status, status));
    }

    if (conditions.length > 0) {
      query = query.where(conditions.length === 1 ? conditions[0] : and(...conditions)) as any;
    } else if (!userId && !tenantId) {
      // No access without user or tenant ID
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results = await query;

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching leases:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leases' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      tenantId,
      propertyId,
      leaseType,
      startDate,
      endDate,
      monthlyRent,
      deposit,
      terms,
    } = body;

    // Validation
    if (!tenantId || !propertyId || !leaseType || !startDate || !endDate || !monthlyRent) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!['residential', 'commercial'].includes(leaseType)) {
      return NextResponse.json(
        { error: 'Invalid lease type. Must be residential or commercial' },
        { status: 400 }
      );
    }

    // Verify tenant and property belong to user
    const tenant = await db
      .select()
      .from(tenants)
      .where(and(eq(tenants.id, tenantId), eq(tenants.userId, user.id)))
      .limit(1);

    if (tenant.length === 0) {
      return NextResponse.json(
        { error: 'Tenant not found or access denied' },
        { status: 404 }
      );
    }

    const property = await db
      .select()
      .from(properties)
      .where(and(eq(properties.id, propertyId), eq(properties.userId, user.id)))
      .limit(1);

    if (property.length === 0) {
      return NextResponse.json(
        { error: 'Property not found or access denied' },
        { status: 404 }
      );
    }

    // Create lease
    const newLease = await db
      .insert(leases)
      .values({
        userId: user.id,
        tenantId,
        propertyId,
        leaseType,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        monthlyRent,
        deposit: deposit || null,
        terms: terms || null,
        status: 'draft',
        signedByTenant: 0,
        signedByOwner: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    await logActivityServer(
      user.id,
      'create',
      'property',
      `Created lease for tenant ${tenant[0].name}`,
      newLease[0].id,
      { leaseType, startDate, endDate }
    );

    return NextResponse.json(newLease[0], { status: 201 });
  } catch (error) {
    console.error('Error creating lease:', error);
    return NextResponse.json(
      { error: 'Failed to create lease' },
      { status: 500 }
    );
  }
}

