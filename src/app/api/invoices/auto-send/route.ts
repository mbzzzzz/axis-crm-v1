import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { invoices, properties, tenants } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { currentUser } from '@clerk/nextjs/server';

// Helper function to get current authenticated user
async function getCurrentUser() {
  const user = await currentUser();
  if (!user) return null;
  return {
    id: user.id,
    name: user.fullName || user.firstName || 'User',
    email: user.primaryEmailAddress?.emailAddress || '',
  };
}

/**
 * Auto-send monthly rent invoices
 * This endpoint should be called by a cron job (e.g., Vercel Cron, GitHub Actions, etc.)
 * It finds all active tenants and generates/sends invoices for the current month
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user (or use API key for cron jobs)
    const user = await getCurrentUser();
    
    // For cron jobs, you might want to use an API key instead
    const apiKey = request.headers.get('x-api-key');
    const isCronJob = apiKey === process.env.CRON_SECRET_KEY;

    if (!user && !isCronJob) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    // Get all active tenants (you can filter by user if needed)
    const allTenants = await db.select()
      .from(tenants)
      .where(eq(tenants.leaseStatus, 'active'));

    const results = {
      processed: 0,
      created: 0,
      sent: 0,
      errors: [] as any[],
      invoices: [] as any[]
    };

    for (const tenant of allTenants) {
      try {
        if (!tenant.propertyId || !tenant.monthlyRent) {
          continue;
        }

        // Check if invoice already exists for this month
        const invoiceNumber = `RENT-${tenant.id}-${currentYear}-${String(currentMonth).padStart(2, '0')}`;
        
        const existingInvoice = await db.select()
          .from(invoices)
          .where(eq(invoices.invoiceNumber, invoiceNumber))
          .limit(1);

        if (existingInvoice.length > 0) {
          // Invoice exists, check if it needs to be sent
          const invoice = existingInvoice[0];
          if (invoice.paymentStatus === 'draft') {
            // Send existing draft invoice
            // TODO: Implement actual email sending
            await db.update(invoices)
              .set({ 
                paymentStatus: 'sent',
                updatedAt: new Date()
              })
              .where(eq(invoices.id, invoice.id));
            
            results.sent++;
            results.invoices.push(invoice);
          }
          continue;
        }

        // Generate new invoice
        const invoiceDate = new Date(currentYear, currentMonth - 1, 1).toISOString().split('T')[0];
        const dueDate = new Date(currentYear, currentMonth - 1, 5).toISOString().split('T')[0];

        const newInvoice = await db.insert(invoices)
          .values({
            invoiceNumber,
            propertyId: tenant.propertyId,
            tenantId: tenant.id,
            userId: tenant.userId,
            clientName: tenant.name,
            clientEmail: tenant.email,
            clientPhone: tenant.phone || null,
            invoiceDate,
            dueDate,
            subtotal: tenant.monthlyRent,
            taxRate: 0,
            taxAmount: 0,
            totalAmount: tenant.monthlyRent,
            paymentStatus: 'sent', // Auto-send
            items: [{
              description: `Monthly Rent - ${new Date(currentYear, currentMonth - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}`,
              quantity: 1,
              rate: tenant.monthlyRent,
              amount: tenant.monthlyRent
            }],
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .returning();

        // TODO: Send email with invoice PDF
        // For now, we just mark it as sent

        results.created++;
        results.sent++;
        results.invoices.push(newInvoice[0]);
        results.processed++;

      } catch (error: any) {
        results.errors.push({
          tenantId: tenant.id,
          tenantName: tenant.name,
          error: error.message
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${results.processed} tenants`,
      results
    }, { status: 200 });

  } catch (error) {
    console.error('Auto-send invoices error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

