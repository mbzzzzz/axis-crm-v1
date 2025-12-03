import { db } from '@/db';
import { recurringInvoices, invoices, tenants, properties } from '@/db/schema-postgres';
import { eq, and, lte, gte } from 'drizzle-orm';
import { sendRecurringInvoiceNotification } from '@/lib/email/notifications';
import { getInvoicePDFBlob } from '@/lib/pdf-generator';

/**
 * Calculate the next generation date for a recurring invoice
 */
export function calculateNextGenerationDate(
  lastDate: Date | null,
  frequency: 'monthly' | 'quarterly' | 'yearly',
  dayOfMonth: number
): Date {
  const now = new Date();
  const baseDate = lastDate || now;
  
  const nextDate = new Date(baseDate);
  
  switch (frequency) {
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case 'quarterly':
      nextDate.setMonth(nextDate.getMonth() + 3);
      break;
    case 'yearly':
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
  }
  
  // Set the day of month (handle edge cases like Feb 30 -> Feb 28/29)
  const daysInMonth = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate();
  nextDate.setDate(Math.min(dayOfMonth, daysInMonth));
  
  return nextDate;
}

/**
 * Calculate next generation date from start date and frequency
 * Used when creating new recurring invoices
 */
export function calculateNextGenerationDateFromStart(
  startDate: Date,
  frequency: 'monthly' | 'quarterly' | 'yearly',
  dayOfMonth: number
): Date {
  const nextDate = new Date(startDate);
  
  // If start date's day is before dayOfMonth, use this month
  // Otherwise, move to next period
  if (startDate.getDate() < dayOfMonth) {
    // Use this month
    const daysInMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0).getDate();
    nextDate.setDate(Math.min(dayOfMonth, daysInMonth));
  } else {
    // Move to next period
    switch (frequency) {
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'quarterly':
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case 'yearly':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
    }
    const daysInMonth = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate();
    nextDate.setDate(Math.min(dayOfMonth, daysInMonth));
  }
  
  return nextDate;
}

/**
 * Generate an invoice from a recurring invoice template
 */
export async function generateInvoiceFromRecurring(recurringInvoiceId: number): Promise<number | null> {
  try {
    // Get the recurring invoice
    const recurring = await db
      .select()
      .from(recurringInvoices)
      .where(eq(recurringInvoices.id, recurringInvoiceId))
      .limit(1);
    
    if (recurring.length === 0 || recurring[0].isActive === 0) {
      return null;
    }
    
    const rec = recurring[0];
    
    // Check if end date has passed
    if (rec.endDate && new Date(rec.endDate) < new Date()) {
      return null;
    }
    
    // Get tenant and property details
    const tenant = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, rec.tenantId))
      .limit(1);
    
    if (tenant.length === 0) {
      return null;
    }
    
    const property = await db
      .select()
      .from(properties)
      .where(eq(properties.id, rec.propertyId))
      .limit(1);
    
    if (property.length === 0) {
      return null;
    }
    
    const tenantData = tenant[0];
    const propertyData = property[0];
    
    // Get template data
    const template = rec.invoiceTemplate as any;
    
    // Calculate invoice dates
    const now = new Date();
    const invoiceDate = new Date(now);
    invoiceDate.setDate(rec.dayOfMonth);
    
    // If the day hasn't passed yet this month, use last month
    if (invoiceDate > now) {
      invoiceDate.setMonth(invoiceDate.getMonth() - 1);
    }
    
    // Ensure day of month is valid for the selected month
    const daysInMonth = new Date(invoiceDate.getFullYear(), invoiceDate.getMonth() + 1, 0).getDate();
    invoiceDate.setDate(Math.min(rec.dayOfMonth, daysInMonth));
    
    const dueDate = new Date(invoiceDate);
    dueDate.setDate(dueDate.getDate() + (template.dueDays || 30)); // Default 30 days
    
    // Generate invoice number
    const year = invoiceDate.getFullYear();
    const month = String(invoiceDate.getMonth() + 1).padStart(2, '0');
    const invoiceNumber = `REC-${rec.id}-${year}-${month}`;
    
    // Check if invoice already exists for this period
    const existingInvoice = await db
      .select()
      .from(invoices)
      .where(eq(invoices.invoiceNumber, invoiceNumber))
      .limit(1);
    
    if (existingInvoice.length > 0) {
      return existingInvoice[0].id;
    }
    
    // Calculate totals from template items
    const items = template.items || [];
    const subtotal = items.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);
    const taxRate = template.taxRate || 0;
    const taxAmount = subtotal * (taxRate / 100);
    const totalAmount = subtotal + taxAmount;
    
    // Create the invoice
    const newInvoice = await db
      .insert(invoices)
      .values({
        invoiceNumber,
        propertyId: rec.propertyId,
        tenantId: rec.tenantId,
        userId: rec.userId,
        clientName: tenantData.name,
        clientEmail: tenantData.email,
        clientPhone: tenantData.phone || null,
        invoiceDate: invoiceDate.toISOString().split('T')[0],
        dueDate: dueDate.toISOString().split('T')[0],
        subtotal,
        taxRate,
        taxAmount,
        totalAmount,
        paymentStatus: template.autoSend ? 'sent' : 'draft',
        items: items,
        notes: template.notes || null,
        paymentTerms: template.paymentTerms || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    
    // Update recurring invoice
    const nextGenDate = calculateNextGenerationDateFromStart(now, rec.frequency as any, rec.dayOfMonth);
    
    await db
      .update(recurringInvoices)
      .set({
        lastGeneratedAt: new Date(),
        nextGenerationDate: nextGenDate,
        updatedAt: new Date(),
      })
      .where(eq(recurringInvoices.id, recurringInvoiceId));
    
    // Send email notification to tenant
    if (tenantData.email) {
      try {
        // Generate PDF for email attachment
        const pdfData = {
          invoiceNumber,
          invoiceDate: invoiceDate.toISOString().split('T')[0],
          dueDate: dueDate.toISOString().split('T')[0],
          propertyAddress: propertyData.address,
          propertyUnit: propertyData.unit,
          propertyType: propertyData.propertyType,
          clientName: tenantData.name,
          clientEmail: tenantData.email,
          clientAddress: tenantData.address || undefined,
          clientPhone: tenantData.phone || undefined,
          items: items,
          subtotal,
          taxRate,
          taxAmount,
          totalAmount,
          paymentTerms: template.paymentTerms || undefined,
          notes: template.notes || undefined,
          companyName: 'AXIS CRM',
          companyTagline: 'Real Estate Management',
        };

        const pdfBlob = getInvoicePDFBlob(pdfData);
        const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer());

        await sendRecurringInvoiceNotification(
          rec.userId,
          newInvoice[0].id,
          invoiceNumber,
          tenantData.email,
          tenantData.name,
          totalAmount,
          dueDate.toISOString().split('T')[0],
          pdfBuffer
        );
      } catch (error) {
        console.error(`Error sending recurring invoice notification for invoice ${newInvoice[0].id}:`, error);
        // Don't fail the process if email fails
      }
    }
    
    return newInvoice[0].id;
  } catch (error) {
    console.error('Error generating invoice from recurring:', error);
    return null;
  }
}

/**
 * Process all recurring invoices that are due for generation
 */
export async function processRecurringInvoices(): Promise<{
  processed: number;
  generated: number;
  errors: Array<{ id: number; error: string }>;
}> {
  const results = {
    processed: 0,
    generated: 0,
    errors: [] as Array<{ id: number; error: string }>,
  };
  
  try {
    const now = new Date();
    
    // Find all active recurring invoices that are due
    const dueRecurring = await db
      .select()
      .from(recurringInvoices)
      .where(
        and(
          eq(recurringInvoices.isActive, 1),
          lte(recurringInvoices.nextGenerationDate, now)
        )
      );
    
    for (const rec of dueRecurring) {
      results.processed++;
      
      try {
        const invoiceId = await generateInvoiceFromRecurring(rec.id);
        if (invoiceId) {
          results.generated++;
        }
      } catch (error: any) {
        results.errors.push({
          id: rec.id,
          error: error.message || 'Unknown error',
        });
      }
    }
  } catch (error) {
    console.error('Error processing recurring invoices:', error);
  }
  
  return results;
}

