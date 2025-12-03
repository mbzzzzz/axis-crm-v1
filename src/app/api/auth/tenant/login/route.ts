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

    // Authenticate using tenant auth system
    const result = await authenticateTenant(email, password);

    if (!result) {
      return NextResponse.json(
        { error: 'Invalid email or password', success: false },
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

