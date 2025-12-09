import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { db } from "@/db";
import { userPreferences } from "@/db/schema-postgres";
import { eq } from "drizzle-orm";
import crypto from "crypto";

/**
 * Generate or retrieve extension API token for authenticated user
 * This token can be used by extensions instead of relying on cookies
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    
    if (!user) {
      return NextResponse.json(
        { 
          error: "Not signed in or session expired",
          code: "NOT_SIGNED_IN"
        },
        { status: 401 }
      );
    }

    // Get or create extension token in user preferences
    const preferences = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, user.id))
      .limit(1);

    let extensionToken: string;
    
    if (preferences.length > 0 && preferences[0].extensionToken) {
      // Return existing token
      extensionToken = preferences[0].extensionToken;
    } else {
      // Generate new token
      extensionToken = crypto.randomBytes(32).toString('hex');
      
      // Store token in user preferences
      if (preferences.length > 0) {
        await db
          .update(userPreferences)
          .set({ 
            extensionToken,
            updatedAt: new Date()
          })
          .where(eq(userPreferences.userId, user.id));
      } else {
        // Create new preferences record
        await db.insert(userPreferences).values({
          userId: user.id,
          extensionToken,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    return NextResponse.json({
      token: extensionToken,
      expiresIn: null, // Token doesn't expire (user can regenerate if needed)
    });
  } catch (error) {
    console.error("Extension token generation error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate extension token",
        code: "TOKEN_GENERATION_ERROR"
      },
      { status: 500 }
    );
  }
}

/**
 * Verify extension token and return user info
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { 
          authenticated: false,
          error: "Token required",
          code: "TOKEN_REQUIRED"
        },
        { status: 400 }
      );
    }

    // Find user by extension token
    const preferences = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.extensionToken, token))
      .limit(1);

    if (preferences.length === 0 || !preferences[0].extensionToken) {
      return NextResponse.json(
        { 
          authenticated: false,
          error: "Invalid token",
          code: "INVALID_TOKEN"
        },
        { status: 401 }
      );
    }

    // Token is valid - return user info
    // Note: We can't get full user details from Supabase without the session,
    // but we can return the user_id which is enough for API calls
    return NextResponse.json({
      authenticated: true,
      userId: preferences[0].userId,
    });
  } catch (error) {
    console.error("Extension token verification error:", error);
    return NextResponse.json(
      {
        authenticated: false,
        error: "Token verification failed",
        code: "VERIFICATION_ERROR"
      },
      { status: 500 }
    );
  }
}

