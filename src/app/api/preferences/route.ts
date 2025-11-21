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
        agentName: userPreferences.agentName,
        agentAgency: userPreferences.agentAgency,
      })
      .from(userPreferences)
      .where(eq(userPreferences.userId, user.id))
      .limit(1);

    const prefs = existing[0];
    const themeKey = prefs?.themeKey ?? DEFAULT_CARD_THEME_KEY;

    return NextResponse.json({
      themeKey,
      theme: getCardTheme(themeKey),
      agentName: prefs?.agentName || null,
      agentAgency: prefs?.agentAgency || null,
    });
  } catch (error) {
    console.error("GET /api/preferences error:", error);
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
    if (!body) {
      return NextResponse.json(
        { error: "Invalid request body", code: "INVALID_BODY" },
        { status: 400 }
      );
    }

    const { themeKey, agentName, agentAgency } = body;

    // Validate theme key if provided
    if (themeKey !== undefined && (!themeKey || !ALLOWED_THEME_KEYS.has(themeKey))) {
      return NextResponse.json(
        { error: "Invalid theme key supplied", code: "INVALID_THEME_KEY" },
        { status: 400 }
      );
    }

    const now = new Date();

    try {
      // Check if preference already exists
      const existing = await db
        .select({ id: userPreferences.id, cardTheme: userPreferences.cardTheme })
        .from(userPreferences)
        .where(eq(userPreferences.userId, user.id))
        .limit(1);

      const updateData: any = {
        updatedAt: now,
      };

      if (themeKey !== undefined) {
        updateData.cardTheme = themeKey;
      }
      if (agentName !== undefined) {
        updateData.agentName = agentName?.trim() || null;
      }
      if (agentAgency !== undefined) {
        updateData.agentAgency = agentAgency?.trim() || null;
      }

      if (existing.length > 0) {
        // Update existing preference
        await db
          .update(userPreferences)
          .set(updateData)
          .where(eq(userPreferences.userId, user.id));
      } else {
        // Insert new preference
        await db.insert(userPreferences).values({
          userId: user.id,
          cardTheme: themeKey || DEFAULT_CARD_THEME_KEY,
          agentName: agentName?.trim() || null,
          agentAgency: agentAgency?.trim() || null,
          createdAt: now,
          updatedAt: now,
        });
      }

      // Return updated preferences
      const updated = await db
        .select({
          themeKey: userPreferences.cardTheme,
          agentName: userPreferences.agentName,
          agentAgency: userPreferences.agentAgency,
        })
        .from(userPreferences)
        .where(eq(userPreferences.userId, user.id))
        .limit(1);

      const prefs = updated[0] || { themeKey: themeKey || DEFAULT_CARD_THEME_KEY, agentName: null, agentAgency: null };

      return NextResponse.json({
        themeKey: prefs.themeKey,
        theme: getCardTheme(prefs.themeKey),
        agentName: prefs.agentName,
        agentAgency: prefs.agentAgency,
      });
    } catch (dbError: any) {
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
  } catch (error) {
    console.error("PUT /api/preferences error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Internal server error: " + errorMessage, code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

