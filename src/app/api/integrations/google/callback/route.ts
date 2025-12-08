import { NextRequest, NextResponse } from "next/server";
import { getTokensFromCode } from "@/lib/email/gmail";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { db } from "@/db";
import { userPreferences } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const code = searchParams.get("code");
        const error = searchParams.get("error");

        if (error) {
            console.error("Google OAuth error parameter:", error);
            return NextResponse.redirect(new URL("/settings?error=google_auth_failed", request.url));
        }

        if (!code) {
            console.error("Missing code in Google OAuth callback");
            return NextResponse.json({ error: "Missing code" }, { status: 400 });
        }

        // Check if user is authenticated
        let user;
        try {
            user = await getAuthenticatedUser();
        } catch (authError) {
            console.error("Error getting authenticated user:", authError);
            return NextResponse.redirect(new URL("/login?error=session_expired", request.url));
        }

        if (!user) {
            console.warn("No authenticated user in Google OAuth callback");
            return NextResponse.redirect(new URL("/login?error=not_authenticated", request.url));
        }

        // Check if Google OAuth is configured
        if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REDIRECT_URI) {
            console.error("Google OAuth not configured - missing environment variables");
            return NextResponse.redirect(new URL("/settings?error=google_not_configured", request.url));
        }

        // Exchange code for tokens
        let tokens;
        try {
            tokens = await getTokensFromCode(code);
        } catch (tokenError: any) {
            console.error("Error exchanging code for tokens:", tokenError);
            return NextResponse.redirect(new URL("/settings?error=token_exchange_failed", request.url));
        }

        if (!tokens.refresh_token) {
            // If no refresh token, maybe we already have access (user didn't revoke).
            // But we ideally need it.
            // We can warn or just proceed if we have access token, but access token expires.
            // prompt="consent" in generateAuthUrl should force refresh token.
            console.warn("No refresh token returned from Google.");
        }

        // Save to DB
        try {
            await db.insert(userPreferences)
                .values({
                    userId: user.id,
                    cardTheme: 'classic', // Default if new
                    gmailRefreshToken: tokens.refresh_token || null,
                    gmailConnectedAt: new Date(),
                    gmailEmail: undefined, // We could fetch profile here if we wanted
                })
                // On conflict (user exists), just update the gmail fields
                .onConflictDoUpdate({
                    target: userPreferences.userId,
                    set: {
                        gmailRefreshToken: tokens.refresh_token || null,
                        gmailConnectedAt: new Date(),
                    },
                });
        } catch (dbError) {
            console.error("Error saving tokens to database:", dbError);
            return NextResponse.redirect(new URL("/settings?error=database_error", request.url));
        }

        return NextResponse.redirect(new URL("/settings?success=google_connected", request.url));
    } catch (error: any) {
        // Catch-all for any unexpected errors
        console.error("Unexpected error in Google Auth Callback:", error);
        console.error("Error stack:", error?.stack);
        return NextResponse.redirect(new URL("/settings?error=unexpected_error", request.url));
    }
}
