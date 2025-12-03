import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { lateFeePolicies } from '@/db/schema-postgres';
import { eq, and } from 'drizzle-orm';
import { getAuthenticatedUser } from '@/lib/api-auth';
import { logActivityServer } from '@/lib/audit-log';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const policies = await db
      .select()
      .from(lateFeePolicies)
      .where(eq(lateFeePolicies.userId, user.id));

    return NextResponse.json(policies);
  } catch (error) {
    console.error('Error fetching late fee policies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch late fee policies' },
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
    const { name, type, gracePeriodDays, amount, percentage, maxCap, isDefault } = body;

    // Validation
    if (!name || !type || gracePeriodDays === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: name, type, gracePeriodDays' },
        { status: 400 }
      );
    }

    if (!['flat', 'percentage'].includes(type)) {
      return NextResponse.json(
        { error: 'Type must be "flat" or "percentage"' },
        { status: 400 }
      );
    }

    if (type === 'flat' && (!amount || amount <= 0)) {
      return NextResponse.json(
        { error: 'Amount is required and must be greater than 0 for flat type' },
        { status: 400 }
      );
    }

    if (type === 'percentage' && (!percentage || percentage <= 0)) {
      return NextResponse.json(
        { error: 'Percentage is required and must be greater than 0 for percentage type' },
        { status: 400 }
      );
    }

    // If this is set as default, unset other defaults for this user
    if (isDefault) {
      await db
        .update(lateFeePolicies)
        .set({ isDefault: 0 })
        .where(and(eq(lateFeePolicies.userId, user.id), eq(lateFeePolicies.isDefault, 1)));
    }

    const newPolicy = await db
      .insert(lateFeePolicies)
      .values({
        userId: user.id,
        name,
        type,
        gracePeriodDays: gracePeriodDays || 0,
        amount: type === 'flat' ? amount : null,
        percentage: type === 'percentage' ? percentage : null,
        maxCap: maxCap || null,
        isDefault: isDefault ? 1 : 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    await logActivityServer(
      user.id,
      'create',
      'invoice',
      `Created late fee policy: ${name}`,
      newPolicy[0].id,
      { type, gracePeriodDays }
    );

    return NextResponse.json(newPolicy[0], { status: 201 });
  } catch (error) {
    console.error('Error creating late fee policy:', error);
    return NextResponse.json(
      { error: 'Failed to create late fee policy' },
      { status: 500 }
    );
  }
}

