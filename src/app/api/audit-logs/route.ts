import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { auditLogs } from '@/db/schema-postgres';
import { getAuthenticatedUser } from '@/lib/api-auth';
import { desc, eq } from 'drizzle-orm';

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

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 50);

    const logs = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.userId, user.id))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);

    return NextResponse.json(logs, { status: 200 });
  } catch (error) {
    console.error('GET audit logs error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, entityType, entityId, description, metadata } = body;

    if (!action || !entityType || !description) {
      return NextResponse.json(
        { error: 'Missing required fields', code: 'MISSING_FIELDS' },
        { status: 400 }
      );
    }

    const newLog = await db
      .insert(auditLogs)
      .values({
        userId: user.id,
        action,
        entityType,
        entityId: entityId || null,
        description,
        metadata: metadata || null,
        createdAt: new Date(),
      })
      .returning();

    return NextResponse.json(newLog[0], { status: 201 });
  } catch (error) {
    console.error('POST audit log error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

