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
      response = await fetch(`${WHATSAPP_API_URL}/sessions/${WHATSAPP_SESSION}`, {
        method: 'GET',
        headers,
      });

      if (response.ok) {
        statusData = await response.json();
      } else if (response.status === 404) {
        // Try /api/sessions endpoint
        response = await fetch(`${WHATSAPP_API_URL}/sessions`, {
          method: 'GET',
          headers,
        });

        if (response.ok) {
          const sessions = await response.json();
          // Find our session in the list
          const session = Array.isArray(sessions) 
            ? sessions.find((s: any) => s.name === WHATSAPP_SESSION || s.id === WHATSAPP_SESSION)
            : sessions;
          
          statusData = session || { status: 'STOPPED', name: WHATSAPP_SESSION };
        } else {
          throw new Error(`WAHA API returned ${response.status}`);
        }
      } else {
        throw new Error(`WAHA API returned ${response.status}`);
      }
    } catch (fetchError) {
      console.error('Error fetching WAHA session status:', fetchError);
      return NextResponse.json(
        { 
          error: 'Failed to connect to WAHA service', 
          code: 'WAHA_CONNECTION_ERROR',
          details: fetchError instanceof Error ? fetchError.message : 'Unknown error'
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

