import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { properties, tenants } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getAuthenticatedUser } from '@/lib/api-auth';

// Helper function to get current authenticated user
async function getCurrentUser() {
  const user = await getAuthenticatedUser();
  if (!user) return null;
  return {
    id: user.id,
    name: (user.user_metadata.full_name as string) || user.email || 'User',
    email: user.email || '',
  };
}

/**
 * Get all properties with their associated tenants
 * Used for maintenance request form to auto-fill property and tenant information
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Get all properties for the user
    const propertiesList = await db
      .select()
      .from(properties)
      .where(eq(properties.userId, user.id))
      .orderBy(desc(properties.createdAt));

    // Get all tenants for the user
    const tenantsList = await db
      .select()
      .from(tenants)
      .where(eq(tenants.userId, user.id));

    // Map properties with their tenants
    const propertiesWithTenants = propertiesList.map(property => {
      // Find active tenant for this property
      const tenant = tenantsList.find(
        t => t.propertyId === property.id && t.leaseStatus === 'active'
      ) || tenantsList.find(t => t.propertyId === property.id);

      return {
        ...property,
        tenant: tenant ? {
          id: tenant.id,
          name: tenant.name,
          email: tenant.email,
          phone: tenant.phone,
          leaseStatus: tenant.leaseStatus,
        } : null,
      };
    });

    return NextResponse.json(propertiesWithTenants, { status: 200 });
  } catch (error) {
    console.error('GET properties with tenants error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

