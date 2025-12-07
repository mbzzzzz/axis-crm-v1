'use server';

import { db } from '@/db';
import { invoices, properties, tenants, userPreferences } from '@/db/schema-postgres';
import { eq, and } from 'drizzle-orm';
import { getAuthenticatedUser } from '@/lib/api-auth';
import { getInvoicePDFBlob } from '@/lib/pdf-generator';
import { sendWhatsAppMessage, formatPhoneNumber } from '@/lib/whatsapp/cloud-api';

interface SendInvoiceResult {
  success: boolean;
  message?: string;
  error?: string;
  code?: string;
}

/**
 * Constructs a professional invoice caption message
 */
function constructInvoiceCaption(invoice: any, property: any): string {
  const currency = property?.currency || 'USD';
  const dueDate = new Date(invoice.dueDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  let caption = `Dear ${invoice.clientName},\n\n`;
  caption += `Attached is your invoice #${invoice.invoiceNumber}.\n\n`;
  caption += `Amount: ${currency} ${invoice.totalAmount.toFixed(2)}\n`;
  caption += `Due Date: ${dueDate}\n`;

  if (property?.address) {
    caption += `Property: ${property.address}\n`;
  }

  if (invoice.paymentTerms) {
    caption += `\nPayment Terms: ${invoice.paymentTerms}\n`;
  }

  if (invoice.notes) {
    caption += `\nNotes: ${invoice.notes}\n`;
  }

  caption += `\nThank you for your business.\n`;
  
  if (invoice.agentName) {
    caption += `${invoice.agentName}`;
    if (invoice.agentAgency) {
      caption += ` - ${invoice.agentAgency}`;
    }
  } else {
    caption += invoice.companyName || 'Axis CRM';
  }

  return caption;
}

/**
 * Server action to send an invoice PDF via WhatsApp Cloud API
 * @param invoiceId - The ID of the invoice to send
 * @returns Result object with success status and message/error
 */
export async function sendInvoiceWithCaption(invoiceId: number): Promise<SendInvoiceResult> {
  try {
    // Authenticate user
    const user = await getAuthenticatedUser();
    if (!user) {
      return {
        success: false,
        error: 'Unauthorized. Please log in.',
        code: 'UNAUTHORIZED',
      };
    }

    // Validate invoice ID
    if (!invoiceId || isNaN(invoiceId)) {
      return {
        success: false,
        error: 'Valid invoice ID is required',
        code: 'INVALID_INVOICE_ID',
      };
    }

    // Fetch invoice with ownership check
    const invoiceResults = await db
      .select()
      .from(invoices)
      .where(
        and(
          eq(invoices.id, invoiceId),
          eq(invoices.userId, user.id)
        )
      )
      .limit(1);

    if (invoiceResults.length === 0) {
      return {
        success: false,
        error: 'Invoice not found or you do not have access to it',
        code: 'INVOICE_NOT_FOUND',
      };
    }

    const invoice = invoiceResults[0];

    // Fetch property details
    const propertyResults = await db
      .select()
      .from(properties)
      .where(eq(properties.id, invoice.propertyId))
      .limit(1);

    const property = propertyResults[0] || {};

    // Get phone number - try invoice clientPhone first, then tenant phone
    let phoneNumber: string | null = invoice.clientPhone || null;

    if (!phoneNumber && invoice.tenantId) {
      const tenantResults = await db
        .select()
        .from(tenants)
        .where(eq(tenants.id, invoice.tenantId))
        .limit(1);

      if (tenantResults.length > 0) {
        phoneNumber = tenantResults[0].phone || null;
      }
    }

    if (!phoneNumber) {
      return {
        success: false,
        error: 'Phone number is required to send via WhatsApp. Please add a phone number to the invoice or tenant.',
        code: 'MISSING_PHONE_NUMBER',
      };
    }

    // Get user's WhatsApp configuration
    const preferences = await db
      .select({
        whatsappPhoneNumberId: userPreferences.whatsappPhoneNumberId,
        whatsappAccessToken: userPreferences.whatsappAccessToken,
        whatsappBusinessAccountId: userPreferences.whatsappBusinessAccountId,
      })
      .from(userPreferences)
      .where(eq(userPreferences.userId, user.id))
      .limit(1);

    const userPrefs = preferences[0];

    if (!userPrefs?.whatsappPhoneNumberId || !userPrefs?.whatsappAccessToken) {
      return {
        success: false,
        error: 'WhatsApp is not connected. Please connect your WhatsApp account in Settings.',
        code: 'WHATSAPP_NOT_CONNECTED',
      };
    }

    // Prepare PDF data
    const pdfData = {
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.invoiceDate,
      dueDate: invoice.dueDate,
      propertyAddress: property.address,
      propertyUnit: property.unit,
      propertyType: property.propertyType,
      clientName: invoice.clientName,
      clientEmail: invoice.clientEmail,
      clientAddress: invoice.clientAddress || undefined,
      clientPhone: invoice.clientPhone || undefined,
      agentName: invoice.agentName || undefined,
      agentAgency: invoice.agentAgency || undefined,
      agentEmail: invoice.agentEmail || undefined,
      agentPhone: invoice.agentPhone || undefined,
      ownerName: invoice.ownerName || undefined,
      ownerEmail: invoice.ownerEmail || undefined,
      ownerPhone: invoice.ownerPhone || undefined,
      items: (invoice.items as any) || [],
      subtotal: invoice.subtotal,
      taxRate: invoice.taxRate,
      taxAmount: invoice.taxAmount,
      totalAmount: invoice.totalAmount,
      paymentTerms: invoice.paymentTerms || undefined,
      lateFeePolicy: invoice.lateFeePolicy || undefined,
      notes: invoice.notes || undefined,
      logoMode: invoice.logoMode || 'text',
      logoDataUrl: invoice.logoDataUrl || undefined,
      logoWidth: invoice.logoWidth || 40,
      companyName: invoice.companyName || 'AXIS CRM',
      companyTagline: invoice.companyTagline || 'Real Estate Management',
    };

    // Generate PDF
    const pdfBlob = getInvoicePDFBlob(pdfData);
    const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer());

    // Construct message
    const caption = constructInvoiceCaption(invoice, property);

    // Send via WhatsApp Cloud API
    const result = await sendWhatsAppMessage(
      {
        phoneNumberId: userPrefs.whatsappPhoneNumberId,
        accessToken: userPrefs.whatsappAccessToken,
        businessAccountId: userPrefs.whatsappBusinessAccountId || undefined,
      },
      {
        to: phoneNumber,
        message: caption,
        pdfBuffer: pdfBuffer,
        pdfFilename: `invoice-${invoice.invoiceNumber}.pdf`,
      }
    );

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to send invoice via WhatsApp',
        code: 'WHATSAPP_SEND_ERROR',
      };
    }

    // Update invoice status to 'sent'
    await db
      .update(invoices)
      .set({
        paymentStatus: 'sent',
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, invoiceId));

    return {
      success: true,
      message: `Invoice sent successfully to ${formatPhoneNumber(phoneNumber)}`,
    };
  } catch (error) {
    console.error('Send invoice via WhatsApp error:', error);
    return {
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
