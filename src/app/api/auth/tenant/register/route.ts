import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tenants, tenantAuth } from '@/db/schema-postgres';
import { eq } from 'drizzle-orm';
import { createTenantAuth } from '@/lib/tenant-auth';
import { verifyTenantRegistrationToken } from '@/lib/tenant-registration';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, tenantId, token } = body;

    // Validate required fields
    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: 'Email is required', success: false },
        { status: 400 }
      );
    }

    if (!password || !password.trim()) {
      return NextResponse.json(
        { error: 'Password is required', success: false },
        { status: 400 }
      );
    }

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required', success: false },
        { status: 400 }
      );
    }

    // Parse and validate tenantId
    const tenantIdInt = typeof tenantId === 'number' ? tenantId : parseInt(tenantId);
    if (isNaN(tenantIdInt) || tenantIdInt <= 0) {
      return NextResponse.json(
        { error: 'Valid tenant ID is required', success: false },
        { status: 400 }
      );
    }

    // Verify registration token if provided
    if (token) {
      const tokenPayload = verifyTenantRegistrationToken(token);
      if (!tokenPayload) {
        return NextResponse.json(
          { error: 'Invalid or expired registration token', success: false },
          { status: 400 }
        );
      }
      if (tokenPayload.tenantId !== tenantIdInt) {
        return NextResponse.json(
          { error: 'Token does not match tenant ID', success: false },
          { status: 400 }
        );
      }
      if (tokenPayload.email.toLowerCase().trim() !== email.toLowerCase().trim()) {
        return NextResponse.json(
          { error: 'Token email does not match provided email', success: false },
          { status: 400 }
        );
      }
    }

    // Trim email for consistency
    const trimmedEmail = email.trim();

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters', success: false },
        { status: 400 }
      );
    }

    // Verify tenant exists and email matches
    const tenant = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantIdInt))
      .limit(1);

    if (tenant.length === 0) {
      return NextResponse.json(
        { error: 'Tenant not found', success: false },
        { status: 404 }
      );
    }

    if (tenant[0].email.toLowerCase().trim() !== trimmedEmail.toLowerCase().trim()) {
      return NextResponse.json(
        { error: 'Email does not match tenant record', success: false },
        { status: 400 }
      );
    }

    // Check if auth already exists
    const existingAuth = await db
      .select()
      .from(tenantAuth)
      .where(eq(tenantAuth.tenantId, tenantIdInt))
      .limit(1);

    if (existingAuth.length > 0) {
      return NextResponse.json(
        { error: 'Account already exists. Please login instead.', success: false },
        { status: 400 }
      );
    }

    // Create tenant auth account
    await createTenantAuth(tenantIdInt, trimmedEmail, password);

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
    });
  } catch (error: any) {
    console.error('Tenant registration error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create account', success: false },
      { status: 500 }
    );
  }
}

