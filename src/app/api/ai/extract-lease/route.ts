import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import Groq from 'groq-sdk';

// Helper function to get current authenticated user
async function getCurrentUser() {
  const user = await currentUser();
  if (!user) return null;
  return {
    id: user.id,
    name: user.fullName || user.firstName || 'User',
    email: user.primaryEmailAddress?.emailAddress || '',
  };
}

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Check if Groq API key is configured
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: 'AI service not configured. Please set GROQ_API_KEY environment variable.', code: 'AI_NOT_CONFIGURED' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided', code: 'NO_FILE' },
        { status: 400 }
      );
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Only PDF files are supported', code: 'INVALID_FILE_TYPE' },
        { status: 400 }
      );
    }

    // Convert file to base64 for Groq
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    // Use Groq to extract lease information
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are an AI assistant specialized in extracting information from lease documents. 
          Extract the following information from the provided lease document:
          - Lease start date (format: YYYY-MM-DD)
          - Lease end date (format: YYYY-MM-DD)
          - Monthly rent amount (numeric value only, no currency symbols)
          
          Return ONLY a valid JSON object with these exact keys: startDate, endDate, rentAmount.
          If any information is not found, use null for that field.
          Example response: {"startDate": "2024-01-01", "endDate": "2024-12-31", "rentAmount": 50000}`,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract lease information from this PDF document.',
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${file.type};base64,${base64}`,
              },
            },
          ],
        },
      ],
      model: 'llama-3.2-90b-vision-preview', // Groq's vision model
      response_format: { type: 'json_object' },
      temperature: 0.1,
    });

    const responseText = completion.choices[0]?.message?.content || '{}';
    let extractedData;

    try {
      extractedData = JSON.parse(responseText);
    } catch (parseError) {
      // If JSON parsing fails, try to extract manually
      console.error('Failed to parse Groq response:', responseText);
      return NextResponse.json(
        { error: 'Failed to extract lease information. Please check the document format.', code: 'EXTRACTION_FAILED' },
        { status: 500 }
      );
    }

    // Validate and format the extracted data
    const result = {
      startDate: extractedData.startDate || null,
      endDate: extractedData.endDate || null,
      rentAmount: extractedData.rentAmount ? parseFloat(String(extractedData.rentAmount)) : null,
    };

    // Validate dates
    if (result.startDate && !/^\d{4}-\d{2}-\d{2}$/.test(result.startDate)) {
      result.startDate = null;
    }
    if (result.endDate && !/^\d{4}-\d{2}-\d{2}$/.test(result.endDate)) {
      result.endDate = null;
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Lease information extracted successfully',
    }, { status: 200 });

  } catch (error) {
    console.error('Lease extraction error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Handle specific Groq API errors
    if (errorMessage.includes('API key')) {
      return NextResponse.json(
        { error: 'AI service authentication failed. Please check API configuration.', code: 'AI_AUTH_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to extract lease information: ' + errorMessage, code: 'EXTRACTION_ERROR' },
      { status: 500 }
    );
  }
}

