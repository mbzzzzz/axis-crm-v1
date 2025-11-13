import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';

/**
 * API route to generate property descriptions using Groq's low-token model
 * Uses llama-3.1-8b-instant for efficient token usage
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await currentUser();
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

    // Get Groq API key from environment
    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return NextResponse.json(
        { error: 'Groq API key is not configured. Please set GROQ_API_KEY in your environment variables.' },
        { status: 500 }
      );
    }

    // Build comprehensive property details for detailed description generation
    const propertyDetails = [
      `PROPERTY TITLE: ${title}`,
      `FULL ADDRESS: ${address}, ${city}, ${state}`,
      `PROPERTY TYPE: ${propertyType.charAt(0).toUpperCase() + propertyType.slice(1).replace('_', ' ')}`,
      `LISTING PRICE: ${currency} ${price.toLocaleString()}`,
      sizeSqft && `TOTAL SQUARE FOOTAGE: ${sizeSqft.toLocaleString()} sqft`,
      bedrooms && `BEDROOMS: ${bedrooms}`,
      bathrooms && `BATHROOMS: ${bathrooms}`,
      yearBuilt && `YEAR BUILT: ${yearBuilt}`,
      amenities && amenities.length > 0 && `AMENITIES & FEATURES: ${amenities.join(', ')}`,
    ].filter(Boolean).join('\n');

    // Enhanced prompt for detailed, accurate property descriptions
    const prompt = `You are an expert real estate copywriter specializing in creating compelling, accurate property listings. Generate a professional property description based on the following details:

${propertyDetails}

WRITING REQUIREMENTS:
1. ACCURACY: Only include information provided above. Do not invent or assume details.
2. STRUCTURE: Write 3-4 well-structured paragraphs:
   - First paragraph: Property overview, type, and key selling points
   - Second paragraph: Detailed features, size, layout (bedrooms/bathrooms), and year built
   - Third paragraph: Location benefits, neighborhood highlights, and amenities
   - Optional fourth paragraph: Additional unique features or investment potential
3. TONE: Professional, warm, and inviting. Use active voice and descriptive language.
4. LENGTH: 250-350 words (comprehensive but not excessive)
5. FORMATTING: Plain text only, no markdown, bullets, or special characters
6. DETAILS TO HIGHLIGHT:
   - Property type and its appeal
   - Size and layout (if provided)
   - Location advantages (city, state context)
   - Amenities and special features (if provided)
   - Year built and condition implications (if provided)
   - Value proposition at the listed price
7. AVOID: Generic phrases, false claims, or information not provided above

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
            content: 'You are an expert real estate copywriter with years of experience creating compelling, accurate property listings. You specialize in writing detailed, professional descriptions that accurately represent properties while highlighting their unique features and value propositions. Always base your descriptions solely on the information provided and never invent details.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 500, // Increased for more detailed descriptions
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

