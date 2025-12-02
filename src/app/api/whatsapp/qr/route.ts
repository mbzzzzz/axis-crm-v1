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

    // First, check if session exists and start it if needed
    try {
      // Check session status
      const statusResponse = await fetch(`${WHATSAPP_API_URL}/sessions/${WHATSAPP_SESSION}`, {
        method: 'GET',
        headers: { ...headers, 'Accept': 'application/json' },
      });

      if (statusResponse.status === 404) {
        // Session doesn't exist, create and start it
        const createResponse = await fetch(`${WHATSAPP_API_URL}/sessions/${WHATSAPP_SESSION}/start`, {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ config: {} }),
        });

        if (!createResponse.ok && createResponse.status !== 409) {
          // 409 means session already exists, which is fine
          console.warn(`Failed to start session: ${createResponse.status}`);
        }
      } else if (statusResponse.ok) {
        const sessionData = await statusResponse.json();
        // If session is STOPPED, try to start it
        if (sessionData.status === 'STOPPED' || sessionData.state === 'STOPPED') {
          const startResponse = await fetch(`${WHATSAPP_API_URL}/sessions/${WHATSAPP_SESSION}/start`, {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ config: {} }),
          });
          // Wait a bit for session to initialize
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } catch (sessionError) {
      console.warn('Error checking/starting session:', sessionError);
      // Continue anyway - might still be able to get QR code
    }

    // Try /api/sessions/{session}/screenshot first
    try {
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      response = await fetch(`${WHATSAPP_API_URL}/sessions/${WHATSAPP_SESSION}/screenshot`, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok && response.status === 404) {
        // Try /api/screenshot?session={session}
        const controller2 = new AbortController();
        const timeoutId2 = setTimeout(() => controller2.abort(), 15000);
        
        response = await fetch(`${WHATSAPP_API_URL}/screenshot?session=${WHATSAPP_SESSION}`, {
          method: 'GET',
          headers,
          signal: controller2.signal,
        });

        clearTimeout(timeoutId2);
      }

      if (!response.ok && response.status === 404) {
        // Try /api/screenshot without session (default session)
        const controller3 = new AbortController();
        const timeoutId3 = setTimeout(() => controller3.abort(), 15000);
        
        response = await fetch(`${WHATSAPP_API_URL}/screenshot`, {
          method: 'GET',
          headers,
          signal: controller3.signal,
        });

        clearTimeout(timeoutId3);
      }

      if (!response.ok) {
        if (response.status === 502) {
          throw new Error('WAHA service is not responding (502 Bad Gateway). The service may be starting up or crashed.');
        }
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
      
      // Provide more specific error messages
      let errorMessage = 'Failed to fetch QR code from WAHA service';
      let errorDetails = fetchError instanceof Error ? fetchError.message : 'Unknown error';
      
      if (fetchError instanceof Error) {
        if (fetchError.name === 'AbortError') {
          errorMessage = 'Request to WAHA service timed out';
          errorDetails = 'The WAHA service did not respond within 15 seconds. It may be starting up or experiencing issues.';
        } else if (fetchError.message.includes('502')) {
          errorMessage = 'WAHA service is not responding';
          errorDetails = 'The WAHA service returned a 502 Bad Gateway error. Check Railway logs to see if WAHA crashed or is still starting up.';
        } else if (fetchError.message.includes('ECONNREFUSED') || fetchError.message.includes('fetch failed')) {
          errorMessage = 'Cannot reach WAHA service';
          errorDetails = `Unable to connect to ${WHATSAPP_API_URL}. Make sure the service is running and the URL is correct.`;
        }
      }
      
      return NextResponse.json(
        { 
          error: errorMessage, 
          code: 'QR_FETCH_ERROR',
          details: errorDetails,
          url: WHATSAPP_API_URL,
          session: WHATSAPP_SESSION
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

