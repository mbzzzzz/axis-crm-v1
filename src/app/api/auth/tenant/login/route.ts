import { NextRequest, NextResponse } from 'next/server';
import { authenticateTenant } from '@/lib/tenant-auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required', success: false },
        { status: 400 }
      );
    }

    // Authenticate using tenant auth system (this handles all checks internally)
    const result = await authenticateTenant(email.trim(), password);

    if (!result) {
      // Check if tenant has registered (has auth record) for better error message
      const { db } = await import('@/db');
      const { tenantAuth } = await import('@/db/schema-postgres');
      const { eq } = await import('drizzle-orm');
      
      const normalizedEmail = email.toLowerCase().trim();
      const existingAuth = await db
        .select()
        .from(tenantAuth)
        .where(eq(tenantAuth.email, normalizedEmail))
        .limit(1);

      if (existingAuth.length === 0) {
        return NextResponse.json(
          { 
            error: 'No account found. Please register first using the registration link provided by your property manager.', 
            success: false,
            code: 'NOT_REGISTERED'
          },
          { status: 404 }
        );
      }

      // Check if account exists but is inactive
      if (existingAuth[0].isActive === 0) {
        return NextResponse.json(
          { 
            error: 'Your account has been deactivated. Please contact your property manager.', 
            success: false,
            code: 'ACCOUNT_INACTIVE'
          },
          { status: 403 }
        );
      }
      
      // If we get here, password is wrong
      return NextResponse.json(
        { error: 'Invalid email or password. Please check your credentials and try again.', success: false, code: 'INVALID_CREDENTIALS' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      token: result.token,
      tenant: result.tenant,
    }, { status: 200 });
  } catch (error) {
    console.error('Tenant login error:', error);
    return NextResponse.json(
      { error: 'Internal server error', success: false },
      { status: 500 }
    );
  }
}

