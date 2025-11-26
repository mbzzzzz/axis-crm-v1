import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { getAuthenticatedUser } from '@/lib/api-auth';

type DocumentPayload = {
  type: string;
  data?: Record<string, unknown>;
};

const PROMPT_TEMPLATES: Record<string, string> = {
  'late-rent-notice':
    'Write a firm but professional late rent notice addressed to the tenant. Include outstanding balance, late fees, and payment instructions.',
  'lease-renewal':
    'Draft a lease renewal offer summarizing new terms, rent adjustments, and next steps for the tenant.',
  'maintenance-completion':
    'Compose a maintenance completion summary that records work performed, vendor details, and next actions for the owner.',
};

const buildPrompt = (type: string, data?: Record<string, unknown>) => {
  const normalizedType = type.trim().toLowerCase();
  const base =
    PROMPT_TEMPLATES[normalizedType] ||
    `Create a formal real-estate document of type "${type}". Keep it concise, actionable, and ready to send to a tenant or owner.`;

  const serializedContext = data ? `\n\nContext:\n${JSON.stringify(data, null, 2)}` : '';

  return `${base}${serializedContext}`;
};

export async function POST(request: NextRequest) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: 'GROQ_API_KEY is not configured on the server' },
        { status: 500 },
      );
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as DocumentPayload | null;

    if (!body || !body.type) {
      return NextResponse.json(
        { error: 'Request body must include a document type' },
        { status: 400 },
      );
    }

    const prompt = buildPrompt(body.type, body.data);

    const completion = await groq.chat.completions.create({
      model: 'llama3-8b-8192',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
    });

    const content = completion.choices?.[0]?.message?.content?.trim();

    if (!content) {
      return NextResponse.json(
        { error: 'Document generation failed. No content returned from Groq.' },
        { status: 502 },
      );
    }

    return NextResponse.json({ content });
  } catch (error) {
    console.error('POST /api/generate-document error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : undefined },
      { status: 500 },
    );
  }
}

