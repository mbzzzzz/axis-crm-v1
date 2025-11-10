import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { invoices, properties } from '@/db/schema';
import { eq, like, and, or, desc } from 'drizzle-orm';
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

// Validation helpers
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidISODate(dateString: string): boolean {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime()) && dateString === date.toISOString().split('T')[0];
}

const VALID_PAYMENT_STATUSES = ['draft', 'sent', 'paid', 'overdue', 'cancelled'];

export async function GET(request: NextRequest) {
  try {
    // CRITICAL: Authenticate user first
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single invoice by ID - with ownership check
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      // CRITICAL: Filter by userId to ensure data isolation
      const invoice = await db.select()
        .from(invoices)
        .where(
          and(
            eq(invoices.id, parseInt(id)),
            eq(invoices.userId, user.id)
          )
        )
        .limit(1);

      if (invoice.length === 0) {
        return NextResponse.json({ 
          error: 'Invoice not found',
          code: 'NOT_FOUND' 
        }, { status: 404 });
      }

      return NextResponse.json(invoice[0], { status: 200 });
    }

    // List invoices - CRITICAL: Only return current user's invoices
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '100'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const paymentStatus = searchParams.get('paymentStatus');
    const propertyId = searchParams.get('propertyId');

    const conditions = [
      eq(invoices.userId, user.id)
    ];

    // Search across invoiceNumber, clientName, clientEmail
    if (search) {
      conditions.push(
        or(
          like(invoices.invoiceNumber, `%${search}%`),
          like(invoices.clientName, `%${search}%`),
          like(invoices.clientEmail, `%${search}%`)
        )
      );
    }

    // Filter by paymentStatus
    if (paymentStatus) {
      conditions.push(eq(invoices.paymentStatus, paymentStatus));
    }

    // Filter by propertyId
    if (propertyId) {
      const propertyIdInt = parseInt(propertyId);
      if (!isNaN(propertyIdInt)) {
        conditions.push(eq(invoices.propertyId, propertyIdInt));
      }
    }

    const results = await db.select()
      .from(invoices)
      .where(and(...conditions))
      .orderBy(desc(invoices.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // CRITICAL: Authenticate user first
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      invoiceNumber,
      propertyId,
      clientName,
      clientEmail,
      clientAddress,
      invoiceDate,
      dueDate,
      subtotal,
      taxRate,
      taxAmount,
      totalAmount,
      paymentStatus,
      paymentDate,
      notes,
      items
    } = body;

    // Validate required fields
    if (!invoiceNumber?.trim()) {
      return NextResponse.json({ 
        error: "Invoice number is required",
        code: "MISSING_INVOICE_NUMBER" 
      }, { status: 400 });
    }

    if (!propertyId || isNaN(parseInt(propertyId))) {
      return NextResponse.json({ 
        error: "Valid property ID is required",
        code: "INVALID_PROPERTY_ID" 
      }, { status: 400 });
    }

    if (!clientName?.trim()) {
      return NextResponse.json({ 
        error: "Client name is required",
        code: "MISSING_CLIENT_NAME" 
      }, { status: 400 });
    }

    if (!clientEmail?.trim()) {
      return NextResponse.json({ 
        error: "Client email is required",
        code: "MISSING_CLIENT_EMAIL" 
      }, { status: 400 });
    }

    if (!isValidEmail(clientEmail.trim())) {
      return NextResponse.json({ 
        error: "Invalid email format",
        code: "INVALID_EMAIL" 
      }, { status: 400 });
    }

    if (!invoiceDate) {
      return NextResponse.json({ 
        error: "Invoice date is required",
        code: "MISSING_INVOICE_DATE" 
      }, { status: 400 });
    }

    if (!isValidISODate(invoiceDate)) {
      return NextResponse.json({ 
        error: "Invalid invoice date format. Use ISO date format (YYYY-MM-DD)",
        code: "INVALID_INVOICE_DATE" 
      }, { status: 400 });
    }

    if (!dueDate) {
      return NextResponse.json({ 
        error: "Due date is required",
        code: "MISSING_DUE_DATE" 
      }, { status: 400 });
    }

    if (!isValidISODate(dueDate)) {
      return NextResponse.json({ 
        error: "Invalid due date format. Use ISO date format (YYYY-MM-DD)",
        code: "INVALID_DUE_DATE" 
      }, { status: 400 });
    }

    if (subtotal === undefined || subtotal === null || isNaN(parseFloat(subtotal)) || parseFloat(subtotal) < 0) {
      return NextResponse.json({ 
        error: "Valid non-negative subtotal is required",
        code: "INVALID_SUBTOTAL" 
      }, { status: 400 });
    }

    if (taxRate === undefined || taxRate === null || isNaN(parseFloat(taxRate)) || parseFloat(taxRate) < 0) {
      return NextResponse.json({ 
        error: "Valid non-negative tax rate is required",
        code: "INVALID_TAX_RATE" 
      }, { status: 400 });
    }

    if (taxAmount === undefined || taxAmount === null || isNaN(parseFloat(taxAmount)) || parseFloat(taxAmount) < 0) {
      return NextResponse.json({ 
        error: "Valid non-negative tax amount is required",
        code: "INVALID_TAX_AMOUNT" 
      }, { status: 400 });
    }

    if (totalAmount === undefined || totalAmount === null || isNaN(parseFloat(totalAmount)) || parseFloat(totalAmount) < 0) {
      return NextResponse.json({ 
        error: "Valid non-negative total amount is required",
        code: "INVALID_TOTAL_AMOUNT" 
      }, { status: 400 });
    }

    if (!paymentStatus?.trim()) {
      return NextResponse.json({ 
        error: "Payment status is required",
        code: "MISSING_PAYMENT_STATUS" 
      }, { status: 400 });
    }

    if (!VALID_PAYMENT_STATUSES.includes(paymentStatus.trim())) {
      return NextResponse.json({ 
        error: `Payment status must be one of: ${VALID_PAYMENT_STATUSES.join(', ')}`,
        code: "INVALID_PAYMENT_STATUS" 
      }, { status: 400 });
    }

    if (paymentDate && !isValidISODate(paymentDate)) {
      return NextResponse.json({ 
        error: "Invalid payment date format. Use ISO date format (YYYY-MM-DD)",
        code: "INVALID_PAYMENT_DATE" 
      }, { status: 400 });
    }

    // CRITICAL: Check if property exists AND belongs to current user
    const propertyExists = await db.select()
      .from(properties)
      .where(
        and(
          eq(properties.id, parseInt(propertyId)),
          eq(properties.userId, currentUser.id)
        )
      )
      .limit(1);

    if (propertyExists.length === 0) {
      return NextResponse.json({ 
        error: "Property not found or you don't have access to it",
        code: "PROPERTY_NOT_FOUND" 
      }, { status: 400 });
    }

    // Check if invoice number is unique for this user
    const existingInvoice = await db.select()
      .from(invoices)
      .where(
        and(
          eq(invoices.invoiceNumber, invoiceNumber.trim()),
          eq(invoices.userId, user.id)
        )
      )
      .limit(1);

    if (existingInvoice.length > 0) {
      return NextResponse.json({ 
        error: "Invoice number already exists",
        code: "DUPLICATE_INVOICE_NUMBER" 
      }, { status: 400 });
    }

    // Prepare insert data - CRITICAL: Use authenticated user's ID
    const now = new Date().toISOString();
    const insertData: any = {
      invoiceNumber: invoiceNumber.trim(),
      propertyId: parseInt(propertyId),
      userId: user.id,
      clientName: clientName.trim(),
      clientEmail: clientEmail.trim().toLowerCase(),
      clientAddress: clientAddress?.trim() || null,
      invoiceDate,
      dueDate,
      subtotal: parseFloat(subtotal),
      taxRate: parseFloat(taxRate),
      taxAmount: parseFloat(taxAmount),
      totalAmount: parseFloat(totalAmount),
      paymentStatus: paymentStatus.trim(),
      paymentDate: paymentDate || null,
      notes: notes?.trim() || null,
      items: items || null,
      createdAt: now,
      updatedAt: now
    };

    const newInvoice = await db.insert(invoices)
      .values(insertData)
      .returning();

    return NextResponse.json(newInvoice[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // CRITICAL: Authenticate user first
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // CRITICAL: Check if invoice exists AND belongs to current user
    const existingInvoice = await db.select()
      .from(invoices)
      .where(
        and(
          eq(invoices.id, parseInt(id)),
          eq(invoices.userId, user.id)
        )
      )
      .limit(1);

    if (existingInvoice.length === 0) {
      return NextResponse.json({ 
        error: 'Invoice not found',
        code: 'NOT_FOUND' 
      }, { status: 404 });
    }

    const body = await request.json();
    const {
      invoiceNumber,
      propertyId,
      clientName,
      clientEmail,
      clientAddress,
      invoiceDate,
      dueDate,
      subtotal,
      taxRate,
      taxAmount,
      totalAmount,
      paymentStatus,
      paymentDate,
      notes,
      items
    } = body;

    const updates: any = {};

    if (invoiceNumber !== undefined) {
      if (!invoiceNumber?.trim()) {
        return NextResponse.json({ 
          error: "Invoice number cannot be empty",
          code: "INVALID_INVOICE_NUMBER" 
        }, { status: 400 });
      }

      const existingWithNumber = await db.select()
        .from(invoices)
        .where(
          and(
            eq(invoices.invoiceNumber, invoiceNumber.trim()),
            eq(invoices.userId, user.id)
          )
        )
        .limit(1);

      if (existingWithNumber.length > 0 && existingWithNumber[0].id !== parseInt(id)) {
        return NextResponse.json({ 
          error: "Invoice number already exists",
          code: "DUPLICATE_INVOICE_NUMBER" 
        }, { status: 400 });
      }

      updates.invoiceNumber = invoiceNumber.trim();
    }

    if (propertyId !== undefined) {
      if (isNaN(parseInt(propertyId))) {
        return NextResponse.json({ 
          error: "Valid property ID is required",
          code: "INVALID_PROPERTY_ID" 
        }, { status: 400 });
      }

      const propertyExists = await db.select()
        .from(properties)
        .where(
          and(
            eq(properties.id, parseInt(propertyId)),
            eq(properties.userId, currentUser.id)
          )
        )
        .limit(1);

      if (propertyExists.length === 0) {
        return NextResponse.json({ 
          error: "Property not found or you don't have access to it",
          code: "PROPERTY_NOT_FOUND" 
        }, { status: 400 });
      }

      updates.propertyId = parseInt(propertyId);
    }

    if (clientName !== undefined) {
      if (!clientName?.trim()) {
        return NextResponse.json({ 
          error: "Client name cannot be empty",
          code: "INVALID_CLIENT_NAME" 
        }, { status: 400 });
      }
      updates.clientName = clientName.trim();
    }

    if (clientEmail !== undefined) {
      if (!clientEmail?.trim()) {
        return NextResponse.json({ 
          error: "Client email cannot be empty",
          code: "INVALID_CLIENT_EMAIL" 
        }, { status: 400 });
      }

      if (!isValidEmail(clientEmail.trim())) {
        return NextResponse.json({ 
          error: "Invalid email format",
          code: "INVALID_EMAIL" 
        }, { status: 400 });
      }

      updates.clientEmail = clientEmail.trim().toLowerCase();
    }

    if (clientAddress !== undefined) {
      updates.clientAddress = clientAddress?.trim() || null;
    }

    if (invoiceDate !== undefined) {
      if (!isValidISODate(invoiceDate)) {
        return NextResponse.json({ 
          error: "Invalid invoice date format. Use ISO date format (YYYY-MM-DD)",
          code: "INVALID_INVOICE_DATE" 
        }, { status: 400 });
      }
      updates.invoiceDate = invoiceDate;
    }

    if (dueDate !== undefined) {
      if (!isValidISODate(dueDate)) {
        return NextResponse.json({ 
          error: "Invalid due date format. Use ISO date format (YYYY-MM-DD)",
          code: "INVALID_DUE_DATE" 
        }, { status: 400 });
      }
      updates.dueDate = dueDate;
    }

    if (subtotal !== undefined) {
      if (isNaN(parseFloat(subtotal)) || parseFloat(subtotal) < 0) {
        return NextResponse.json({ 
          error: "Valid non-negative subtotal is required",
          code: "INVALID_SUBTOTAL" 
        }, { status: 400 });
      }
      updates.subtotal = parseFloat(subtotal);
    }

    if (taxRate !== undefined) {
      if (isNaN(parseFloat(taxRate)) || parseFloat(taxRate) < 0) {
        return NextResponse.json({ 
          error: "Valid non-negative tax rate is required",
          code: "INVALID_TAX_RATE" 
        }, { status: 400 });
      }
      updates.taxRate = parseFloat(taxRate);
    }

    if (taxAmount !== undefined) {
      if (isNaN(parseFloat(taxAmount)) || parseFloat(taxAmount) < 0) {
        return NextResponse.json({ 
          error: "Valid non-negative tax amount is required",
          code: "INVALID_TAX_AMOUNT" 
        }, { status: 400 });
      }
      updates.taxAmount = parseFloat(taxAmount);
    }

    if (totalAmount !== undefined) {
      if (isNaN(parseFloat(totalAmount)) || parseFloat(totalAmount) < 0) {
        return NextResponse.json({ 
          error: "Valid non-negative total amount is required",
          code: "INVALID_TOTAL_AMOUNT" 
        }, { status: 400 });
      }
      updates.totalAmount = parseFloat(totalAmount);
    }

    if (paymentStatus !== undefined) {
      if (!paymentStatus?.trim()) {
        return NextResponse.json({ 
          error: "Payment status cannot be empty",
          code: "INVALID_PAYMENT_STATUS" 
        }, { status: 400 });
      }

      if (!VALID_PAYMENT_STATUSES.includes(paymentStatus.trim())) {
        return NextResponse.json({ 
          error: `Payment status must be one of: ${VALID_PAYMENT_STATUSES.join(', ')}`,
          code: "INVALID_PAYMENT_STATUS" 
        }, { status: 400 });
      }

      updates.paymentStatus = paymentStatus.trim();

      if (paymentStatus.trim() === 'paid' && !existingInvoice[0].paymentDate && !paymentDate) {
        updates.paymentDate = new Date().toISOString().split('T')[0];
      }
    }

    if (paymentDate !== undefined) {
      if (paymentDate && !isValidISODate(paymentDate)) {
        return NextResponse.json({ 
          error: "Invalid payment date format. Use ISO date format (YYYY-MM-DD)",
          code: "INVALID_PAYMENT_DATE" 
        }, { status: 400 });
      }
      updates.paymentDate = paymentDate || null;
    }

    if (notes !== undefined) {
      updates.notes = notes?.trim() || null;
    }

    if (items !== undefined) {
      updates.items = items || null;
    }

    updates.updatedAt = new Date().toISOString();

    const updatedInvoice = await db.update(invoices)
      .set(updates)
      .where(
        and(
          eq(invoices.id, parseInt(id)),
          eq(invoices.userId, user.id)
        )
      )
      .returning();

    return NextResponse.json(updatedInvoice[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // CRITICAL: Authenticate user first
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // CRITICAL: Check if invoice exists AND belongs to current user
    const existingInvoice = await db.select()
      .from(invoices)
      .where(
        and(
          eq(invoices.id, parseInt(id)),
          eq(invoices.userId, user.id)
        )
      )
      .limit(1);

    if (existingInvoice.length === 0) {
      return NextResponse.json({ 
        error: 'Invoice not found',
        code: 'NOT_FOUND' 
      }, { status: 404 });
    }

    const deleted = await db.delete(invoices)
      .where(
        and(
          eq(invoices.id, parseInt(id)),
          eq(invoices.userId, user.id)
        )
      )
      .returning();

    return NextResponse.json({
      message: 'Invoice deleted successfully',
      invoice: deleted[0]
    }, { status: 200 });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}
