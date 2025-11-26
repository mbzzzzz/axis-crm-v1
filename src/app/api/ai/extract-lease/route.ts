import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/api-auth';
import Groq from 'groq-sdk';

// Helper function to get current authenticated user
async function getCurrentUser() {
  const user = await getAuthenticatedUser();
  if (!user) return null;
  return {
    id: user.id,
    name: (user.user_metadata.full_name as string) || user.email || 'User',
    email: user.email || '',
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

    // Dynamically import pdf-parse (CommonJS module) to avoid ESM export issues
    const pdfModule = await import('pdf-parse');
    const pdf = (pdfModule as any).default || pdfModule;

    // Extract text from PDF
    const arrayBuffer = await file.arrayBuffer();
    const pdfBuffer = Buffer.from(arrayBuffer);
    let pdfText: string;
    
    try {
      const pdfData = await pdf(pdfBuffer);
      pdfText = pdfData.text;
      
      if (!pdfText || pdfText.trim().length === 0) {
        return NextResponse.json(
          { error: 'PDF appears to be empty or contains only images. Please ensure the PDF has extractable text.', code: 'EMPTY_PDF' },
          { status: 400 }
        );
      }
    } catch (pdfError) {
      console.error('PDF parsing error:', pdfError);
      return NextResponse.json(
        { error: 'Failed to extract text from PDF. Please ensure the file is a valid PDF with extractable text.', code: 'PDF_PARSE_ERROR' },
        { status: 400 }
      );
    }

    // Use Groq to extract lease information from text
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are an AI assistant specialized in extracting information from lease documents. 
          Extract the following information from the provided lease document text:
          - Lease start date (format: YYYY-MM-DD)
          - Lease end date (format: YYYY-MM-DD)
          - Monthly rent amount (numeric value only, no currency symbols)
          
          Return ONLY a valid JSON object with these exact keys: startDate, endDate, rentAmount.
          If any information is not found, use null for that field.
          Example response: {"startDate": "2024-01-01", "endDate": "2024-12-31", "rentAmount": 50000}`,
        },
        {
          role: 'user',
          content: `Extract lease information from this lease document:\n\n${pdfText.substring(0, 10000)}`, // Limit to first 10k chars to avoid token limits
        },
      ],
      model: 'llama-3.1-70b-versatile', // Groq's versatile model (updated from decommissioned vision model)
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

