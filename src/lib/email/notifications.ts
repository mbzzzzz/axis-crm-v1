import { assertResendConfigured } from '@/lib/resend';
import { db } from '@/db';
import { userPreferences } from '@/db/schema-postgres';
import { eq } from 'drizzle-orm';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

/**
 * Send email notification using Resend
 */
export async function sendEmailNotification(options: EmailOptions): Promise<void> {
  try {
    const resend = assertResendConfigured();
    
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@axis-crm.com';
    const fromName = process.env.RESEND_FROM_NAME || 'AXIS CRM';

    await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      attachments: options.attachments?.map(att => ({
        filename: att.filename,
        content: att.content instanceof Buffer ? att.content.toString('base64') : Buffer.from(att.content).toString('base64'),
      })),
    });
  } catch (error) {
    console.error('Error sending email notification:', error);
    throw error;
  }
}

/**
 * Get user preferences for email notifications
 */
async function getUserPreferences(userId: string) {
  try {
    const prefs = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1);

    return prefs[0] || null;
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return null;
  }
}

/**
 * Send lease signing notification
 */
export async function sendLeaseSigningNotification(
  userId: string,
  leaseId: number,
  leaseNumber: string,
  tenantEmail: string,
  tenantName: string,
  signerType: 'tenant' | 'owner',
  isFullySigned: boolean,
  pdfBuffer?: Buffer
): Promise<void> {
  try {
    const prefs = await getUserPreferences(userId);
    const companyName = prefs?.organizationName || 'AXIS CRM';

    if (signerType === 'tenant') {
      // Notify owner that tenant signed
      const ownerEmail = prefs?.email || process.env.ADMIN_EMAIL;
      if (ownerEmail) {
        await sendEmailNotification({
          to: ownerEmail,
          subject: `Lease ${leaseNumber} - Tenant Signed`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Lease Signed by Tenant</h2>
              <p>Hello,</p>
              <p>The tenant <strong>${tenantName}</strong> has signed lease <strong>${leaseNumber}</strong>.</p>
              ${isFullySigned ? '<p style="color: green; font-weight: bold;">✓ The lease is now fully signed and active!</p>' : '<p>You can now sign the lease to complete the process.</p>'}
              <p>You can view the lease in your AXIS CRM dashboard.</p>
              <p>Best regards,<br/>${companyName}</p>
            </div>
          `,
          attachments: pdfBuffer ? [{
            filename: `lease-${leaseNumber}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          }] : undefined,
        });
      }
    } else {
      // Notify tenant that owner signed
      await sendEmailNotification({
        to: tenantEmail,
        subject: `Lease ${leaseNumber} - Owner Signed`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Lease Signed by Owner</h2>
            <p>Hello ${tenantName},</p>
            <p>The property owner has signed lease <strong>${leaseNumber}</strong>.</p>
            ${isFullySigned ? '<p style="color: green; font-weight: bold;">✓ The lease is now fully signed and active!</p>' : '<p>Please sign the lease to complete the process.</p>'}
            <p>You can view and download the lease from your tenant portal.</p>
            <p>Best regards,<br/>${companyName}</p>
          </div>
        `,
        attachments: pdfBuffer ? [{
          filename: `lease-${leaseNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        }] : undefined,
      });
    }
  } catch (error) {
    console.error('Error sending lease signing notification:', error);
    // Don't throw - email failures shouldn't break the signing process
  }
}

/**
 * Send late fee notification
 */
export async function sendLateFeeNotification(
  userId: string,
  invoiceId: number,
  invoiceNumber: string,
  tenantEmail: string,
  tenantName: string,
  lateFeeAmount: number,
  totalAmount: number,
  dueDate: string,
  daysOverdue: number
): Promise<void> {
  try {
    const prefs = await getUserPreferences(userId);
    const companyName = prefs?.organizationName || 'AXIS CRM';

    await sendEmailNotification({
      to: tenantEmail,
      subject: `Late Fee Applied - Invoice ${invoiceNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #d32f2f;">Late Fee Applied</h2>
          <p>Hello ${tenantName},</p>
          <p>A late fee has been applied to invoice <strong>${invoiceNumber}</strong>.</p>
          <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Invoice Details:</strong></p>
            <p style="margin: 5px 0;">Due Date: ${new Date(dueDate).toLocaleDateString()}</p>
            <p style="margin: 5px 0;">Days Overdue: ${daysOverdue}</p>
            <p style="margin: 5px 0;">Late Fee: $${lateFeeAmount.toFixed(2)}</p>
            <p style="margin: 5px 0;"><strong>New Total: $${totalAmount.toFixed(2)}</strong></p>
          </div>
          <p>Please make payment as soon as possible to avoid additional fees.</p>
          <p>You can view and pay this invoice from your tenant portal.</p>
          <p>Best regards,<br/>${companyName}</p>
        </div>
      `,
    });
  } catch (error) {
    console.error('Error sending late fee notification:', error);
    // Don't throw - email failures shouldn't break the late fee process
  }
}

/**
 * Send recurring invoice generated notification
 */
export async function sendRecurringInvoiceNotification(
  userId: string,
  invoiceId: number,
  invoiceNumber: string,
  tenantEmail: string,
  tenantName: string,
  amount: number,
  dueDate: string,
  pdfBuffer?: Buffer
): Promise<void> {
  try {
    const prefs = await getUserPreferences(userId);
    const companyName = prefs?.organizationName || 'AXIS CRM';

    await sendEmailNotification({
      to: tenantEmail,
      subject: `New Invoice ${invoiceNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">New Invoice Generated</h2>
          <p>Hello ${tenantName},</p>
          <p>A new invoice has been generated for you.</p>
          <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <p style="margin: 0;"><strong>Invoice Number:</strong> ${invoiceNumber}</p>
            <p style="margin: 5px 0;"><strong>Amount Due:</strong> $${amount.toFixed(2)}</p>
            <p style="margin: 5px 0;"><strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString()}</p>
          </div>
          <p>You can view and download this invoice from your tenant portal.</p>
          <p>Best regards,<br/>${companyName}</p>
        </div>
      `,
      attachments: pdfBuffer ? [{
        filename: `invoice-${invoiceNumber}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      }] : undefined,
    });
  } catch (error) {
    console.error('Error sending recurring invoice notification:', error);
    // Don't throw - email failures shouldn't break invoice generation
  }
}

/**
 * Send tenant registration invitation
 */
export async function sendTenantRegistrationInvitation(
  userId: string,
  tenantEmail: string,
  tenantName: string,
  registrationLink: string,
  propertyAddress?: string
): Promise<void> {
  try {
    const prefs = await getUserPreferences(userId);
    const companyName = prefs?.organizationName || 'AXIS CRM';

    await sendEmailNotification({
      to: tenantEmail,
      subject: `Welcome to ${companyName} - Create Your Account`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to ${companyName}!</h2>
          <p>Hello ${tenantName},</p>
          <p>You've been invited to create an account on the ${companyName} tenant portal.</p>
          ${propertyAddress ? `<p>Property: <strong>${propertyAddress}</strong></p>` : ''}
          <p>With your account, you can:</p>
          <ul>
            <li>View and download your invoices</li>
            <li>Submit maintenance requests</li>
            <li>View your lease documents</li>
            <li>Track your payment history</li>
          </ul>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${registrationLink}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Create Your Account</a>
          </div>
          <p style="color: #666; font-size: 12px;">Or copy and paste this link into your browser:<br/>${registrationLink}</p>
          <p>This link will expire in 7 days.</p>
          <p>Best regards,<br/>${companyName}</p>
        </div>
      `,
    });
  } catch (error) {
    console.error('Error sending tenant registration invitation:', error);
    throw error;
  }
}

