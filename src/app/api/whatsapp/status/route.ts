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
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };

    if (WHATSAPP_API_KEY) {
      headers['X-Api-Key'] = WHATSAPP_API_KEY;
    }

    // Check session status - try both endpoint patterns
    let response: Response;
    let statusData: any;

    // Try /api/sessions/{session} first
    try {
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      response = await fetch(`${WHATSAPP_API_URL}/sessions/${WHATSAPP_SESSION}`, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        statusData = await response.json();
      } else if (response.status === 404) {
        // Try /api/sessions endpoint
        const controller2 = new AbortController();
        const timeoutId2 = setTimeout(() => controller2.abort(), 10000);
        
        response = await fetch(`${WHATSAPP_API_URL}/sessions`, {
          method: 'GET',
          headers,
          signal: controller2.signal,
        });

        clearTimeout(timeoutId2);

        if (response.ok) {
          const sessions = await response.json();
          // Find our session in the list
          const session = Array.isArray(sessions) 
            ? sessions.find((s: any) => s.name === WHATSAPP_SESSION || s.id === WHATSAPP_SESSION)
            : sessions;
          
          statusData = session || { status: 'STOPPED', name: WHATSAPP_SESSION };
        } else if (response.status === 502) {
          throw new Error('WAHA service is not responding (502 Bad Gateway). The service may be starting up or crashed. Please check Railway logs.');
        } else {
          throw new Error(`WAHA API returned ${response.status}: ${response.statusText}`);
        }
      } else if (response.status === 502) {
        throw new Error('WAHA service is not responding (502 Bad Gateway). The service may be starting up or crashed. Please check Railway logs.');
      } else {
        throw new Error(`WAHA API returned ${response.status}: ${response.statusText}`);
      }
    } catch (fetchError) {
      console.error('Error fetching WAHA session status:', fetchError);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to connect to WAHA service';
      let errorDetails = fetchError instanceof Error ? fetchError.message : 'Unknown error';
      
      if (fetchError instanceof Error) {
        if (fetchError.name === 'AbortError') {
          errorMessage = 'Request to WAHA service timed out';
          errorDetails = 'The WAHA service did not respond within 10 seconds. It may be starting up or experiencing issues.';
        } else if (fetchError.message.includes('502')) {
          errorMessage = 'WAHA service is not responding';
          errorDetails = 'The WAHA service returned a 502 Bad Gateway error. This usually means the service container is running but the application inside is not responding. Check Railway logs to see if WAHA crashed or is still starting up.';
        } else if (fetchError.message.includes('ECONNREFUSED') || fetchError.message.includes('fetch failed')) {
          errorMessage = 'Cannot reach WAHA service';
          errorDetails = `Unable to connect to ${WHATSAPP_API_URL}. Make sure the service is running and the URL is correct.`;
        }
      }
      
      return NextResponse.json(
        { 
          error: errorMessage, 
          code: 'WAHA_CONNECTION_ERROR',
          details: errorDetails,
          url: WHATSAPP_API_URL,
          session: WHATSAPP_SESSION
        },
        { status: 503 }
      );
    }

    // Extract status from response
    // WAHA typically returns: { status: "CONNECTED" | "SCAN_QR_CODE" | "STOPPED" | "WORKING", ... }
    const status = statusData?.status || statusData?.state || 'UNKNOWN';

    return NextResponse.json({
      status: status.toUpperCase(),
      name: statusData?.name || WHATSAPP_SESSION,
      session: WHATSAPP_SESSION,
    }, { status: 200 });

  } catch (error) {
    console.error('WhatsApp status check error:', error);
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

