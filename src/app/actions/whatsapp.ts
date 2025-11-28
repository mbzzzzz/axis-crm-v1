'use server';

import { db } from '@/db';
import { invoices, properties, tenants } from '@/db/schema-postgres';
import { eq, and } from 'drizzle-orm';
import { getAuthenticatedUser } from '@/lib/api-auth';
import { getInvoicePDFBlob } from '@/lib/pdf-generator';

const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || 'http://localhost:3000/api';
const WHATSAPP_API_KEY = process.env.WHATSAPP_API_KEY;
const WHATSAPP_SESSION = process.env.WHATSAPP_SESSION || 'default';

interface SendInvoiceResult {
  success: boolean;
  message?: string;
  error?: string;
  code?: string;
}

/**
 * Formats a phone number for WAHA API
 * Converts to format: {country_code}{number}@c.us
 * Example: +1 (555) 123-4567 -> 15551234567@c.us
 */
function formatPhoneNumberForWAHA(phone: string): string {
  if (!phone) {
    throw new Error('Phone number is required');
  }

  // Remove all non-numeric characters except leading +
  let cleaned = phone.trim();
  
  // Remove common separators: spaces, dashes, parentheses, dots
  cleaned = cleaned.replace(/[\s\-\(\)\.]/g, '');
  
  // If it starts with +, keep it, otherwise assume it's already formatted
  const hasPlus = cleaned.startsWith('+');
  if (hasPlus) {
    cleaned = cleaned.substring(1); // Remove + for processing
  }

  // Remove any remaining non-numeric characters
  cleaned = cleaned.replace(/\D/g, '');

  if (!cleaned || cleaned.length < 10) {
    throw new Error('Invalid phone number format');
  }

  // Append @c.us suffix (WAHA format)
  return `${cleaned}@c.us`;
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
 * Server action to send an invoice PDF via WhatsApp
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
        error: 'Phone number is missing for this invoice. Please add a phone number to the client or tenant.',
        code: 'MISSING_PHONE_NUMBER',
      };
    }

    // Format phone number for WAHA
    let formattedPhone: string;
    try {
      formattedPhone = formatPhoneNumberForWAHA(phoneNumber);
    } catch (phoneError) {
      return {
        success: false,
        error: phoneError instanceof Error ? phoneError.message : 'Invalid phone number format',
        code: 'INVALID_PHONE_FORMAT',
      };
    }

    // Prepare PDF data (same structure as email send)
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
      // Branding
      logoMode: invoice.logoMode || 'text',
      logoDataUrl: invoice.logoDataUrl || undefined,
      logoWidth: invoice.logoWidth || 40,
      companyName: invoice.companyName || 'AXIS CRM',
      companyTagline: invoice.companyTagline || 'Real Estate Management',
    };

    // Generate PDF
    const pdfBlob = getInvoicePDFBlob(pdfData);
    const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer());

    // Construct caption
    const caption = constructInvoiceCaption(invoice, property);

    // Prepare request to WAHA API
    const headers: HeadersInit = {
      'Accept': 'application/json',
    };

    if (WHATSAPP_API_KEY) {
      headers['X-Api-Key'] = WHATSAPP_API_KEY;
    }

    // WAHA sendFile endpoint - try multiple formats
    let response: Response;
    let sendResult: any;

    // Method 1: Try multipart/form-data (most common)
    try {
      const formData = new FormData();
      formData.append('session', WHATSAPP_SESSION);
      formData.append('chatId', formattedPhone);
      formData.append('file', new Blob([pdfBuffer], { type: 'application/pdf' }), `invoice-${invoice.invoiceNumber}.pdf`);
      formData.append('filename', `invoice-${invoice.invoiceNumber}.pdf`);
      formData.append('caption', caption);

      // Note: FormData doesn't work with fetch in Node.js server environment
      // We need to use a different approach
      
      // Method 2: Try JSON with base64 encoded file
      const base64Pdf = pdfBuffer.toString('base64');
      
      response = await fetch(`${WHATSAPP_API_URL}/sendFile`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session: WHATSAPP_SESSION,
          chatId: formattedPhone,
          file: `data:application/pdf;base64,${base64Pdf}`,
          filename: `invoice-${invoice.invoiceNumber}.pdf`,
          caption: caption,
        }),
      });

      if (!response.ok) {
        // Try alternative endpoint format
        response = await fetch(`${WHATSAPP_API_URL}/sessions/${WHATSAPP_SESSION}/sendFile`, {
          method: 'POST',
          headers: {
            ...headers,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chatId: formattedPhone,
            file: `data:application/pdf;base64,${base64Pdf}`,
            filename: `invoice-${invoice.invoiceNumber}.pdf`,
            caption: caption,
          }),
        });
      }

      if (!response.ok) {
        const errorText = await response.text();
        let errorData: any;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }

        throw new Error(
          errorData.error || errorData.message || `WAHA API returned ${response.status}: ${response.statusText}`
        );
      }

      sendResult = await response.json();
    } catch (fetchError) {
      console.error('Error sending file via WAHA:', fetchError);
      return {
        success: false,
        error: 'Failed to send invoice via WhatsApp',
        code: 'WHATSAPP_SEND_ERROR',
        message: fetchError instanceof Error ? fetchError.message : 'Unknown error',
      };
    }

    // Update invoice status to 'sent' (same as email send)
    await db
      .update(invoices)
      .set({
        paymentStatus: 'sent',
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, invoiceId));

    return {
      success: true,
      message: `Invoice sent successfully to ${formattedPhone}`,
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

