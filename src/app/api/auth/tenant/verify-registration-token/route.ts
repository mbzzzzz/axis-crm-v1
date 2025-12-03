import { NextRequest, NextResponse } from 'next/server';
import { verifyTenantRegistrationToken } from '@/lib/tenant-registration';
import { db } from '@/db';
import { tenants } from '@/db/schema-postgres';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');
    const tenantId = searchParams.get('tenantId');

    if (!token || !tenantId) {
      return NextResponse.json(
        { valid: false, error: 'Token and tenant ID are required' },
        { status: 400 }
      );
    }

    // Verify token
    const payload = verifyTenantRegistrationToken(token);
    if (!payload) {
      return NextResponse.json({ valid: false, error: 'Invalid or expired token' });
    }

    // Verify tenant ID matches
    if (payload.tenantId !== parseInt(tenantId)) {
      return NextResponse.json({ valid: false, error: 'Token does not match tenant' });
    }

    // Verify tenant exists
    const tenant = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, payload.tenantId))
      .limit(1);

    if (tenant.length === 0) {
      return NextResponse.json({ valid: false, error: 'Tenant not found' });
    }

    // Verify email matches
    if (tenant[0].email.toLowerCase().trim() !== payload.email) {
      return NextResponse.json({ valid: false, error: 'Email mismatch' });
    }

    return NextResponse.json({
      valid: true,
      tenantId: payload.tenantId,
      email: payload.email,
    });
  } catch (error: any) {
    console.error('Error verifying registration token:', error);
    return NextResponse.json(
      { valid: false, error: error.message || 'Failed to verify token' },
      { status: 500 }
    );
  }
}

