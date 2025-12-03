import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { recurringInvoices, tenants, properties } from '@/db/schema-postgres';
import { eq, and } from 'drizzle-orm';
import { getAuthenticatedUser } from '@/lib/api-auth';
import { calculateNextGenerationDate } from '@/lib/recurring-invoice-engine';
import { logActivityServer } from '@/lib/audit-log';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const tenantId = searchParams.get('tenantId');
    const propertyId = searchParams.get('propertyId');

    let query = db
      .select({
        id: recurringInvoices.id,
        userId: recurringInvoices.userId,
        tenantId: recurringInvoices.tenantId,
        propertyId: recurringInvoices.propertyId,
        invoiceTemplate: recurringInvoices.invoiceTemplate,
        frequency: recurringInvoices.frequency,
        dayOfMonth: recurringInvoices.dayOfMonth,
        startDate: recurringInvoices.startDate,
        endDate: recurringInvoices.endDate,
        isActive: recurringInvoices.isActive,
        lastGeneratedAt: recurringInvoices.lastGeneratedAt,
        nextGenerationDate: recurringInvoices.nextGenerationDate,
        createdAt: recurringInvoices.createdAt,
        updatedAt: recurringInvoices.updatedAt,
        tenant: {
          id: tenants.id,
          name: tenants.name,
          email: tenants.email,
        },
        property: {
          id: properties.id,
          title: properties.title,
          address: properties.address,
        },
      })
      .from(recurringInvoices)
      .leftJoin(tenants, eq(recurringInvoices.tenantId, tenants.id))
      .leftJoin(properties, eq(recurringInvoices.propertyId, properties.id))
      .where(eq(recurringInvoices.userId, user.id));

    if (tenantId) {
      query = query.where(and(eq(recurringInvoices.userId, user.id), eq(recurringInvoices.tenantId, parseInt(tenantId)))) as any;
    }

    if (propertyId) {
      query = query.where(and(eq(recurringInvoices.userId, user.id), eq(recurringInvoices.propertyId, parseInt(propertyId)))) as any;
    }

    const results = await query;

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching recurring invoices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recurring invoices' },
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
    const {
      tenantId,
      propertyId,
      invoiceTemplate,
      amount,
      description,
      frequency,
      dayOfMonth,
      startDate,
      endDate,
      nextInvoiceDate,
    } = body;

    // Validation
    if (!tenantId || !propertyId || !frequency || !dayOfMonth || !startDate) {
      return NextResponse.json(
        { error: 'Missing required fields: tenantId, propertyId, frequency, dayOfMonth, startDate' },
        { status: 400 }
      );
    }

    // Build invoice template from amount/description if provided, otherwise use invoiceTemplate
    let finalInvoiceTemplate = invoiceTemplate;
    if (!finalInvoiceTemplate && amount && description) {
      finalInvoiceTemplate = {
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

    if (!finalInvoiceTemplate) {
      return NextResponse.json(
        { error: 'Missing invoice template or amount/description' },
        { status: 400 }
      );
    }

    if (!['monthly', 'quarterly', 'yearly'].includes(frequency)) {
      return NextResponse.json(
        { error: 'Invalid frequency. Must be monthly, quarterly, or yearly' },
        { status: 400 }
      );
    }

    if (dayOfMonth < 1 || dayOfMonth > 31) {
      return NextResponse.json(
        { error: 'Day of month must be between 1 and 31' },
        { status: 400 }
      );
    }

    // Verify tenant and property belong to user
    const tenant = await db
      .select()
      .from(tenants)
      .where(and(eq(tenants.id, tenantId), eq(tenants.userId, user.id)))
      .limit(1);

    if (tenant.length === 0) {
      return NextResponse.json(
        { error: 'Tenant not found or access denied' },
        { status: 404 }
      );
    }

    const property = await db
      .select()
      .from(properties)
      .where(and(eq(properties.id, propertyId), eq(properties.userId, user.id)))
      .limit(1);

    if (property.length === 0) {
      return NextResponse.json(
        { error: 'Property not found or access denied' },
        { status: 404 }
      );
    }

    // Calculate next generation date
    const start = new Date(startDate);
    const { calculateNextGenerationDateFromStart } = await import('@/lib/recurring-invoice-engine');
    const nextGenDate = nextInvoiceDate ? new Date(nextInvoiceDate) : calculateNextGenerationDateFromStart(start, frequency, dayOfMonth);

    // Create recurring invoice
    const newRecurring = await db
      .insert(recurringInvoices)
      .values({
        userId: user.id,
        tenantId,
        propertyId,
        invoiceTemplate: finalInvoiceTemplate,
        frequency,
        dayOfMonth,
        startDate: start,
        endDate: endDate ? new Date(endDate) : null,
        isActive: 1,
        nextGenerationDate: nextGenDate,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    await logActivityServer(
      user.id,
      'create',
      'invoice',
      `Created recurring invoice for tenant ${tenant[0].name}`,
      newRecurring[0].id,
      { frequency, dayOfMonth }
    );

    return NextResponse.json(newRecurring[0], { status: 201 });
  } catch (error) {
    console.error('Error creating recurring invoice:', error);
    return NextResponse.json(
      { error: 'Failed to create recurring invoice' },
      { status: 500 }
    );
  }
}

