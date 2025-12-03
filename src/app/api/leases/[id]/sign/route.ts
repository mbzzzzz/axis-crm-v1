import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { leases, tenants, properties } from '@/db/schema-postgres';
import { eq, and } from 'drizzle-orm';
import { getAuthenticatedUser } from '@/lib/api-auth';
import { logActivityServer } from '@/lib/audit-log';
import { uploadLeasePDF } from '@/lib/lease-storage';
import { sendLeaseSigningNotification } from '@/lib/email/notifications';
import { generateLeasePDF } from '@/lib/lease-pdf-generator';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const body = await request.json();
    const { signerType, signatureDataUrl, documentUrl } = body;

    if (!signerType || !['tenant', 'owner'].includes(signerType)) {
      return NextResponse.json(
        { error: 'Invalid signer type. Must be "tenant" or "owner"' },
        { status: 400 }
      );
    }

    // Get lease with tenant and property details
    const lease = await db
      .select({
        lease: leases,
        tenant: tenants,
        property: properties,
      })
      .from(leases)
      .leftJoin(tenants, eq(leases.tenantId, tenants.id))
      .leftJoin(properties, eq(leases.propertyId, properties.id))
      .where(and(eq(leases.id, id), eq(leases.userId, user.id)))
      .limit(1);

    if (lease.length === 0) {
      return NextResponse.json({ error: 'Lease not found' }, { status: 404 });
    }

    const leaseData = lease[0].lease;
    const tenantData = lease[0].tenant;
    const propertyData = lease[0].property;

    // Update signature status
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (signerType === 'tenant') {
      updateData.signedByTenant = 1;
    } else {
      updateData.signedByOwner = 1;
    }

    // If both parties have signed, mark as active and set signed date
    const willBeTenantSigned = signerType === 'tenant' ? 1 : leaseData.signedByTenant;
    const willBeOwnerSigned = signerType === 'owner' ? 1 : leaseData.signedByOwner;
    const isFullySigned = willBeTenantSigned === 1 && willBeOwnerSigned === 1;

    let finalDocumentUrl = documentUrl;

    // Generate and upload PDF if fully signed or if we need to store it
    if (isFullySigned && leaseData.terms) {
      try {
        const leaseNumber = `LEASE-${id}`;
        const pdf = generateLeasePDF(leaseData.terms, leaseNumber);
        const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));
        
        // Upload to Supabase Storage
        finalDocumentUrl = await uploadLeasePDF(pdfBuffer, user.id, id, leaseNumber);
      } catch (error) {
        console.error('Error uploading lease PDF:', error);
        // Continue without PDF upload - don't fail the signing
      }
    }

    if (isFullySigned) {
      updateData.status = 'active';
      updateData.signedAt = new Date();
      if (finalDocumentUrl) {
        updateData.documentUrl = finalDocumentUrl;
      }
    } else {
      updateData.status = 'pending_signature';
    }

    const updated = await db
      .update(leases)
      .set(updateData)
      .where(eq(leases.id, id))
      .returning();

    // Send email notifications
    if (tenantData) {
      try {
        let pdfBuffer: Buffer | undefined;
        if (isFullySigned && leaseData.terms) {
          try {
            const leaseNumber = `LEASE-${id}`;
            const pdf = generateLeasePDF(leaseData.terms, leaseNumber);
            pdfBuffer = Buffer.from(pdf.output('arraybuffer'));
          } catch (error) {
            console.error('Error generating PDF for email:', error);
          }
        }

        await sendLeaseSigningNotification(
          user.id,
          id,
          `LEASE-${id}`,
          tenantData.email,
          tenantData.name,
          signerType,
          isFullySigned,
          pdfBuffer
        );
      } catch (error) {
        console.error('Error sending lease signing notification:', error);
        // Don't fail the signing if email fails
      }
    }

    await logActivityServer(
      user.id,
      'update',
      'property',
      `${signerType === 'tenant' ? 'Tenant' : 'Owner'} signed lease ${id}`,
      id,
      { signerType, fullySigned: willBeTenantSigned === 1 && willBeOwnerSigned === 1 }
    );

    return NextResponse.json({
      success: true,
      lease: updated[0],
      fullySigned: willBeTenantSigned === 1 && willBeOwnerSigned === 1,
    });
  } catch (error) {
    console.error('Error signing lease:', error);
    return NextResponse.json(
      { error: 'Failed to sign lease' },
      { status: 500 }
    );
  }
}

