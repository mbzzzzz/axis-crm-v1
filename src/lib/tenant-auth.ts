import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '@/db';
import { tenantAuth, tenants } from '@/db/schema-postgres';
import { eq } from 'drizzle-orm';

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXT_PUBLIC_JWT_SECRET || 'your-secret-key-change-in-production';

export interface TenantAuthPayload {
  tenantId: number;
  email: string;
  type: 'tenant';
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate JWT token for tenant
 */
export function generateTenantToken(payload: TenantAuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

/**
 * Verify and decode JWT token
 */
export function verifyTenantToken(token: string): TenantAuthPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TenantAuthPayload;
    if (decoded.type !== 'tenant') {
      return null;
    }
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Create tenant auth account
 */
export async function createTenantAuth(
  tenantId: number,
  email: string,
  password: string
): Promise<{ id: number }> {
  // Check if tenant exists
  const tenant = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  if (tenant.length === 0) {
    throw new Error('Tenant not found');
  }

  // Check if auth already exists
  const existing = await db
    .select()
    .from(tenantAuth)
    .where(eq(tenantAuth.tenantId, tenantId))
    .limit(1);

  if (existing.length > 0) {
    throw new Error('Tenant auth already exists');
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create auth record
  const newAuth = await db
    .insert(tenantAuth)
    .values({
      tenantId,
      email: email.toLowerCase().trim(),
      passwordHash,
      isActive: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return { id: newAuth[0].id };
}

/**
 * Authenticate tenant with email and password
 */
export async function authenticateTenant(
  email: string,
  password: string
): Promise<{ token: string; tenant: any } | null> {
  const auth = await db
    .select()
    .from(tenantAuth)
    .where(eq(tenantAuth.email, email.toLowerCase().trim()))
    .limit(1);

  if (auth.length === 0) {
    return null;
  }

  const authData = auth[0];

  // Check if account is active
  if (authData.isActive === 0) {
    return null;
  }

  // Verify password
  const isValid = await verifyPassword(password, authData.passwordHash);
  if (!isValid) {
    return null;
  }

  // Get tenant data
  const tenant = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, authData.tenantId))
    .limit(1);

  if (tenant.length === 0) {
    return null;
  }

  // Update last login
  await db
    .update(tenantAuth)
    .set({ lastLoginAt: new Date(), updatedAt: new Date() })
    .where(eq(tenantAuth.id, authData.id));

  // Generate token
  const token = generateTenantToken({
    tenantId: authData.tenantId,
    email: authData.email,
    type: 'tenant',
  });

  // Return tenant data (excluding sensitive info)
  const { userId, ...tenantResponse } = tenant[0];

  return {
    token,
    tenant: tenantResponse,
  };
}

/**
 * Get tenant from token
 */
export async function getTenantFromToken(token: string): Promise<any | null> {
  const payload = verifyTenantToken(token);
  if (!payload) {
    return null;
  }

  const tenant = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, payload.tenantId))
    .limit(1);

  if (tenant.length === 0) {
    return null;
  }

  const { userId, ...tenantResponse } = tenant[0];
  return tenantResponse;
}

/**
 * Update tenant password
 */
export async function updateTenantPassword(
  tenantId: number,
  currentPassword: string,
  newPassword: string
): Promise<boolean> {
  const auth = await db
    .select()
    .from(tenantAuth)
    .where(eq(tenantAuth.tenantId, tenantId))
    .limit(1);

  if (auth.length === 0) {
    return false;
  }

  // Verify current password
  const isValid = await verifyPassword(currentPassword, auth[0].passwordHash);
  if (!isValid) {
    return false;
  }

  // Hash new password
  const newHash = await hashPassword(newPassword);

  // Update password
  await db
    .update(tenantAuth)
    .set({
      passwordHash: newHash,
      updatedAt: new Date(),
    })
    .where(eq(tenantAuth.tenantId, tenantId));

  return true;
}

