import { NextRequest, NextResponse } from "next/server";
import { getTokensFromCode } from "@/lib/email/gmail";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { db } from "@/db";
import { userPreferences } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
        return NextResponse.redirect(new URL("/settings?error=google_auth_failed", request.url));
    }

    if (!code) {
        return NextResponse.json({ error: "Missing code" }, { status: 400 });
    }

    const user = await getAuthenticatedUser();
    if (!user) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
        const tokens = await getTokensFromCode(code);

        if (!tokens.refresh_token) {
            // If no refresh token, maybe we already have access (user didn't revoke).
            // But we ideally need it.
            // We can warn or just proceed if we have access token, but access token expires.
            // prompt="consent" in generateAuthUrl should force refresh token.
            console.warn("No refresh token returned from Google.");
        }

        // Save to DB
        // We upsert into userPreferences
        await db.insert(userPreferences)
            .values({
                userId: user.id,
                cardTheme: 'classic', // Default if new
                gmailRefreshToken: tokens.refresh_token,
                gmailConnectedAt: new Date(),
                gmailEmail: undefined, // We could fetch profile here if we wanted
            })
            // On conflict (user exists), just update the gmail fields
            .onConflictDoUpdate({
                target: userPreferences.userId,
                set: {
                    gmailRefreshToken: tokens.refresh_token,
                    gmailConnectedAt: new Date(),
                },
            });

        return NextResponse.redirect(new URL("/settings?success=google_connected", request.url));
    } catch (error: any) {
        console.error("Google Auth Callback Error:", error);
        return NextResponse.redirect(new URL("/settings?error=google_auth_error", request.url));
    }
}
