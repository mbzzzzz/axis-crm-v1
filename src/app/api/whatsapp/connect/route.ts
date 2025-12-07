import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/api-auth';
import { db } from '@/db';
import { userPreferences } from '@/db/schema-postgres';
import { eq } from 'drizzle-orm';

/**
 * Save WhatsApp Cloud API credentials
 * POST /api/whatsapp/connect
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { phoneNumberId, accessToken, businessAccountId, phoneNumber } = body;

    if (!phoneNumberId || !accessToken) {
      return NextResponse.json(
        { error: 'Phone Number ID and Access Token are required', code: 'MISSING_CREDENTIALS' },
        { status: 400 }
      );
    }

    // Update or insert user preferences
    const existing = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, user.id))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(userPreferences)
        .set({
          whatsappPhoneNumberId: phoneNumberId,
          whatsappAccessToken: accessToken,
          whatsappBusinessAccountId: businessAccountId || null,
          whatsappPhoneNumber: phoneNumber || null,
          whatsappConnectedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(userPreferences.userId, user.id));
    } else {
      await db.insert(userPreferences).values({
        userId: user.id,
        cardTheme: 'classic',
        whatsappPhoneNumberId: phoneNumberId,
        whatsappAccessToken: accessToken,
        whatsappBusinessAccountId: businessAccountId || null,
        whatsappPhoneNumber: phoneNumber || null,
        whatsappConnectedAt: new Date(),
      });
    }

    return NextResponse.json({
      success: true,
      message: 'WhatsApp connected successfully',
    });
  } catch (error) {
    console.error('WhatsApp connect error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * Get WhatsApp connection status
 * GET /api/whatsapp/connect
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const preferences = await db
      .select({
        whatsappPhoneNumberId: userPreferences.whatsappPhoneNumberId,
        whatsappPhoneNumber: userPreferences.whatsappPhoneNumber,
        whatsappConnectedAt: userPreferences.whatsappConnectedAt,
      })
      .from(userPreferences)
      .where(eq(userPreferences.userId, user.id))
      .limit(1);

    const prefs = preferences[0];

    if (!prefs?.whatsappPhoneNumberId) {
      return NextResponse.json({
        connected: false,
        status: 'not_connected',
      });
    }

    return NextResponse.json({
      connected: true,
      status: 'connected',
      phoneNumber: prefs.whatsappPhoneNumber,
      connectedAt: prefs.whatsappConnectedAt,
    });
  } catch (error) {
    console.error('WhatsApp status error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * Disconnect WhatsApp
 * DELETE /api/whatsapp/connect
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    await db
      .update(userPreferences)
      .set({
        whatsappPhoneNumberId: null,
        whatsappAccessToken: null,
        whatsappBusinessAccountId: null,
        whatsappPhoneNumber: null,
        whatsappConnectedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(userPreferences.userId, user.id));

    return NextResponse.json({
      success: true,
      message: 'WhatsApp disconnected successfully',
    });
  } catch (error) {
    console.error('WhatsApp disconnect error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

