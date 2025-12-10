import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { properties, userPreferences, leads } from "@/db/schema-postgres";
import { eq, and } from "drizzle-orm";
import { sendEmailNotification } from "@/lib/email/notifications";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Send contact form message to property owner
 * POST /api/properties/[id]/contact
 * No authentication required (public contact form)
 */
export async function POST(
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

    const body = await request.json();
    const { name, email, phone, message } = body;

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    // Get property and verify it's public
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

    // Get agent information
    const agentInfo = await db
      .select({
        agentName: userPreferences.agentName,
        agentAgency: userPreferences.agentAgency,
      })
      .from(userPreferences)
      .where(eq(userPreferences.userId, property[0].userId))
      .limit(1);

    // Get agent email from Supabase auth
    // Note: We need service role key for admin.getUserById, but for security we'll
    // try to get it from the user's session or store it in user_preferences
    // For now, we'll log the contact and the agent can check their dashboard
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    let agentEmail: string | null = null;

    // Try to get email using service role key (if available)
    if (supabaseUrl && supabaseServiceKey) {
      try {
        const { createClient } = await import("@supabase/supabase-js");
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        });

        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(property[0].userId);
        if (!userError && userData?.user?.email) {
          agentEmail = userData.user.email;
        }
      } catch (error) {
        console.error("Failed to fetch agent email:", error);
      }
    }

    // If we still don't have email, log the contact for manual review
    // In production, consider storing agent email in user_preferences table
    if (!agentEmail) {
      console.warn(`Contact form submitted for property ${propertyId} (agent: ${property[0].userId}). Email not available.`);
      console.log("Contact details:", { name, email, phone, message });
      // Still return success to user
    }

    // Persist inquiry as a lead so it's never lost even if email fails
    try {
      await db.insert(leads).values({
        userId: property[0].userId,
        name,
        phone: phone || "",
        email,
        budget: null,
        preferredLocation: property[0].city,
        source: "website",
        status: "inquiry",
        notes: message,
        propertyId,
      });
    } catch (leadError) {
      console.error("Failed to store lead from contact form:", leadError);
      // continue; we still return success to the user
    }

    // Send email notification to agent (best-effort)
    if (agentEmail) {
      try {
        await sendEmailNotification({
          to: agentEmail,
        subject: `New Inquiry: ${property[0].title || property[0].address}`,
        html: `
          <h2>New Property Inquiry</h2>
          <p>You have received a new inquiry about your property listing.</p>
          
          <h3>Property Details</h3>
          <ul>
            <li><strong>Title:</strong> ${property[0].title || property[0].address}</li>
            <li><strong>Address:</strong> ${property[0].address}, ${property[0].city}, ${property[0].state} ${property[0].zipCode}</li>
            <li><strong>Price:</strong> ${property[0].price}</li>
          </ul>
          
          <h3>Contact Information</h3>
          <ul>
            <li><strong>Name:</strong> ${name}</li>
            <li><strong>Email:</strong> ${email}</li>
            ${phone ? `<li><strong>Phone:</strong> ${phone}</li>` : ""}
          </ul>
          
          <h3>Message</h3>
          <p>${message.replace(/\n/g, "<br>")}</p>
          
          <p>Please respond to this inquiry as soon as possible.</p>
        `,
        });
      } catch (emailError) {
        console.error("Failed to send email:", emailError);
        // Don't fail the request if email fails - log it instead
        // In production, you might want to queue this for retry
      }
    }

    return NextResponse.json({
      success: true,
      message: "Your message has been sent to the agent. They will contact you soon.",
    });
  } catch (error) {
    console.error("Error processing contact form:", error);
    return NextResponse.json(
      {
        error: "Failed to send message. Please try again later.",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}

