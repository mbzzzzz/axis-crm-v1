import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { maintenanceRequests, properties } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getAuthenticatedUser } from '@/lib/api-auth';
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
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { requestId, to } = body;

    if (!requestId) {
      return NextResponse.json(
        { error: 'Request ID is required', code: 'MISSING_REQUEST_ID' },
        { status: 400 }
      );
    }

    if (!to || !to.trim()) {
      return NextResponse.json(
        { error: 'Recipient email is required', code: 'MISSING_EMAIL' },
        { status: 400 }
      );
    }

    // Fetch the maintenance request
    const requestData = await db
      .select()
      .from(maintenanceRequests)
      .where(
        and(
          eq(maintenanceRequests.id, parseInt(requestId)),
          eq(maintenanceRequests.userId, user.id)
        )
      )
      .limit(1);

    if (requestData.length === 0) {
      return NextResponse.json(
        { error: 'Maintenance request not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const maintenanceRequest = requestData[0];

    // Fetch property details if available
    let propertyData = null;
    if (maintenanceRequest.propertyId) {
      const propertyResult = await db
        .select()
        .from(properties)
        .where(
          and(
            eq(properties.id, maintenanceRequest.propertyId),
            eq(properties.userId, user.id)
          )
        )
        .limit(1);
      
      if (propertyResult.length > 0) {
        propertyData = propertyResult[0];
      }
    }

    // Build email content
    const urgencyLabels: Record<string, string> = {
      high: 'High',
      medium: 'Medium',
      low: 'Low',
    };

    const statusLabels: Record<string, string> = {
      open: 'Open',
      in_progress: 'In Progress',
      closed: 'Closed',
    };

    const propertyAddress = propertyData?.address || maintenanceRequest.location || 'N/A';
    const propertyInfo = propertyData 
      ? `${propertyData.address}${propertyData.city ? `, ${propertyData.city}` : ''}${propertyData.state ? `, ${propertyData.state}` : ''}${propertyData.zipCode ? ` ${propertyData.zipCode}` : ''}`
      : maintenanceRequest.location || 'N/A';

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">
          Maintenance Request: ${maintenanceRequest.title}
        </h2>
        
        <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Status:</strong> ${statusLabels[maintenanceRequest.status] || maintenanceRequest.status}</p>
          <p style="margin: 5px 0;"><strong>Urgency:</strong> ${urgencyLabels[maintenanceRequest.urgency] || maintenanceRequest.urgency}</p>
          <p style="margin: 5px 0;"><strong>Reported Date:</strong> ${new Date(maintenanceRequest.reportedDate).toLocaleDateString()}</p>
        </div>

        <div style="margin: 20px 0;">
          <h3 style="color: #333; margin-bottom: 10px;">Property Information</h3>
          <p style="margin: 5px 0; color: #666;">${propertyInfo}</p>
        </div>

        <div style="margin: 20px 0;">
          <h3 style="color: #333; margin-bottom: 10px;">Description</h3>
          <p style="margin: 5px 0; color: #666; white-space: pre-wrap;">${maintenanceRequest.description}</p>
        </div>

        ${maintenanceRequest.location ? `
        <div style="margin: 20px 0;">
          <h3 style="color: #333; margin-bottom: 10px;">Specific Location</h3>
          <p style="margin: 5px 0; color: #666;">${maintenanceRequest.location}</p>
        </div>
        ` : ''}

        ${maintenanceRequest.notes ? `
        <div style="margin: 20px 0;">
          <h3 style="color: #333; margin-bottom: 10px;">Additional Notes</h3>
          <p style="margin: 5px 0; color: #666; white-space: pre-wrap;">${maintenanceRequest.notes}</p>
        </div>
        ` : ''}

        ${maintenanceRequest.cost !== null && maintenanceRequest.cost !== undefined ? `
        <div style="margin: 20px 0;">
          <h3 style="color: #333; margin-bottom: 10px;">Estimated Cost</h3>
          <p style="margin: 5px 0; color: #666;">$${maintenanceRequest.cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
        ` : ''}

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #666; font-size: 12px;">
            This maintenance request was sent from Axis CRM.<br/>
            Please contact the property manager if you have any questions.
          </p>
        </div>
      </div>
    `;

    // Send email
    await sendGmailEmail({
      to: to.trim(),
      subject: `Maintenance Request: ${maintenanceRequest.title} - ${propertyAddress}`,
      html: emailHtml,
    });

    return NextResponse.json({
      success: true,
      message: 'Maintenance request sent successfully',
      emailSent: true,
      recipient: to.trim(),
    }, { status: 200 });

  } catch (error) {
    console.error('Send maintenance request email error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

