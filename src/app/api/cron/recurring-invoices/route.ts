import { NextRequest, NextResponse } from 'next/server';
import { processRecurringInvoices } from '@/lib/recurring-invoice-engine';

/**
 * Vercel Cron Job: Generate invoices from recurring invoice templates
 * Runs daily at 1 AM UTC
 * 
 * To test locally: curl http://localhost:3000/api/cron/recurring-invoices?secret=YOUR_SECRET
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

    // Process all recurring invoices that are due
    const results = await processRecurringInvoices();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...results,
    });
  } catch (error: any) {
    console.error('Recurring invoice cron job error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to process recurring invoices',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

