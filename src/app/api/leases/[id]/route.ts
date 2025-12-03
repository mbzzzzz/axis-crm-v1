import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { leases, tenants, properties } from '@/db/schema-postgres';
import { eq, and } from 'drizzle-orm';
import { getAuthenticatedUser } from '@/lib/api-auth';
import { logActivityServer } from '@/lib/audit-log';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    // Support tenant portal access
    const authHeader = request.headers.get('authorization');
    let user: any = null;
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
    }

    let leaseQuery = db
      .select()
      .from(leases)
      .where(eq(leases.id, id));

    if (tenantIdFromToken) {
      // Tenant can only access their own leases
      leaseQuery = leaseQuery.where(and(eq(leases.id, id), eq(leases.tenantId, tenantIdFromToken))) as any;
    } else if (user) {
      // Owner access
      leaseQuery = leaseQuery.where(and(eq(leases.id, id), eq(leases.userId, user.id))) as any;
    } else {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const lease = await leaseQuery.limit(1);

    if (lease.length === 0) {
      return NextResponse.json({ error: 'Lease not found' }, { status: 404 });
    }

    // Include tenant and property relations
    const leaseData = lease[0];
    const tenant = await db.select().from(tenants).where(eq(tenants.id, leaseData.tenantId)).limit(1);
    const property = await db.select().from(properties).where(eq(properties.id, leaseData.propertyId)).limit(1);

    return NextResponse.json({
      ...leaseData,
      tenant: tenant[0] || null,
      property: property[0] || null,
    });
  } catch (error) {
    console.error('Error fetching lease:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lease' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const body = await request.json();
    const {
      leaseType,
      startDate,
      endDate,
      monthlyRent,
      deposit,
      terms,
      status,
    } = body;

    // Verify ownership
    const existing = await db
      .select()
      .from(leases)
      .where(and(eq(leases.id, id), eq(leases.userId, user.id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Lease not found' }, { status: 404 });
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (leaseType !== undefined) updateData.leaseType = leaseType;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = new Date(endDate);
    if (monthlyRent !== undefined) updateData.monthlyRent = monthlyRent;
    if (deposit !== undefined) updateData.deposit = deposit;
    if (terms !== undefined) updateData.terms = terms;
    if (status !== undefined) updateData.status = status;

    const updated = await db
      .update(leases)
      .set(updateData)
      .where(eq(leases.id, id))
      .returning();

    await logActivityServer(
      user.id,
      'update',
      'property',
      `Updated lease ${id}`,
      id,
      updateData
    );

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('Error updating lease:', error);
    return NextResponse.json(
      { error: 'Failed to update lease' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    // Verify ownership
    const existing = await db
      .select()
      .from(leases)
      .where(and(eq(leases.id, id), eq(leases.userId, user.id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Lease not found' }, { status: 404 });
    }

    await db
      .delete(leases)
      .where(eq(leases.id, id));

    await logActivityServer(
      user.id,
      'delete',
      'property',
      `Deleted lease ${id}`,
      id
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting lease:', error);
    return NextResponse.json(
      { error: 'Failed to delete lease' },
      { status: 500 }
    );
  }
}

