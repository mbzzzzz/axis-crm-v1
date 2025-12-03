import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { invoices, lateFeePolicies, tenants, properties } from '@/db/schema-postgres';
import { eq, and, lte, gte, isNull } from 'drizzle-orm';
import { sendLateFeeNotification } from '@/lib/email/notifications';

/**
 * Vercel Cron Job: Apply late fees to overdue invoices
 * Runs daily at 2 AM UTC
 * 
 * To test locally: curl http://localhost:3000/api/cron/late-fees?secret=YOUR_SECRET
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (set in Vercel environment variables)
    const authHeader = request.headers.get('authorization');
    const secret = request.nextUrl.searchParams.get('secret') || authHeader?.replace('Bearer ', '');
    const expectedSecret = process.env.CRON_SECRET || process.env.VERCEL_CRON_SECRET;

    if (expectedSecret && secret !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results = {
      processed: 0,
      feesApplied: 0,
      errors: [] as Array<{ invoiceId: number; error: string }>,
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find all overdue invoices that haven't had late fees applied yet
    // Include invoices that are overdue (due date passed) and not paid
    const overdueInvoices = await db
      .select({
        invoice: invoices,
        tenant: tenants,
        property: properties,
      })
      .from(invoices)
      .leftJoin(tenants, eq(invoices.tenantId, tenants.id))
      .leftJoin(properties, eq(invoices.propertyId, properties.id))
      .where(
        and(
          // Not paid
          eq(invoices.paymentStatus, 'overdue'),
          // Due date has passed
          lte(invoices.dueDate, today.toISOString().split('T')[0]),
          // Only process invoices without late fees applied yet
          isNull(invoices.lateFeeAppliedAt)
        )
      );

    // Get default late fee policy for each user
    const userIds = [...new Set(overdueInvoices.map(inv => inv.invoice.userId))];
    const policiesByUser = new Map<string, any>();

    for (const userId of userIds) {
      const policy = await db
        .select()
        .from(lateFeePolicies)
        .where(and(eq(lateFeePolicies.userId, userId), eq(lateFeePolicies.isDefault, 1)))
        .limit(1);

      if (policy.length > 0) {
        policiesByUser.set(userId, policy[0]);
      }
    }

    // Process each overdue invoice
    for (const { invoice, tenant, property } of overdueInvoices) {
      results.processed++;

      try {
        const policy = policiesByUser.get(invoice.userId);
        if (!policy) {
          // No policy configured for this user
          continue;
        }

        // Calculate days overdue
        const dueDate = new Date(invoice.dueDate);
        const daysOverdue = Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

        // Check grace period
        if (daysOverdue <= policy.gracePeriodDays) {
          continue; // Still within grace period
        }

        // Calculate late fee
        let lateFeeAmount = 0;

        if (policy.type === 'flat') {
          lateFeeAmount = policy.amount || 0;
        } else if (policy.type === 'percentage') {
          const percentage = policy.percentage || 0;
          lateFeeAmount = (invoice.totalAmount * percentage) / 100;
        }

        // Apply max cap if set
        if (policy.maxCap && lateFeeAmount > policy.maxCap) {
          lateFeeAmount = policy.maxCap;
        }

        // Only apply if amount > 0
        if (lateFeeAmount > 0) {
          const newTotalAmount = invoice.totalAmount + lateFeeAmount;
          
          // Update invoice with late fee
          await db
            .update(invoices)
            .set({
              lateFeeAmount: lateFeeAmount,
              totalAmount: newTotalAmount,
              lateFeeAppliedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(invoices.id, invoice.id));

          results.feesApplied++;

          // Send email notification to tenant
          if (tenant && tenant.email) {
            try {
              await sendLateFeeNotification(
                invoice.userId,
                invoice.id,
                invoice.invoiceNumber,
                tenant.email,
                tenant.name,
                lateFeeAmount,
                newTotalAmount,
                invoice.dueDate,
                daysOverdue
              );
            } catch (error) {
              console.error(`Error sending late fee notification for invoice ${invoice.id}:`, error);
              // Don't fail the process if email fails
            }
          }
        }
      } catch (error: any) {
        results.errors.push({
          invoiceId: invoice.id,
          error: error.message || 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...results,
    });
  } catch (error: any) {
    console.error('Late fee cron job error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to process late fees',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

