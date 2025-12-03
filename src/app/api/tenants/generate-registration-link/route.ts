import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tenants, properties } from '@/db/schema-postgres';
import { eq, and } from 'drizzle-orm';
import { getAuthenticatedUser } from '@/lib/api-auth';
import { sendTenantRegistrationInvitation } from '@/lib/email/notifications';
import { generateTenantRegistrationToken } from '@/lib/tenant-registration';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tenantId, sendEmail } = body;

    if (!tenantId || isNaN(parseInt(tenantId))) {
      return NextResponse.json(
        { error: 'Valid tenant ID is required' },
        { status: 400 }
      );
    }

    // Verify tenant belongs to user
    const tenant = await db
      .select()
      .from(tenants)
      .where(and(eq(tenants.id, parseInt(tenantId)), eq(tenants.userId, user.id)))
      .limit(1);

    if (tenant.length === 0) {
      return NextResponse.json(
        { error: 'Tenant not found or access denied' },
        { status: 404 }
      );
    }

    const tenantData = tenant[0];

    // Generate registration token
    const token = generateTenantRegistrationToken(tenantData.id, tenantData.email);

    // Create registration link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
      'http://localhost:3000';
    const registrationLink = `${baseUrl}/tenant-portal/register?tenantId=${tenantData.id}&token=${token}`;

    // Send email if requested
    if (sendEmail && tenantData.email) {
      try {
        // Get property address if available
        let propertyAddress: string | undefined;
        if (tenantData.propertyId) {
          const { properties } = await import('@/db/schema-postgres');
          const property = await db
            .select()
            .from(properties)
            .where(eq(properties.id, tenantData.propertyId))
            .limit(1);
          if (property.length > 0) {
            propertyAddress = property[0].address;
          }
        }

        await sendTenantRegistrationInvitation(
          user.id,
          tenantData.email,
          tenantData.name,
          registrationLink,
          propertyAddress
        );
      } catch (error) {
        console.error('Error sending registration email:', error);
        // Don't fail if email fails - still return the link
      }
    }

    return NextResponse.json({
      success: true,
      registrationLink,
      token,
      expiresIn: '7 days',
      tenantId: tenantData.id,
      tenantEmail: tenantData.email,
    });
  } catch (error: any) {
    console.error('Error generating registration link:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate registration link' },
      { status: 500 }
    );
  }
}

