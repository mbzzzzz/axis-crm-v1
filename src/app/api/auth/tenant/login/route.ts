import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tenants } from '@/db/schema-postgres';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXT_PUBLIC_JWT_SECRET || 'your-secret-key-change-in-production';

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

    // Find tenant by email
    const tenant = await db
      .select()
      .from(tenants)
      .where(eq(tenants.email, email.trim().toLowerCase()))
      .limit(1);

    if (tenant.length === 0) {
      return NextResponse.json(
        { error: 'Invalid email or password', success: false },
        { status: 401 }
      );
    }

    const tenantData = tenant[0];

    // For now, we'll use a simple password check
    // In production, you should hash passwords when creating tenants
    // For MVP: Check if password matches a default or stored hash
    // TODO: Implement proper password hashing for tenants
    
    // Temporary: For MVP, allow login with email only (no password check)
    // In production, implement proper password authentication
    const passwordValid = true; // TODO: Implement bcrypt.compare(password, tenantData.passwordHash)

    if (!passwordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password', success: false },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        tenantId: tenantData.id,
        email: tenantData.email,
        type: 'tenant',
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Return tenant data (excluding sensitive info)
    const { userId, ...tenantResponse } = tenantData;

    return NextResponse.json({
      success: true,
      token,
      tenant: tenantResponse,
    }, { status: 200 });
  } catch (error) {
    console.error('Tenant login error:', error);
    return NextResponse.json(
      { error: 'Internal server error', success: false },
      { status: 500 }
    );
  }
}

