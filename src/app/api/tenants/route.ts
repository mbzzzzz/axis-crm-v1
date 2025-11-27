import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tenants, properties } from '@/db/schema';
import { eq, like, and, or, desc } from 'drizzle-orm';
import { getAuthenticatedUser } from '@/lib/api-auth';

// Helper function to get current authenticated user
async function getCurrentUser() {
  const user = await getAuthenticatedUser();
  if (!user) return null;
  return {
    id: user.id,
    name: (user.user_metadata.full_name as string) || user.email || 'User',
    email: user.email || '',
  };
}

const VALID_LEASE_STATUSES = ['active', 'expired', 'pending', 'terminated'];

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const tenant = await db
        .select()
        .from(tenants)
        .where(
          and(
            eq(tenants.id, parseInt(id)),
            eq(tenants.userId, user.id)
          )
        )
        .limit(1);

      if (tenant.length === 0) {
        return NextResponse.json(
          { error: 'Tenant not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(tenant[0], { status: 200 });
    }

    const limit = Math.min(parseInt(searchParams.get('limit') ?? '100'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const leaseStatus = searchParams.get('leaseStatus');
    const propertyId = searchParams.get('propertyId');

    const conditions = [eq(tenants.userId, user.id)];

    if (search) {
      conditions.push(
        or(
          like(tenants.name, `%${search}%`),
          like(tenants.email, `%${search}%`)
        )
      );
    }

    if (leaseStatus) {
      conditions.push(eq(tenants.leaseStatus, leaseStatus));
    }

    if (propertyId) {
      const propertyIdInt = parseInt(propertyId);
      if (!isNaN(propertyIdInt)) {
        conditions.push(eq(tenants.propertyId, propertyIdInt));
      }
    }

    const results = await db
      .select()
      .from(tenants)
      .where(and(...conditions))
      .orderBy(desc(tenants.createdAt))
      .limit(limit)
      .offset(offset);

    // Join with properties to get property details
    const resultsWithProperties = await Promise.all(
      results.map(async (tenant) => {
        if (tenant.propertyId) {
          const property = await db
            .select()
            .from(properties)
            .where(eq(properties.id, tenant.propertyId))
            .limit(1);
          return {
            ...tenant,
            property: property[0] || null,
          };
        }
        return { ...tenant, property: null };
      })
    );

    return NextResponse.json(resultsWithProperties, { status: 200 });
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
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const body = await request.json();

    if (!body.name?.trim()) {
      return NextResponse.json(
        { error: 'Name is required', code: 'MISSING_NAME' },
        { status: 400 }
      );
    }

    if (!body.email?.trim()) {
      return NextResponse.json(
        { error: 'Email is required', code: 'MISSING_EMAIL' },
        { status: 400 }
      );
    }

    if (!body.leaseStart) {
      return NextResponse.json(
        { error: 'Lease start date is required', code: 'MISSING_LEASE_START' },
        { status: 400 }
      );
    }

    if (!body.leaseEnd) {
      return NextResponse.json(
        { error: 'Lease end date is required', code: 'MISSING_LEASE_END' },
        { status: 400 }
      );
    }

    if (!body.leaseStatus || !VALID_LEASE_STATUSES.includes(body.leaseStatus)) {
      return NextResponse.json(
        { error: `Lease status must be one of: ${VALID_LEASE_STATUSES.join(', ')}`, code: 'INVALID_LEASE_STATUS' },
        { status: 400 }
      );
    }

    if (body.propertyId) {
      const propertyIdInt = parseInt(body.propertyId);
      if (!isNaN(propertyIdInt)) {
        const propertyExists = await db
          .select()
          .from(properties)
          .where(
            and(
              eq(properties.id, propertyIdInt),
              eq(properties.userId, user.id)
            )
          )
          .limit(1);

        if (propertyExists.length === 0) {
          return NextResponse.json(
            { error: 'Property not found', code: 'PROPERTY_NOT_FOUND' },
            { status: 400 }
          );
        }
      }
    }

    const now = new Date();
    const insertData: any = {
      userId: user.id,
      name: body.name.trim(),
      email: body.email.trim(),
      phone: body.phone?.trim() || null,
      leaseStart: body.leaseStart,
      leaseEnd: body.leaseEnd,
      leaseStatus: body.leaseStatus,
      monthlyRent: body.monthlyRent ? parseFloat(body.monthlyRent) : null,
      deposit: body.deposit ? parseFloat(body.deposit) : null,
      notes: body.notes?.trim() || null,
      createdAt: now,
      updatedAt: now,
    };

    if (body.propertyId) {
      const propertyIdInt = parseInt(body.propertyId);
      if (!isNaN(propertyIdInt)) {
        insertData.propertyId = propertyIdInt;
      }
    }

    const newTenant = await db.insert(tenants).values(insertData).returning();

    return NextResponse.json(newTenant[0], { status: 201 });
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

    const existingTenant = await db
      .select()
      .from(tenants)
      .where(
        and(
          eq(tenants.id, parseInt(id)),
          eq(tenants.userId, user.id)
        )
      )
      .limit(1);

    if (existingTenant.length === 0) {
      return NextResponse.json(
        { error: 'Tenant not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const updates: any = {
      updatedAt: new Date(),
    };

    if (body.name !== undefined) {
      if (!body.name.trim()) {
        return NextResponse.json(
          { error: 'Name cannot be empty', code: 'INVALID_NAME' },
          { status: 400 }
        );
      }
      updates.name = body.name.trim();
    }

    if (body.email !== undefined) {
      if (!body.email.trim()) {
        return NextResponse.json(
          { error: 'Email cannot be empty', code: 'INVALID_EMAIL' },
          { status: 400 }
        );
      }
      updates.email = body.email.trim();
    }

    if (body.phone !== undefined) {
      updates.phone = body.phone?.trim() || null;
    }

    if (body.leaseStart !== undefined) {
      updates.leaseStart = body.leaseStart;
    }

    if (body.leaseEnd !== undefined) {
      updates.leaseEnd = body.leaseEnd;
    }

    if (body.leaseStatus !== undefined) {
      if (!VALID_LEASE_STATUSES.includes(body.leaseStatus)) {
        return NextResponse.json(
          { error: `Lease status must be one of: ${VALID_LEASE_STATUSES.join(', ')}`, code: 'INVALID_LEASE_STATUS' },
          { status: 400 }
        );
      }
      updates.leaseStatus = body.leaseStatus;
    }

    if (body.monthlyRent !== undefined) {
      updates.monthlyRent = body.monthlyRent ? parseFloat(body.monthlyRent) : null;
    }

    if (body.deposit !== undefined) {
      updates.deposit = body.deposit ? parseFloat(body.deposit) : null;
    }

    if (body.notes !== undefined) {
      updates.notes = body.notes?.trim() || null;
    }

    if (body.propertyId !== undefined) {
      if (body.propertyId === null) {
        updates.propertyId = null;
      } else {
        const propertyIdInt = parseInt(body.propertyId);
        if (!isNaN(propertyIdInt)) {
          const propertyExists = await db
            .select()
            .from(properties)
            .where(
              and(
                eq(properties.id, propertyIdInt),
                eq(properties.userId, user.id)
              )
            )
            .limit(1);

          if (propertyExists.length === 0) {
            return NextResponse.json(
              { error: 'Property not found', code: 'PROPERTY_NOT_FOUND' },
              { status: 400 }
            );
          }
          updates.propertyId = propertyIdInt;
        }
      }
    }

    const updatedTenant = await db
      .update(tenants)
      .set(updates)
      .where(
        and(
          eq(tenants.id, parseInt(id)),
          eq(tenants.userId, user.id)
        )
      )
      .returning();

    return NextResponse.json(updatedTenant[0], { status: 200 });
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

    const existingTenant = await db
      .select()
      .from(tenants)
      .where(
        and(
          eq(tenants.id, parseInt(id)),
          eq(tenants.userId, user.id)
        )
      )
      .limit(1);

    if (existingTenant.length === 0) {
      return NextResponse.json(
        { error: 'Tenant not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const deleted = await db
      .delete(tenants)
      .where(
        and(
          eq(tenants.id, parseInt(id)),
          eq(tenants.userId, user.id)
        )
      )
      .returning();

    return NextResponse.json(
      {
        message: 'Tenant deleted successfully',
        tenant: deleted[0],
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

