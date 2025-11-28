import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/api-auth';

const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || 'http://localhost:3000/api';
const WHATSAPP_API_KEY = process.env.WHATSAPP_API_KEY;
const WHATSAPP_SESSION = process.env.WHATSAPP_SESSION || 'default';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Build headers for WAHA API
    const headers: HeadersInit = {
      'Accept': 'image/png,image/jpeg,application/json',
    };

    if (WHATSAPP_API_KEY) {
      headers['X-Api-Key'] = WHATSAPP_API_KEY;
    }

    // Try different QR code endpoint patterns
    let response: Response;
    let qrImage: Blob;

    // Try /api/sessions/{session}/screenshot first
    try {
      response = await fetch(`${WHATSAPP_API_URL}/sessions/${WHATSAPP_SESSION}/screenshot`, {
        method: 'GET',
        headers,
      });

      if (!response.ok && response.status === 404) {
        // Try /api/screenshot?session={session}
        response = await fetch(`${WHATSAPP_API_URL}/screenshot?session=${WHATSAPP_SESSION}`, {
          method: 'GET',
          headers,
        });
      }

      if (!response.ok && response.status === 404) {
        // Try /api/screenshot without session (default session)
        response = await fetch(`${WHATSAPP_API_URL}/screenshot`, {
          method: 'GET',
          headers,
        });
      }

      if (!response.ok) {
        throw new Error(`WAHA API returned ${response.status}: ${response.statusText}`);
      }

      // Check if response is an image
      const contentType = response.headers.get('content-type');
      if (contentType?.startsWith('image/')) {
        qrImage = await response.blob();
      } else {
        // Might be JSON with base64 image
        const data = await response.json();
        if (data.screenshot || data.qr || data.image) {
          const base64Image = data.screenshot || data.qr || data.image;
          // Convert base64 to blob
          const imageData = base64Image.replace(/^data:image\/\w+;base64,/, '');
          const buffer = Buffer.from(imageData, 'base64');
          qrImage = new Blob([buffer], { type: 'image/png' });
        } else {
          throw new Error('QR code image not found in response');
        }
      }
    } catch (fetchError) {
      console.error('Error fetching WAHA QR code:', fetchError);
      return NextResponse.json(
        { 
          error: 'Failed to fetch QR code from WAHA service', 
          code: 'QR_FETCH_ERROR',
          details: fetchError instanceof Error ? fetchError.message : 'Unknown error'
        },
        { status: 503 }
      );
    }

    // Return the image
    return new NextResponse(qrImage, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });

  } catch (error) {
    console.error('WhatsApp QR code fetch error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        code: 'INTERNAL_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

