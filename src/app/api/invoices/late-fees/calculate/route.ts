import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { invoices, tenants } from '@/db/schema-postgres';
import { eq } from 'drizzle-orm';
import { getAuthenticatedUser } from '@/lib/api-auth';
import {
  getTenantLateFeePolicy,
  calculateLateFee,
  calculateDaysOverdue,
  shouldApplyLateFee,
} from '@/lib/late-fee-calculator';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { invoiceId } = body;

    if (!invoiceId) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 });
    }

    // Get invoice
    const invoice = await db
      .select()
      .from(invoices)
      .where(and(eq(invoices.id, invoiceId), eq(invoices.userId, user.id)))
      .limit(1);

    if (invoice.length === 0) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const invoiceData = invoice[0];

    // Check if late fee should be applied
    if (!shouldApplyLateFee({
      dueDate: invoiceData.dueDate,
      paymentStatus: invoiceData.paymentStatus,
      lateFeeAppliedAt: invoiceData.lateFeeAppliedAt,
    })) {
      return NextResponse.json({
        invoiceId,
        lateFeeAmount: 0,
        daysOverdue: calculateDaysOverdue(invoiceData.dueDate),
        shouldApply: false,
        reason: invoiceData.paymentStatus === 'paid' ? 'Invoice already paid' : 'Late fee already applied today',
      });
    }

    // Get tenant's late fee policy
    if (!invoiceData.tenantId) {
      return NextResponse.json({
        invoiceId,
        lateFeeAmount: 0,
        daysOverdue: calculateDaysOverdue(invoiceData.dueDate),
        shouldApply: false,
        reason: 'No tenant associated with invoice',
      });
    }

    const policy = await getTenantLateFeePolicy(invoiceData.tenantId);

    if (!policy) {
      return NextResponse.json({
        invoiceId,
        lateFeeAmount: 0,
        daysOverdue: calculateDaysOverdue(invoiceData.dueDate),
        shouldApply: false,
        reason: 'No late fee policy configured',
      });
    }

    // Calculate late fee
    const daysOverdue = calculateDaysOverdue(invoiceData.dueDate);
    const lateFeeAmount = calculateLateFee(invoiceData.totalAmount, daysOverdue, policy);

    return NextResponse.json({
      invoiceId,
      lateFeeAmount,
      daysOverdue,
      shouldApply: lateFeeAmount > 0,
      policy: {
        id: policy.id,
        name: policy.name,
        type: policy.type,
        gracePeriodDays: policy.gracePeriodDays,
      },
    });
  } catch (error) {
    console.error('Error calculating late fee:', error);
    return NextResponse.json(
      { error: 'Failed to calculate late fee' },
      { status: 500 }
    );
  }
}

