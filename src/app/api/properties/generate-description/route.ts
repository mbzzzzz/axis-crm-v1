import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/api-auth';
import { UsageLimitError, consumePlanQuota } from '@/lib/usage-limits';

/**
 * API route to generate property descriptions using Groq's low-token model
 * Uses llama-3.1-8b-instant for efficient token usage
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      title,
      address,
      city,
      state,
      propertyType,
      price,
      currency = 'USD',
      sizeSqft,
      bedrooms,
      bathrooms,
      yearBuilt,
      amenities = [],
    } = body;

    // Validate required fields
    if (!title || !address || !city || !state || !propertyType || !price) {
      return NextResponse.json(
        { error: 'Missing required fields: title, address, city, state, propertyType, and price are required.' },
        { status: 400 }
      );
    }

    // Enforce plan usage limits for AI generations
    try {
      await consumePlanQuota(user.id, "autoGenerations");
    } catch (error) {
      if (error instanceof UsageLimitError) {
        return NextResponse.json(error.toResponseBody(), { status: 429 });
      }
      throw error;
    }

    // Get Groq API key from environment
    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return NextResponse.json(
        { error: 'Groq API key is not configured. Please set GROQ_API_KEY in your environment variables.' },
        { status: 500 }
      );
    }

    // Validate size consistency (rough check: minimum ~300 sqft per bedroom for apartments)
    // If size seems too small for bedrooms/bathrooms, we'll omit size from the description
    let shouldIncludeSize = true;
    if (sizeSqft && bedrooms) {
      const sqftPerBedroom = sizeSqft / bedrooms;
      // If less than 200 sqft per bedroom, the size data might be incorrect
      if (sqftPerBedroom < 200) {
        shouldIncludeSize = false;
      }
    }

    // Build comprehensive property details for detailed description generation
    const propertyDetails = [
      `PROPERTY TITLE: ${title}`,
      `FULL ADDRESS: ${address}, ${city}, ${state}`,
      `PROPERTY TYPE: ${propertyType.charAt(0).toUpperCase() + propertyType.slice(1).replace('_', ' ')}`,
      `LISTING PRICE: ${currency} ${price.toLocaleString()}`,
      shouldIncludeSize && sizeSqft && `TOTAL SQUARE FOOTAGE: ${sizeSqft.toLocaleString()} sqft`,
      bedrooms && `BEDROOMS: ${bedrooms}`,
      bathrooms && `BATHROOMS: ${bathrooms}`,
      yearBuilt && `YEAR BUILT: ${yearBuilt}`,
      amenities && amenities.length > 0 && `AMENITIES & FEATURES: ${amenities.join(', ')}`,
    ].filter(Boolean).join('\n');

    // Enhanced prompt for concise, accurate property descriptions
    const prompt = `You are an expert real estate copywriter specializing in creating professional, factual property listings. Generate a clear and accurate property description based on the following details:

${propertyDetails}

WRITING REQUIREMENTS:
1. ACCURACY: Only include information provided above. Do not invent, assume, or contradict any details. If size seems inconsistent with bedrooms/bathrooms, omit the size mention.
2. STRUCTURE: Write 2-3 concise paragraphs (NOT 4):
   - First paragraph: Property type, location, and key features (bedrooms, bathrooms, size if provided and reasonable)
   - Second paragraph: Location context, neighborhood benefits, and amenities
   - Optional third paragraph: Year built and any unique features (only if relevant)
3. TONE: Professional, factual, and informative. Avoid overly salesy language. Do NOT use phrases like "Don't miss this chance", "book a viewing today", "hassle-free lifestyle", or similar marketing clichés.
4. LENGTH: 180-250 words (concise and focused, NOT verbose)
5. FORMATTING: Plain text only, no markdown, bullets, or special characters
6. DETAILS TO INCLUDE:
   - Property type and location
   - Bedrooms and bathrooms count
   - Size (ONLY if it makes logical sense for the number of rooms - if size seems too small, omit it)
   - Key amenities and features
   - Location advantages
   - Year built (if provided and relevant)
7. AVOID:
   - Repetitive phrases or concepts
   - Salesy language ("Don't miss", "book today", "hassle-free", "unbeatable opportunity")
   - Contradictory statements (e.g., saying a 234 sqft property has spacious 2 bedrooms)
   - Generic filler phrases
   - Information not provided above
   - Overly enthusiastic or marketing-heavy language

Generate the property description now:`;

    // Call Groq API with llama-3.1-8b-instant (lowest token model)
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant', // Best low-token model
        messages: [
          {
            role: 'system',
            content: 'You are an expert real estate copywriter specializing in creating factual, professional property listings. You write concise, accurate descriptions that inform without overselling. You always verify that details make logical sense (e.g., size should be reasonable for the number of bedrooms/bathrooms). You avoid repetitive phrases, salesy language, and marketing clichés. Always base descriptions solely on provided information and never invent details.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.5, // Lower temperature for more factual, less creative output
        max_tokens: 400, // Reduced for more concise descriptions
      }),
    });

    if (!groqResponse.ok) {
      const error = await groqResponse.text();
      console.error('Groq API error:', error);
      return NextResponse.json(
        { error: 'Failed to generate description. Please try again.' },
        { status: 500 }
      );
    }

    const data = await groqResponse.json();
    const description = data.choices?.[0]?.message?.content?.trim();

    if (!description) {
      return NextResponse.json(
        { error: 'No description generated. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ description });
  } catch (error) {
    console.error('Error generating description:', error);
    return NextResponse.json(
      { error: 'An error occurred while generating the description.' },
      { status: 500 }
    );
  }
}

