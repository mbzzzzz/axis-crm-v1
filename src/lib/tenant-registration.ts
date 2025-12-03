import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXT_PUBLIC_JWT_SECRET || 'your-secret-key-change-in-production';

export interface TenantRegistrationTokenPayload {
  tenantId: number;
  email: string;
  type: 'tenant_registration';
  exp: number;
}

/**
 * Generate a registration token for tenant
 * Token expires in 7 days
 */
export function generateTenantRegistrationToken(tenantId: number, email: string): string {
  const payload: TenantRegistrationTokenPayload = {
    tenantId,
    email: email.toLowerCase().trim(),
    type: 'tenant_registration',
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days
  };

  return jwt.sign(payload, JWT_SECRET);
}

/**
 * Verify and decode tenant registration token
 */
export function verifyTenantRegistrationToken(token: string): TenantRegistrationTokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TenantRegistrationTokenPayload;
    if (decoded.type !== 'tenant_registration') {
      return null;
    }
    return decoded;
  } catch (error) {
    return null;
  }
}

