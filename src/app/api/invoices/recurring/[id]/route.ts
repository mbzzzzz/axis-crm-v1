import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { recurringInvoices } from '@/db/schema-postgres';
import { eq, and } from 'drizzle-orm';
import { getAuthenticatedUser } from '@/lib/api-auth';
import { calculateNextGenerationDate, calculateNextGenerationDateFromStart } from '@/lib/recurring-invoice-engine';
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

    const recurring = await db
      .select()
      .from(recurringInvoices)
      .where(and(eq(recurringInvoices.id, id), eq(recurringInvoices.userId, user.id)))
      .limit(1);

    if (recurring.length === 0) {
      return NextResponse.json({ error: 'Recurring invoice not found' }, { status: 404 });
    }

    return NextResponse.json(recurring[0]);
  } catch (error) {
    console.error('Error fetching recurring invoice:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recurring invoice' },
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
      invoiceTemplate,
      amount,
      description,
      frequency,
      dayOfMonth,
      startDate,
      endDate,
      isActive,
    } = body;

    // Verify ownership
    const existing = await db
      .select()
      .from(recurringInvoices)
      .where(and(eq(recurringInvoices.id, id), eq(recurringInvoices.userId, user.id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Recurring invoice not found' }, { status: 404 });
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (invoiceTemplate !== undefined) {
      updateData.invoiceTemplate = invoiceTemplate;
    } else if (amount !== undefined && description !== undefined) {
      // Build invoice template from amount/description
      updateData.invoiceTemplate = {
        items: [
          {
            description: description,
            amount: amount,
            quantity: 1,
            rate: amount,
          }
        ],
        subtotal: amount,
        taxRate: 0,
        taxAmount: 0,
        totalAmount: amount,
        notes: description,
      };
    }
    if (frequency !== undefined) {
      updateData.frequency = frequency;
      // Recalculate next generation date if frequency changed
      const baseDate = startDate ? new Date(startDate) : existing[0].startDate;
      const day = dayOfMonth !== undefined ? dayOfMonth : existing[0].dayOfMonth;
      updateData.nextGenerationDate = calculateNextGenerationDateFromStart(baseDate, frequency, day);
    }
    if (dayOfMonth !== undefined) {
      updateData.dayOfMonth = dayOfMonth;
      // Recalculate next generation date
      const baseDate = startDate ? new Date(startDate) : existing[0].startDate;
      const freq = frequency || existing[0].frequency;
      updateData.nextGenerationDate = calculateNextGenerationDateFromStart(baseDate, freq, dayOfMonth);
    }
    if (startDate !== undefined) {
      updateData.startDate = new Date(startDate);
      // Recalculate next generation date
      const freq = frequency || existing[0].frequency;
      const day = dayOfMonth !== undefined ? dayOfMonth : existing[0].dayOfMonth;
      updateData.nextGenerationDate = calculateNextGenerationDateFromStart(new Date(startDate), freq, day);
    }
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
    if (isActive !== undefined) updateData.isActive = isActive ? 1 : 0;

    const updated = await db
      .update(recurringInvoices)
      .set(updateData)
      .where(eq(recurringInvoices.id, id))
      .returning();

    await logActivityServer(
      user.id,
      'update',
      'invoice',
      `Updated recurring invoice ${id}`,
      id,
      updateData
    );

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('Error updating recurring invoice:', error);
    return NextResponse.json(
      { error: 'Failed to update recurring invoice' },
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
      .from(recurringInvoices)
      .where(and(eq(recurringInvoices.id, id), eq(recurringInvoices.userId, user.id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Recurring invoice not found' }, { status: 404 });
    }

    await db
      .delete(recurringInvoices)
      .where(eq(recurringInvoices.id, id));

    await logActivityServer(
      user.id,
      'delete',
      'invoice',
      `Deleted recurring invoice ${id}`,
      id
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting recurring invoice:', error);
    return NextResponse.json(
      { error: 'Failed to delete recurring invoice' },
      { status: 500 }
    );
  }
}

