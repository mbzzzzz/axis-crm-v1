import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { invoices } from '@/db/schema-postgres';
import { eq, and } from 'drizzle-orm';
import { getAuthenticatedUser } from '@/lib/api-auth';
import {
  getTenantLateFeePolicy,
  calculateLateFee,
  calculateDaysOverdue,
  shouldApplyLateFee,
} from '@/lib/late-fee-calculator';
import { logActivityServer } from '@/lib/audit-log';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { invoiceId, force } = body;

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

    // Check if late fee should be applied (unless forced)
    if (!force && !shouldApplyLateFee({
      dueDate: invoiceData.dueDate,
      paymentStatus: invoiceData.paymentStatus,
      lateFeeAppliedAt: invoiceData.lateFeeAppliedAt,
    })) {
      return NextResponse.json({
        success: false,
        reason: invoiceData.paymentStatus === 'paid' ? 'Invoice already paid' : 'Late fee already applied today',
      });
    }

    // Get tenant's late fee policy
    if (!invoiceData.tenantId) {
      return NextResponse.json({
        success: false,
        reason: 'No tenant associated with invoice',
      });
    }

    const policy = await getTenantLateFeePolicy(invoiceData.tenantId);

    if (!policy) {
      return NextResponse.json({
        success: false,
        reason: 'No late fee policy configured',
      });
    }

    // Calculate late fee
    const daysOverdue = calculateDaysOverdue(invoiceData.dueDate);
    const lateFeeAmount = calculateLateFee(invoiceData.totalAmount, daysOverdue, policy);

    if (lateFeeAmount <= 0) {
      return NextResponse.json({
        success: false,
        reason: 'No late fee applicable (within grace period)',
      });
    }

    // Update invoice with late fee
    const updatedInvoice = await db
      .update(invoices)
      .set({
        lateFeeAmount: (invoiceData.lateFeeAmount || 0) + lateFeeAmount,
        totalAmount: invoiceData.totalAmount + lateFeeAmount,
        lateFeeAppliedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, invoiceId))
      .returning();

    await logActivityServer(
      user.id,
      'update',
      'invoice',
      `Applied late fee of ${lateFeeAmount} to invoice ${invoiceData.invoiceNumber}`,
      invoiceId,
      { lateFeeAmount, daysOverdue, policyId: policy.id }
    );

    return NextResponse.json({
      success: true,
      invoice: updatedInvoice[0],
      lateFeeAmount,
      daysOverdue,
    });
  } catch (error) {
    console.error('Error applying late fee:', error);
    return NextResponse.json(
      { error: 'Failed to apply late fee' },
      { status: 500 }
    );
  }
}

