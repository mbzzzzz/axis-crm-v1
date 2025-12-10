import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { properties, userPreferences } from "@/db/schema-postgres";
import { eq, and } from "drizzle-orm";
import { createClient } from "@supabase/supabase-js";

/**
 * Get a single public property by ID
 * GET /api/public/properties/[id]
 * No authentication required
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const propertyId = parseInt(params.id);
    if (isNaN(propertyId)) {
      return NextResponse.json(
        { error: "Invalid property ID", code: "INVALID_ID" },
        { status: 400 }
      );
    }

    // Get public property
    const property = await db
      .select()
      .from(properties)
      .where(
        and(
          eq(properties.id, propertyId),
          eq(properties.isPublic, 1)
        )
      )
      .limit(1);

    if (property.length === 0) {
      return NextResponse.json(
        { error: "Property not found or not public", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Get agent information from user preferences
    const agentPrefs = await db
      .select({
        agentName: userPreferences.agentName,
        agentAgency: userPreferences.agentAgency,
      })
      .from(userPreferences)
      .where(eq(userPreferences.userId, property[0].userId))
      .limit(1);

    // Get actual user name from Supabase auth
    let actualAgentName: string | null = null;
    let agentEmail: string | null = null;
    let agentImage: string | null = null;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseServiceKey) {
      try {
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        });

        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(property[0].userId);
        
        if (!userError && userData?.user) {
          // Get name from user metadata (full_name) or email
          const fullName = userData.user.user_metadata?.full_name as string | undefined;
          const firstName = userData.user.user_metadata?.first_name as string | undefined;
          const lastName = userData.user.user_metadata?.last_name as string | undefined;
          
          if (fullName) {
            actualAgentName = fullName;
          } else if (firstName || lastName) {
            actualAgentName = [firstName, lastName].filter(Boolean).join(" ");
          } else if (userData.user.email) {
            // Fallback to email username if no name available
            actualAgentName = userData.user.email.split("@")[0];
          }

          agentEmail = userData.user.email || null;
          agentImage = userData.user.user_metadata?.avatar_url as string | undefined || null;
        }
      } catch (error) {
        console.error("Failed to fetch agent user data:", error);
        // Continue with fallback data
      }
    }

    // Use actual name from Supabase, fallback to agentName from preferences, then email
    const finalAgentName = actualAgentName || agentPrefs[0]?.agentName || agentEmail?.split("@")[0] || "Property Agent";

    // Note: We don't expose email/phone directly for privacy
    // Contact form will be used instead
    const agentInfo = {
      name: finalAgentName,
      agency: agentPrefs[0]?.agentAgency || null,
      image: agentImage,
      // Don't expose email/phone publicly - use contact form
    };

    return NextResponse.json({
      property: property[0],
      agentInfo,
    });
  } catch (error) {
    console.error("Error fetching public property:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch property",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}

