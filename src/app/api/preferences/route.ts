import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { db } from "@/db";
import { userPreferences } from "@/db/schema-postgres";
import { eq } from "drizzle-orm";
import { CARD_THEME_OPTIONS, DEFAULT_CARD_THEME_KEY, getCardTheme } from "@/lib/card-themes";
import { PLAN_DEFINITIONS, PlanKey, isPlanKey } from "@/lib/plan-limits";

const ALLOWED_THEME_KEYS = new Set(CARD_THEME_OPTIONS.map((theme) => theme.key));
const ALLOWED_LOGO_MODES = new Set(["text", "image"]);
const HEARD_ABOUT_OPTIONS = new Set(["referral", "search", "social", "event", "marketplace", "partner", "ads", "other"]);

export async function GET() {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
    }

    const existing = await db
      .select({
        themeKey: userPreferences.cardTheme,
        planKey: userPreferences.planKey,
        agentName: userPreferences.agentName,
        agentAgency: userPreferences.agentAgency,
        organizationName: userPreferences.organizationName,
        companyTagline: userPreferences.companyTagline,
        defaultInvoiceLogoMode: userPreferences.defaultInvoiceLogoMode,
        defaultInvoiceLogoDataUrl: userPreferences.defaultInvoiceLogoDataUrl,
        defaultInvoiceLogoWidth: userPreferences.defaultInvoiceLogoWidth,
        heardAbout: userPreferences.heardAbout,
        onboardingCompletedAt: userPreferences.onboardingCompletedAt,
        gmailRefreshToken: userPreferences.gmailRefreshToken,
        gmailEmail: userPreferences.gmailEmail,
      })
      .from(userPreferences)
      .where(eq(userPreferences.userId, user.id))
      .limit(1);

    const prefs = existing[0];
    const themeKey = prefs?.themeKey ?? DEFAULT_CARD_THEME_KEY;

    return NextResponse.json({
      themeKey,
      theme: getCardTheme(themeKey),
      planKey: prefs?.planKey || "professional",
      agentName: prefs?.agentName || null,
      agentAgency: prefs?.agentAgency || null,
      organizationName: prefs?.organizationName || null,
      companyTagline: prefs?.companyTagline || null,
      defaultInvoiceLogoMode: prefs?.defaultInvoiceLogoMode || "text",
      defaultInvoiceLogoDataUrl: prefs?.defaultInvoiceLogoDataUrl || null,
      defaultInvoiceLogoWidth: prefs?.defaultInvoiceLogoWidth ?? 40,
      heardAbout: prefs?.heardAbout || null,
      onboardingCompleted: Boolean(prefs?.onboardingCompletedAt),
      gmailConnected: Boolean(prefs?.gmailRefreshToken),
      gmailEmail: prefs?.gmailEmail || null,
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

    const {
      themeKey,
      planKey,
      agentName,
      agentAgency,
      organizationName,
      companyTagline,
      defaultInvoiceLogoMode,
      defaultInvoiceLogoDataUrl,
      defaultInvoiceLogoWidth,
      heardAbout,
      onboardingCompleted,
    } = body;

    // Validate theme key if provided
    if (themeKey !== undefined && (!themeKey || !ALLOWED_THEME_KEYS.has(themeKey))) {
      return NextResponse.json(
        { error: "Invalid theme key supplied", code: "INVALID_THEME_KEY" },
        { status: 400 }
      );
    }

    if (planKey !== undefined && planKey !== null) {
      if (typeof planKey !== "string" || !isPlanKey(planKey)) {
        return NextResponse.json(
          { error: "Invalid plan selected", code: "INVALID_PLAN" },
          { status: 400 }
        );
      }
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

    if (organizationName !== undefined && organizationName !== null) {
      if (typeof organizationName !== "string") {
        return NextResponse.json(
          { error: "Organization name must be a string", code: "INVALID_ORGANIZATION_NAME" },
          { status: 400 }
        );
      }
      if (organizationName.length > 150) {
        return NextResponse.json(
          { error: "Organization name must be 150 characters or less", code: "INVALID_ORGANIZATION_NAME" },
          { status: 400 }
        );
      }
    }

    if (companyTagline !== undefined && companyTagline !== null) {
      if (typeof companyTagline !== "string") {
        return NextResponse.json(
          { error: "Company tagline must be a string", code: "INVALID_COMPANY_TAGLINE" },
          { status: 400 }
        );
      }
      if (companyTagline.length > 180) {
        return NextResponse.json(
          { error: "Company tagline must be 180 characters or less", code: "INVALID_COMPANY_TAGLINE" },
          { status: 400 }
        );
      }
    }

    if (defaultInvoiceLogoMode !== undefined && defaultInvoiceLogoMode !== null) {
      if (typeof defaultInvoiceLogoMode !== "string" || !ALLOWED_LOGO_MODES.has(defaultInvoiceLogoMode)) {
        return NextResponse.json(
          { error: "Invalid logo mode supplied", code: "INVALID_LOGO_MODE" },
          { status: 400 }
        );
      }
    }

    if (defaultInvoiceLogoWidth !== undefined && defaultInvoiceLogoWidth !== null) {
      const widthNumber = Number(defaultInvoiceLogoWidth);
      if (
        Number.isNaN(widthNumber) ||
        !Number.isFinite(widthNumber) ||
        widthNumber < 24 ||
        widthNumber > 200
      ) {
        return NextResponse.json(
          { error: "Logo width must be between 24 and 200", code: "INVALID_LOGO_WIDTH" },
          { status: 400 }
        );
      }
    }

    if (defaultInvoiceLogoDataUrl !== undefined && defaultInvoiceLogoDataUrl !== null) {
      if (typeof defaultInvoiceLogoDataUrl !== "string") {
        return NextResponse.json(
          { error: "Logo data must be a string", code: "INVALID_LOGO_DATA" },
          { status: 400 }
        );
      }
      const trimmedLogo = defaultInvoiceLogoDataUrl.trim();
      const isDataUrl = trimmedLogo.startsWith("data:image");
      const isHttpUrl = /^https?:\/\//i.test(trimmedLogo);

      if (!isDataUrl && !isHttpUrl) {
        return NextResponse.json(
          { error: "Logo must be an image data URL or hosted https image", code: "INVALID_LOGO_DATA" },
          { status: 400 }
        );
      }

      if (isDataUrl && trimmedLogo.length > 2_500_000) {
        return NextResponse.json(
          { error: "Logo file is too large", code: "LOGO_TOO_LARGE" },
          { status: 400 }
        );
      }
    }

    if (heardAbout !== undefined && heardAbout !== null) {
      if (typeof heardAbout !== "string" || !HEARD_ABOUT_OPTIONS.has(heardAbout)) {
        return NextResponse.json(
          { error: "Invalid value for heard about us", code: "INVALID_HEARD_ABOUT" },
          { status: 400 }
        );
      }
    }

    if (onboardingCompleted !== undefined && typeof onboardingCompleted !== "boolean") {
      return NextResponse.json(
        { error: "onboardingCompleted must be a boolean", code: "INVALID_ONBOARDING_COMPLETED" },
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
      if (planKey !== undefined) {
        updateData.planKey = isPlanKey(planKey) ? planKey : "professional";
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
      if (organizationName !== undefined) {
        const trimmedOrg = typeof organizationName === "string" ? organizationName.trim() : organizationName;
        updateData.organizationName = trimmedOrg === "" || trimmedOrg === null || trimmedOrg === undefined ? null : trimmedOrg;
      }
      if (companyTagline !== undefined) {
        const trimmedTagline = typeof companyTagline === "string" ? companyTagline.trim() : companyTagline;
        updateData.companyTagline = trimmedTagline === "" || trimmedTagline === null || trimmedTagline === undefined ? null : trimmedTagline;
      }
      if (defaultInvoiceLogoMode !== undefined) {
        updateData.defaultInvoiceLogoMode = defaultInvoiceLogoMode;
      }
      if (defaultInvoiceLogoWidth !== undefined) {
        const widthNumber = Math.round(Number(defaultInvoiceLogoWidth));
        updateData.defaultInvoiceLogoWidth = Math.max(24, Math.min(200, widthNumber));
      }
      if (defaultInvoiceLogoDataUrl !== undefined) {
        const dataUrl =
          typeof defaultInvoiceLogoDataUrl === "string" ? defaultInvoiceLogoDataUrl.trim() : defaultInvoiceLogoDataUrl;
        updateData.defaultInvoiceLogoDataUrl = dataUrl === "" || dataUrl === null || dataUrl === undefined ? null : dataUrl;
      }
      if (heardAbout !== undefined) {
        updateData.heardAbout = heardAbout;
      }
      if (onboardingCompleted === true) {
        updateData.onboardingCompletedAt = now;
      } else if (onboardingCompleted === false) {
        updateData.onboardingCompletedAt = null;
      }

      // If only agent fields are being updated (no theme), ensure we still update
      // This allows users to update agent info independently
      // Ensure we have at least one field to update besides updatedAt
      const hasUpdates = Object.keys(updateData).some((key) => key !== "updatedAt");

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
          planKey: isPlanKey(planKey) ? planKey : "professional",
          agentName: agentName === "" || agentName === null ? null : (agentName?.trim() || null),
          agentAgency: agentAgency === "" || agentAgency === null ? null : (agentAgency?.trim() || null),
          organizationName: organizationName === "" || organizationName === null ? null : (organizationName?.trim() || null),
          companyTagline: companyTagline === "" || companyTagline === null ? null : (companyTagline?.trim() || null),
          defaultInvoiceLogoMode: defaultInvoiceLogoMode || "text",
          defaultInvoiceLogoDataUrl:
            defaultInvoiceLogoDataUrl === "" || defaultInvoiceLogoDataUrl === null
              ? null
              : (defaultInvoiceLogoDataUrl?.trim() || null),
          defaultInvoiceLogoWidth:
            defaultInvoiceLogoWidth !== undefined && defaultInvoiceLogoWidth !== null
              ? Math.max(24, Math.min(200, Math.round(Number(defaultInvoiceLogoWidth))))
              : 40,
          heardAbout: heardAbout || null,
          onboardingCompletedAt: onboardingCompleted ? now : null,
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
          organizationName: userPreferences.organizationName,
          companyTagline: userPreferences.companyTagline,
          defaultInvoiceLogoMode: userPreferences.defaultInvoiceLogoMode,
          defaultInvoiceLogoDataUrl: userPreferences.defaultInvoiceLogoDataUrl,
          defaultInvoiceLogoWidth: userPreferences.defaultInvoiceLogoWidth,
          heardAbout: userPreferences.heardAbout,
          onboardingCompletedAt: userPreferences.onboardingCompletedAt,
        })
        .from(userPreferences)
        .where(eq(userPreferences.userId, user.id))
        .limit(1);

      const prefs =
        updated[0] || {
          themeKey: themeKey || DEFAULT_CARD_THEME_KEY,
          planKey: isPlanKey(planKey) ? planKey : "professional",
          agentName: agentName ?? null,
          agentAgency: agentAgency ?? null,
          organizationName: organizationName ?? null,
          companyTagline: companyTagline ?? null,
          defaultInvoiceLogoMode: defaultInvoiceLogoMode || "text",
          defaultInvoiceLogoDataUrl: defaultInvoiceLogoDataUrl ?? null,
          defaultInvoiceLogoWidth:
            defaultInvoiceLogoWidth !== undefined && defaultInvoiceLogoWidth !== null
              ? Math.max(24, Math.min(200, Math.round(Number(defaultInvoiceLogoWidth))))
              : 40,
          heardAbout: heardAbout ?? null,
          onboardingCompletedAt: onboardingCompleted ? now : null,
        };

      return NextResponse.json({
        themeKey: prefs.themeKey,
        theme: getCardTheme(prefs.themeKey),
        planKey: prefs.planKey || "professional",
        agentName: prefs.agentName,
        agentAgency: prefs.agentAgency,
        organizationName: prefs.organizationName,
        companyTagline: prefs.companyTagline,
        defaultInvoiceLogoMode: prefs.defaultInvoiceLogoMode || "text",
        defaultInvoiceLogoDataUrl: prefs.defaultInvoiceLogoDataUrl,
        defaultInvoiceLogoWidth: prefs.defaultInvoiceLogoWidth ?? 40,
        heardAbout: prefs.heardAbout,
        onboardingCompleted: Boolean(prefs.onboardingCompletedAt),
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

