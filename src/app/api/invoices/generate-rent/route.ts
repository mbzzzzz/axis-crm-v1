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

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { tenantId, month, year } = body;

    if (!tenantId || isNaN(parseInt(tenantId))) {
      return NextResponse.json(
        { error: 'Valid tenant ID is required', code: 'INVALID_TENANT_ID' },
        { status: 400 }
      );
    }

    // Fetch tenant
    const tenant = await db.select()
      .from(tenants)
      .where(
        and(
          eq(tenants.id, parseInt(tenantId)),
          eq(tenants.userId, user.id)
        )
      )
      .limit(1);

    if (tenant.length === 0) {
      return NextResponse.json(
        { error: 'Tenant not found or you don\'t have access', code: 'TENANT_NOT_FOUND' },
        { status: 404 }
      );
    }

    const tenantData = tenant[0];

    if (!tenantData.propertyId) {
      return NextResponse.json(
        { error: 'Tenant must be associated with a property', code: 'NO_PROPERTY' },
        { status: 400 }
      );
    }

    if (!tenantData.monthlyRent) {
      return NextResponse.json(
        { error: 'Tenant must have a monthly rent amount', code: 'NO_RENT' },
        { status: 400 }
      );
    }

    // Fetch property
    const property = await db.select()
      .from(properties)
      .where(
        and(
          eq(properties.id, tenantData.propertyId),
          eq(properties.userId, user.id)
        )
      )
      .limit(1);

    if (property.length === 0) {
      return NextResponse.json(
        { error: 'Property not found', code: 'PROPERTY_NOT_FOUND' },
        { status: 404 }
      );
    }

    const propertyData = property[0];

    // Determine invoice date and due date
    const invoiceMonth = month || new Date().getMonth() + 1;
    const invoiceYear = year || new Date().getFullYear();
    const invoiceDate = new Date(invoiceYear, invoiceMonth - 1, 1).toISOString().split('T')[0];
    const dueDate = new Date(invoiceYear, invoiceMonth - 1, 5).toISOString().split('T')[0]; // Due on 5th of month

    // Generate invoice number
    const invoiceNumber = `RENT-${tenantData.id}-${invoiceYear}-${String(invoiceMonth).padStart(2, '0')}`;

    // Check if invoice already exists for this month
    const existingInvoice = await db.select()
      .from(invoices)
      .where(
        and(
          eq(invoices.invoiceNumber, invoiceNumber),
          eq(invoices.userId, user.id)
        )
      )
      .limit(1);

    if (existingInvoice.length > 0) {
      return NextResponse.json(
        { error: 'Invoice already exists for this month', code: 'DUPLICATE_INVOICE', invoice: existingInvoice[0] },
        { status: 400 }
      );
    }

    // Calculate amounts
    const subtotal = tenantData.monthlyRent;
    const taxRate = 0; // Can be configured per property/user
    const taxAmount = 0;
    const totalAmount = subtotal;

    // Create invoice
    const newInvoice = await db.insert(invoices)
      .values({
        invoiceNumber,
        propertyId: tenantData.propertyId,
        tenantId: tenantData.id,
        userId: user.id,
        clientName: tenantData.name,
        clientEmail: tenantData.email,
        clientAddress: propertyData.address,
        clientPhone: tenantData.phone || null,
        invoiceDate,
        dueDate,
        subtotal,
        taxRate,
        taxAmount,
        totalAmount,
        paymentStatus: 'draft',
        items: [{
          description: `Monthly Rent - ${new Date(invoiceYear, invoiceMonth - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}`,
          quantity: 1,
          rate: subtotal,
          amount: subtotal
        }],
        // Branding fields with defaults
        logoMode: 'text',
        logoDataUrl: null,
        logoWidth: 40,
        companyName: 'AXIS CRM',
        companyTagline: 'Real Estate Management',
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    return NextResponse.json({
      success: true,
      invoice: newInvoice[0],
      message: 'Rent invoice generated successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Generate rent invoice error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

