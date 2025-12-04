import { NextRequest, NextResponse } from 'next/server';
import { getTenantFromToken } from '@/lib/tenant-auth';
import { db } from '@/db';
import { tenants, properties } from '@/db/schema-postgres';
import { eq } from 'drizzle-orm';

/**
 * API route to generate maintenance request descriptions for tenants using Groq's low-token model
 * Uses llama-3.1-8b-instant for efficient token usage
 * Authenticated using tenant JWT tokens
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate tenant
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const tenant = await getTenantFromToken(token);

    if (!tenant) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, urgency, location } = body;

    // Validate required fields
    if (!title) {
      return NextResponse.json(
        { error: 'Title is required to generate description.' },
        { status: 400 }
      );
    }

    // Get Groq API key from environment
    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return NextResponse.json(
        { error: 'Groq API key is not configured. Please set GROQ_API_KEY in your environment variables.' },
        { status: 500 }
      );
    }

    // Fetch tenant's property if available (optional - not required for generation)
    let propertyAddress = null;
    let propertyType = null;
    try {
      if (tenant.propertyId) {
        const property = await db
          .select()
          .from(properties)
          .where(eq(properties.id, tenant.propertyId))
          .limit(1);
        
        if (property.length > 0) {
          propertyAddress = property[0].address;
          propertyType = property[0].propertyType;
        }
      }
    } catch (propertyError) {
      // Property fetch failed, but we can still generate description without it
      console.warn('Failed to fetch property for tenant:', propertyError);
    }

    // Build maintenance details for description generation
    const maintenanceDetails = [
      `Title: ${title}`,
      urgency ? `Urgency Level: ${urgency.charAt(0).toUpperCase() + urgency.slice(1)}` : null,
      location ? `Location: ${location}` : null,
      propertyAddress ? `Property Address: ${propertyAddress}` : null,
      propertyType ? `Property Type: ${propertyType}` : null,
      tenant.name ? `Tenant Name: ${tenant.name}` : null,
      tenant.email ? `Tenant Email: ${tenant.email}` : null,
      tenant.phone ? `Tenant Phone: ${tenant.phone}` : null,
    ].filter(Boolean).join('\n');

    // Enhanced prompt for detailed, accurate maintenance descriptions
    const prompt = `You are an expert property maintenance coordinator specializing in creating clear, detailed maintenance request descriptions. Generate a professional maintenance request description based on the following details:

${maintenanceDetails}

WRITING REQUIREMENTS:
1. ACCURACY: Only include information provided above. Do not invent or assume details.
2. STRUCTURE: Write 2-3 well-structured paragraphs:
   - First paragraph: Clear description of the issue/problem based on the title
   - Second paragraph: Specific details about location, urgency, and any relevant context
   - Optional third paragraph: Additional notes or recommendations if applicable
3. TONE: Professional, clear, and concise. Use active voice and specific language.
4. LENGTH: 100-200 words (comprehensive but concise)
5. FORMATTING: Plain text only, no markdown, bullets, or special characters
6. DETAILS TO INCLUDE:
   - Clear description of the maintenance issue
   - Location details (if provided)
   - Urgency level implications (if provided)
   - Property context (if provided)
   - Tenant contact information (if provided) - include at the end for reference
   - Any relevant observations or notes
7. AVOID: Generic phrases, false claims, or information not provided above
8. TENANT INFO: If tenant information is provided, mention it briefly at the end (e.g., "Contact tenant: [Name] at [Email] or [Phone] if needed")

Generate the maintenance request description now:`;

    // Call Groq API with llama-3.1-8b-instant (lowest token model)
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: 'You are an expert property maintenance coordinator with years of experience creating clear, detailed maintenance request descriptions. You specialize in writing professional descriptions that accurately represent maintenance issues while providing all necessary context for technicians. Always base your descriptions solely on the information provided and never invent details.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 300, // Appropriate for maintenance descriptions
      }),
    });

    if (!groqResponse.ok) {
      const errorData = await groqResponse.text();
      console.error('Groq API error:', groqResponse.status, errorData);
      let errorMessage = 'Failed to generate description. Please try again.';
      try {
        const errorJson = JSON.parse(errorData);
        errorMessage = errorJson.error?.message || errorMessage;
      } catch {
        // Use default error message
      }
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }

    const data = await groqResponse.json();
    const description = data.choices?.[0]?.message?.content?.trim();

    if (!description) {
      console.error('No description in Groq response:', data);
      return NextResponse.json(
        { error: 'Failed to generate description. The AI service returned an empty response.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ description }, { status: 200 });
  } catch (error) {
    console.error('Generate maintenance description error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

