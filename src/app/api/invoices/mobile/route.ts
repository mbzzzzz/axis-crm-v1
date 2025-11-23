import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { invoices, tenants } from '@/db/schema-postgres';
import { eq, and, desc } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

async function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded.type !== 'tenant') return null;
    return decoded;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const decoded = await verifyToken(request);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const tenantEmail = searchParams.get('tenantEmail');

    if (!tenantEmail) {
      return NextResponse.json(
        { error: 'Tenant email is required', code: 'MISSING_EMAIL' },
        { status: 400 }
      );
    }

    // Verify email matches token
    if (tenantEmail.toLowerCase() !== decoded.email.toLowerCase()) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 403 }
      );
    }

    // Find tenant by email
    const tenant = await db
      .select()
      .from(tenants)
      .where(eq(tenants.email, tenantEmail.toLowerCase()))
      .limit(1);

    if (tenant.length === 0) {
      return NextResponse.json(
        { error: 'Tenant not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const tenantId = tenant[0].id;

    // Fetch invoices for this tenant
    const tenantInvoices = await db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        invoiceDate: invoices.invoiceDate,
        dueDate: invoices.dueDate,
        totalAmount: invoices.totalAmount,
        paymentStatus: invoices.paymentStatus,
      })
      .from(invoices)
      .where(eq(invoices.tenantId, tenantId))
      .orderBy(desc(invoices.invoiceDate));

    return NextResponse.json(tenantInvoices, { status: 200 });
  } catch (error) {
    console.error('GET invoices mobile error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

