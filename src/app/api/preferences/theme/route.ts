import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { userPreferences } from "@/db/schema-postgres";
import { eq } from "drizzle-orm";
import { CARD_THEME_OPTIONS, DEFAULT_CARD_THEME_KEY, getCardTheme } from "@/lib/card-themes";

const ALLOWED_THEME_KEYS = new Set(CARD_THEME_OPTIONS.map((theme) => theme.key));

export async function GET() {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
    }

    const existing = await db
      .select({
        themeKey: userPreferences.cardTheme,
      })
      .from(userPreferences)
      .where(eq(userPreferences.userId, user.id))
      .limit(1);

    const themeKey = existing[0]?.themeKey ?? DEFAULT_CARD_THEME_KEY;

    return NextResponse.json({
      themeKey,
      theme: getCardTheme(themeKey),
    });
  } catch (error) {
    console.error("GET /api/preferences/theme error:", error);
    return NextResponse.json(
      { error: "Internal server error: " + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const requestedTheme = body?.themeKey as string | undefined;

    if (!requestedTheme || !ALLOWED_THEME_KEYS.has(requestedTheme)) {
      return NextResponse.json(
        { error: "Invalid theme key supplied", code: "INVALID_THEME_KEY" },
        { status: 400 }
      );
    }

    const now = new Date();

    try {
      // Check if preference already exists
      const existing = await db
        .select({ id: userPreferences.id })
        .from(userPreferences)
        .where(eq(userPreferences.userId, user.id))
        .limit(1);

      if (existing.length > 0) {
        // Update existing preference
        await db
          .update(userPreferences)
          .set({
            cardTheme: requestedTheme,
            updatedAt: now,
          })
          .where(eq(userPreferences.userId, user.id));
      } else {
        // Insert new preference
        await db.insert(userPreferences).values({
          userId: user.id,
          cardTheme: requestedTheme,
          createdAt: now,
          updatedAt: now,
        });
      }
    } catch (dbError: any) {
      // Check if it's a table doesn't exist error
      if (dbError?.message?.includes("does not exist") || dbError?.code === "42P01") {
        console.error("Database table 'user_preferences' does not exist. Please run the migration:", dbError);
        return NextResponse.json(
          { 
            error: "Database table not found. Please run the migration: drizzle/0003_add_user_preferences.sql",
            code: "TABLE_NOT_FOUND",
            details: dbError.message 
          },
          { status: 500 }
        );
      }
      console.error("Database error details:", {
        message: dbError?.message,
        code: dbError?.code,
        stack: dbError?.stack,
      });
      throw dbError;
    }

    return NextResponse.json({
      themeKey: requestedTheme,
      theme: getCardTheme(requestedTheme),
    });
  } catch (error) {
    console.error("PUT /api/preferences/theme error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Internal server error: " + errorMessage, code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}


