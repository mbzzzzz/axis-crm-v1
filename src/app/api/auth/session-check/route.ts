import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";

/**
 * Session check endpoint for extensions
 * Returns simple JSON indicating if user is authenticated
 * This helps extensions verify authentication without needing to parse cookies
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    
    if (!user) {
      return NextResponse.json(
        { 
          authenticated: false,
          error: "Not signed in or session expired",
          code: "NOT_SIGNED_IN"
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.email || "User",
      },
    });
  } catch (error) {
    console.error("Session check error:", error);
    return NextResponse.json(
      {
        authenticated: false,
        error: "Session check failed",
        code: "SESSION_CHECK_ERROR"
      },
      { status: 500 }
    );
  }
}

