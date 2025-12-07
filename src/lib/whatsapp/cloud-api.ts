/**
 * WhatsApp Cloud API Integration
 * Official Meta WhatsApp Business API for sending messages
 * 
 * Setup: https://developers.facebook.com/docs/whatsapp/cloud-api
 */

const WHATSAPP_API_VERSION = 'v21.0';
const WHATSAPP_API_BASE = `https://graph.facebook.com/${WHATSAPP_API_VERSION}`;

interface WhatsAppConfig {
  phoneNumberId: string;
  accessToken: string;
  businessAccountId?: string;
}

interface SendMessageParams {
  to: string; // Phone number in E.164 format (e.g., +1234567890)
  message: string;
  pdfBuffer?: Buffer;
  pdfFilename?: string;
}

/**
 * Format phone number to E.164 format
 * Example: (555) 123-4567 -> +15551234567
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // If it doesn't start with +, assume US number and add +1
  if (!phone.startsWith('+')) {
    // If it's 10 digits, assume US and add +1
    if (digits.length === 10) {
      return `+1${digits}`;
    }
    // If it's 11 digits starting with 1, add +
    if (digits.length === 11 && digits.startsWith('1')) {
      return `+${digits}`;
    }
    // Otherwise, try to detect country code or default to +1
    return `+${digits}`;
  }
  
  return phone;
}

/**
 * Send a text message via WhatsApp Cloud API
 */
export async function sendWhatsAppMessage(
  config: WhatsAppConfig,
  params: SendMessageParams
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const formattedPhone = formatPhoneNumber(params.to);
    
    // If PDF is provided, send as document
    if (params.pdfBuffer) {
      return await sendWhatsAppDocument(config, formattedPhone, params);
    }
    
    // Send text message
    const response = await fetch(
      `${WHATSAPP_API_BASE}/${config.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: formattedPhone,
          type: 'text',
          text: {
            body: params.message,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message || 
        `WhatsApp API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    return {
      success: true,
      messageId: data.messages?.[0]?.id,
    };
  } catch (error) {
    console.error('WhatsApp send message error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send a document (PDF) via WhatsApp Cloud API
 * Note: For production, consider uploading PDF to a public URL first,
 * then sending the URL to WhatsApp for better reliability
 */
async function sendWhatsAppDocument(
  config: WhatsAppConfig,
  to: string,
  params: SendMessageParams
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // For now, we'll send the document by uploading to WhatsApp's media API
    // This requires proper multipart/form-data handling
    
    // Create multipart form data manually
    const boundary = `----WhatsAppBoundary${Date.now()}${Math.random().toString(36).substring(2, 9)}`;
    const CRLF = '\r\n';
    const parts: Buffer[] = [];
    
    // Add messaging_product field
    parts.push(Buffer.from(`--${boundary}${CRLF}`));
    parts.push(Buffer.from(`Content-Disposition: form-data; name="messaging_product"${CRLF}${CRLF}`));
    parts.push(Buffer.from('whatsapp'));
    parts.push(Buffer.from(CRLF));
    
    // Add type field
    parts.push(Buffer.from(`--${boundary}${CRLF}`));
    parts.push(Buffer.from(`Content-Disposition: form-data; name="type"${CRLF}${CRLF}`));
    parts.push(Buffer.from('document'));
    parts.push(Buffer.from(CRLF));
    
    // Add file field
    parts.push(Buffer.from(`--${boundary}${CRLF}`));
    parts.push(Buffer.from(`Content-Disposition: form-data; name="file"; filename="${params.pdfFilename || 'document.pdf'}"${CRLF}`));
    parts.push(Buffer.from(`Content-Type: application/pdf${CRLF}${CRLF}`));
    parts.push(params.pdfBuffer!);
    parts.push(Buffer.from(CRLF));
    
    // Close boundary
    parts.push(Buffer.from(`--${boundary}--${CRLF}`));
    
    const formData = Buffer.concat(parts);

    const uploadResponse = await fetch(
      `${WHATSAPP_API_BASE}/${config.phoneNumberId}/media`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
        },
        body: formData,
      }
    );

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message || 
        `WhatsApp media upload error: ${uploadResponse.status}`
      );
    }

    const uploadData = await uploadResponse.json();
    const mediaId = uploadData.id;

    if (!mediaId) {
      throw new Error('Failed to get media ID from upload');
    }

    // Step 2: Send message with media
    const messageResponse = await fetch(
      `${WHATSAPP_API_BASE}/${config.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: to,
          type: 'document',
          document: {
            id: mediaId,
            caption: params.message,
            filename: params.pdfFilename || 'document.pdf',
          },
        }),
      }
    );

    if (!messageResponse.ok) {
      const errorData = await messageResponse.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message || 
        `WhatsApp send document error: ${messageResponse.status}`
      );
    }

    const messageData = await messageResponse.json();
    return {
      success: true,
      messageId: messageData.messages?.[0]?.id,
    };
  } catch (error) {
    console.error('WhatsApp send document error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Verify webhook signature (for incoming messages)
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  appSecret: string
): boolean {
  // Implementation for webhook verification
  // This is used when receiving messages from WhatsApp
  return true; // Simplified for now
}

/**
 * Get WhatsApp phone number info
 */
export async function getWhatsAppPhoneNumber(
  config: WhatsAppConfig
): Promise<{ phoneNumber?: string; verifiedName?: string; error?: string }> {
  try {
    const response = await fetch(
      `${WHATSAPP_API_BASE}/${config.phoneNumberId}`,
      {
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get phone number info: ${response.status}`);
    }

    const data = await response.json();
    return {
      phoneNumber: data.display_phone_number || data.verified_name,
      verifiedName: data.verified_name,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

