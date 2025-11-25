import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { db } from "@/db";
import { userPreferences } from "@/db/schema-postgres";
import { eq } from "drizzle-orm";
import { CARD_THEME_OPTIONS, DEFAULT_CARD_THEME_KEY, getCardTheme } from "@/lib/card-themes";

const ALLOWED_THEME_KEYS = new Set(CARD_THEME_OPTIONS.map((theme) => theme.key));

export async function GET() {
  try {
    const user = await getAuthenticatedUser();

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
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();

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

    // Validate agentName if provided
    if (agentName !== undefined && agentName !== null) {
      if (typeof agentName !== "string") {
        return NextResponse.json(
          { error: "Agent name must be a string", code: "INVALID_AGENT_NAME" },
          { status: 400 }
        );
      }
      if (agentName.length > 100) {
        return NextResponse.json(
          { error: "Agent name must be 100 characters or less", code: "INVALID_AGENT_NAME" },
          { status: 400 }
        );
      }
    }

    // Validate agentAgency if provided
    if (agentAgency !== undefined && agentAgency !== null) {
      if (typeof agentAgency !== "string") {
        return NextResponse.json(
          { error: "Agent agency must be a string", code: "INVALID_AGENT_AGENCY" },
          { status: 400 }
        );
      }
      if (agentAgency.length > 100) {
        return NextResponse.json(
          { error: "Agent agency must be 100 characters or less", code: "INVALID_AGENT_AGENCY" },
          { status: 400 }
        );
      }
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
      // Always allow updating agent fields, even if they're empty (to clear them)
      if (agentName !== undefined) {
        // Convert empty string to null, otherwise use trimmed value
        const trimmedName = typeof agentName === 'string' ? agentName.trim() : agentName;
        updateData.agentName = trimmedName === "" || trimmedName === null || trimmedName === undefined ? null : trimmedName;
      }
      if (agentAgency !== undefined) {
        // Convert empty string to null, otherwise use trimmed value
        const trimmedAgency = typeof agentAgency === 'string' ? agentAgency.trim() : agentAgency;
        updateData.agentAgency = trimmedAgency === "" || trimmedAgency === null || trimmedAgency === undefined ? null : trimmedAgency;
      }
      
      // If only agent fields are being updated (no theme), ensure we still update
      // This allows users to update agent info independently
      // Ensure we have at least one field to update besides updatedAt
      const hasUpdates = Object.keys(updateData).length > 1 || agentName !== undefined || agentAgency !== undefined;

      if (existing.length > 0) {
        // Update existing preference - always update if we have agent fields or theme
        if (hasUpdates) {
          await db
            .update(userPreferences)
            .set(updateData)
            .where(eq(userPreferences.userId, user.id));
        }
      } else {
        // Insert new preference
        await db.insert(userPreferences).values({
          userId: user.id,
          cardTheme: themeKey || DEFAULT_CARD_THEME_KEY,
          agentName: agentName === "" || agentName === null ? null : (agentName?.trim() || null),
          agentAgency: agentAgency === "" || agentAgency === null ? null : (agentAgency?.trim() || null),
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
      // Check for column doesn't exist error (migration not run)
      if (dbError?.message?.includes("does not exist") || dbError?.code === "42P01" || dbError?.code === "42703") {
        const isColumnError = dbError?.message?.includes("agent_name") || dbError?.message?.includes("agent_agency");
        if (isColumnError) {
          console.error("Database columns 'agent_name' or 'agent_agency' do not exist. Please run the migration:", dbError);
          const isProduction = process.env.NODE_ENV === "production";
          return NextResponse.json(
            { 
              error: "Database columns not found. Please run the migration: drizzle/0008_add_agent_fields_to_preferences.sql",
              code: "COLUMN_NOT_FOUND",
              ...(isProduction ? {} : { details: dbError.message })
            },
            { status: 500 }
          );
        }
        console.error("Database table 'user_preferences' does not exist. Please run the migration:", dbError);
        const isProduction = process.env.NODE_ENV === "production";
        return NextResponse.json(
          { 
            error: "Database table not found. Please run the migration: drizzle/0003_add_user_preferences.sql",
            code: "TABLE_NOT_FOUND",
            ...(isProduction ? {} : { details: dbError.message })
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
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

