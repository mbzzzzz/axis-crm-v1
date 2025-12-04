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

    // Check if auth already exists (by tenant_id OR email to catch duplicates)
    const existingAuthByTenant = await db
      .select()
      .from(tenantAuth)
      .where(eq(tenantAuth.tenantId, tenantIdInt))
      .limit(1);

    const existingAuthByEmail = await db
      .select()
      .from(tenantAuth)
      .where(eq(tenantAuth.email, trimmedEmail.toLowerCase()))
      .limit(1);

    // If auth exists for this tenant, check if it's the same email
    if (existingAuthByTenant.length > 0) {
      if (existingAuthByTenant[0].email.toLowerCase() === trimmedEmail.toLowerCase()) {
        return NextResponse.json(
          { error: 'Account already exists. Please login instead.', success: false },
          { status: 400 }
        );
      } else {
        // Different email for same tenant - this shouldn't happen, but handle it
        return NextResponse.json(
          { error: 'This tenant already has an account with a different email.', success: false },
          { status: 400 }
        );
      }
    }

    // If email is already registered to a different tenant
    if (existingAuthByEmail.length > 0) {
      return NextResponse.json(
        { error: 'This email is already registered to a different tenant.', success: false },
        { status: 400 }
      );
    }

    // Create tenant auth account
    try {
      await createTenantAuth(tenantIdInt, trimmedEmail, password);
      
      // Verify it was created
      const verifyAuth = await db
        .select()
        .from(tenantAuth)
        .where(eq(tenantAuth.tenantId, tenantIdInt))
        .limit(1);

      if (verifyAuth.length === 0) {
        console.error('[Tenant Registration] Auth record was not created after createTenantAuth call');
        return NextResponse.json(
          { error: 'Failed to create account. Please try again.', success: false },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Account created successfully',
      });
    } catch (createError: any) {
      console.error('[Tenant Registration] Error creating auth:', createError);
      // If it's a duplicate error, provide helpful message
      if (createError.message?.includes('already exists')) {
        return NextResponse.json(
          { error: 'Account already exists. Please login instead.', success: false },
          { status: 400 }
        );
      }
      throw createError; // Re-throw to be caught by outer catch
    }
  } catch (error: any) {
    console.error('Tenant registration error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create account', success: false },
      { status: 500 }
    );
  }
}

