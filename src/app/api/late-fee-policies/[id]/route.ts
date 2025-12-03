import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { lateFeePolicies } from '@/db/schema-postgres';
import { eq, and } from 'drizzle-orm';
import { getAuthenticatedUser } from '@/lib/api-auth';
import { logActivityServer } from '@/lib/audit-log';

export async function GET(
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

    const policy = await db
      .select()
      .from(lateFeePolicies)
      .where(and(eq(lateFeePolicies.id, id), eq(lateFeePolicies.userId, user.id)))
      .limit(1);

    if (policy.length === 0) {
      return NextResponse.json({ error: 'Policy not found' }, { status: 404 });
    }

    return NextResponse.json(policy[0]);
  } catch (error) {
    console.error('Error fetching late fee policy:', error);
    return NextResponse.json(
      { error: 'Failed to fetch late fee policy' },
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
    const { name, type, gracePeriodDays, amount, percentage, maxCap, isDefault } = body;

    // Verify ownership
    const existing = await db
      .select()
      .from(lateFeePolicies)
      .where(and(eq(lateFeePolicies.id, id), eq(lateFeePolicies.userId, user.id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Policy not found' }, { status: 404 });
    }

    // If setting as default, unset other defaults
    if (isDefault && existing[0].isDefault === 0) {
      await db
        .update(lateFeePolicies)
        .set({ isDefault: 0 })
        .where(and(eq(lateFeePolicies.userId, user.id), eq(lateFeePolicies.isDefault, 1)));
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (gracePeriodDays !== undefined) updateData.gracePeriodDays = gracePeriodDays;
    if (amount !== undefined) updateData.amount = amount;
    if (percentage !== undefined) updateData.percentage = percentage;
    if (maxCap !== undefined) updateData.maxCap = maxCap;
    if (isDefault !== undefined) updateData.isDefault = isDefault ? 1 : 0;

    const updated = await db
      .update(lateFeePolicies)
      .set(updateData)
      .where(eq(lateFeePolicies.id, id))
      .returning();

    await logActivityServer(
      user.id,
      'update',
      'invoice',
      `Updated late fee policy: ${updated[0].name}`,
      id,
      updateData
    );

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('Error updating late fee policy:', error);
    return NextResponse.json(
      { error: 'Failed to update late fee policy' },
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
      .from(lateFeePolicies)
      .where(and(eq(lateFeePolicies.id, id), eq(lateFeePolicies.userId, user.id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Policy not found' }, { status: 404 });
    }

    await db
      .delete(lateFeePolicies)
      .where(eq(lateFeePolicies.id, id));

    await logActivityServer(
      user.id,
      'delete',
      'invoice',
      `Deleted late fee policy: ${existing[0].name}`,
      id
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting late fee policy:', error);
    return NextResponse.json(
      { error: 'Failed to delete late fee policy' },
      { status: 500 }
    );
  }
}

