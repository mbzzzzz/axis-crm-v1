import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { invoices, properties, tenants, userPreferences } from '@/db/schema-postgres';
import { eq, and } from 'drizzle-orm';
import { getAuthenticatedUser } from '@/lib/api-auth';
import { getInvoicePDFBlob } from '@/lib/pdf-generator';
import { sendGmailEmail } from '@/lib/email/gmail';

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

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { invoiceId } = body;

    if (!invoiceId || isNaN(parseInt(invoiceId))) {
      return NextResponse.json(
        { error: 'Valid invoice ID is required', code: 'INVALID_INVOICE_ID' },
        { status: 400 }
      );
    }

    // Fetch invoice with property details
    const invoice = await db.select()
      .from(invoices)
      .where(
        and(
          eq(invoices.id, parseInt(invoiceId)),
          eq(invoices.userId, user.id)
        )
      )
      .limit(1);

    if (invoice.length === 0) {
      return NextResponse.json(
        { error: 'Invoice not found or you don\'t have access to it', code: 'INVOICE_NOT_FOUND' },
        { status: 404 }
      );
    }

    const invoiceData = invoice[0];

    // Fetch property details
    const property = await db.select()
      .from(properties)
      .where(eq(properties.id, invoiceData.propertyId))
      .limit(1);

    const propertyData = property[0] || {};

    // Fetch user preferences to get Gmail token
    const preferences = await db.select({ gmailRefreshToken: userPreferences.gmailRefreshToken })
      .from(userPreferences)
      .where(eq(userPreferences.userId, user.id))
      .limit(1);

    const userRefreshToken = preferences[0]?.gmailRefreshToken;

    // Prepare PDF data
    const pdfData = {
      invoiceNumber: invoiceData.invoiceNumber,
      invoiceDate: invoiceData.invoiceDate,
      dueDate: invoiceData.dueDate,
      propertyAddress: propertyData.address,
      propertyUnit: propertyData.unit,
      propertyType: propertyData.propertyType,
      clientName: invoiceData.clientName,
      clientEmail: invoiceData.clientEmail,
      clientAddress: invoiceData.clientAddress || undefined,
      clientPhone: invoiceData.clientPhone || undefined,
      agentName: invoiceData.agentName || undefined,
      agentAgency: invoiceData.agentAgency || undefined,
      agentEmail: invoiceData.agentEmail || undefined,
      agentPhone: invoiceData.agentPhone || undefined,
      ownerName: invoiceData.ownerName || undefined,
      ownerEmail: invoiceData.ownerEmail || undefined,
      ownerPhone: invoiceData.ownerPhone || undefined,
      items: (invoiceData.items as any) || [],
      subtotal: invoiceData.subtotal,
      taxRate: invoiceData.taxRate,
      taxAmount: invoiceData.taxAmount,
      totalAmount: invoiceData.totalAmount,
      paymentTerms: invoiceData.paymentTerms || undefined,
      lateFeePolicy: invoiceData.lateFeePolicy || undefined,
      notes: invoiceData.notes || undefined,
      // Branding
      logoMode: invoiceData.logoMode || 'text',
      logoDataUrl: invoiceData.logoDataUrl || undefined,
      logoWidth: invoiceData.logoWidth || 40,
      companyName: invoiceData.companyName || 'AXIS CRM',
      companyTagline: invoiceData.companyTagline || 'Real Estate Management',
    };

    // Generate PDF
    const pdfBlob = getInvoicePDFBlob(pdfData);
    const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer());

    if (!invoiceData.clientEmail) {
      return NextResponse.json(
        { error: 'Client email is missing for this invoice', code: 'MISSING_CLIENT_EMAIL' },
        { status: 400 }
      );
    }

    await sendGmailEmail({
      to: invoiceData.clientEmail,
      subject: `Invoice ${invoiceData.invoiceNumber} from ${invoiceData.companyName || 'Axis CRM'}`,
      fromName: invoiceData.agentName || invoiceData.companyName || 'Axis CRM',
      replyTo: invoiceData.agentEmail || user.email,
      refreshToken: userRefreshToken,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Hello ${invoiceData.clientName},</h2>
          <p>Please find attached invoice <strong>${invoiceData.invoiceNumber}</strong> for ${propertyData.address || 'your property'}.</p>
          <div style="background: #f4f4f4; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; font-size: 18px;">Total Due: <strong>${invoiceData.totalAmount} ${propertyData.currency || 'USD'}</strong></p>
            <p style="margin: 5px 0 0; color: #666;">Due Date: ${invoiceData.dueDate}</p>
          </div>
          <p>Please find the invoice PDF attached to this email.</p>
          <p>If you have any questions, please reply to this email.</p>
          <br/>
          <p>Best regards,<br/>
          <strong>${invoiceData.agentName || 'The Team'}</strong><br/>
          ${invoiceData.companyName || 'Axis CRM'}</p>
        </div>
      `,
      attachments: [
        {
          filename: `invoice-${invoiceData.invoiceNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });

    // Update invoice status to 'sent'
    await db.update(invoices)
      .set({
        paymentStatus: 'sent',
        updatedAt: new Date()
      })
      .where(eq(invoices.id, parseInt(invoiceId)));

    return NextResponse.json({
      success: true,
      message: 'Invoice sent successfully',
      emailSent: true,
      recipient: invoiceData.clientEmail
    }, { status: 200 });

  } catch (error) {
    console.error('Send invoice error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
