import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/api-auth';
import { db } from '@/db';
import { leads } from '@/db/schema-postgres';
import { eq, and, desc, or, like, sql } from 'drizzle-orm';
import { logActivity } from '@/lib/audit-log';

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

// Valid statuses for leads
const VALID_STATUSES = ['inquiry', 'viewing', 'application', 'signed', 'archived'];
const VALID_SOURCES = ['zameen', 'olx', 'referral', 'website', 'other', 'bayut', 'propertyfinder', 'dubizzle', 'propsearch', 'zillow', 'realtor'];

// GET - Fetch all leads for the current user
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
    const status = searchParams.get('status');
    const source = searchParams.get('source');
    const search = searchParams.get('search');

    // Build query conditions
    const conditions = [eq(leads.userId, user.id)];

    if (status && VALID_STATUSES.includes(status)) {
      conditions.push(eq(leads.status, status));
    }

    if (source && VALID_SOURCES.includes(source)) {
      conditions.push(eq(leads.source, source));
    }

    if (search) {
      const searchTerm = `%${search}%`;
      conditions.push(
        or(
          like(leads.name, searchTerm),
          like(leads.phone, searchTerm),
          sql`COALESCE(${leads.email}, '') LIKE ${searchTerm}`,
          sql`COALESCE(${leads.preferredLocation}, '') LIKE ${searchTerm}`
        )!
      );
    }

    const allLeads = await db
      .select()
      .from(leads)
      .where(and(...conditions))
      .orderBy(desc(leads.createdAt));

    return NextResponse.json(allLeads, { status: 200 });
  } catch (error) {
    console.error('GET leads error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// POST - Create a new lead
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

    // Validate required fields
    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { error: 'Name is required', code: 'MISSING_NAME' },
        { status: 400 }
      );
    }

    if (!body.phone || !body.phone.trim()) {
      return NextResponse.json(
        { error: 'Phone is required', code: 'MISSING_PHONE' },
        { status: 400 }
      );
    }

    if (!body.source || !VALID_SOURCES.includes(body.source)) {
      return NextResponse.json(
        { error: `Source must be one of: ${VALID_SOURCES.join(', ')}`, code: 'INVALID_SOURCE' },
        { status: 400 }
      );
    }

    // Set default status if not provided
    const status = body.status && VALID_STATUSES.includes(body.status) 
      ? body.status 
      : 'inquiry';

    const newLead = await db
      .insert(leads)
      .values({
        userId: user.id,
        name: body.name.trim(),
        phone: body.phone.trim(),
        email: body.email?.trim() || null,
        budget: body.budget ? parseFloat(String(body.budget)) : null,
        preferredLocation: body.preferredLocation?.trim() || null,
        source: body.source,
        status: status,
        notes: body.notes?.trim() || null,
        propertyId: body.propertyId ? parseInt(String(body.propertyId)) : null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    const createdLead = newLead[0];

    // Log activity
    try {
      await logActivity('create', 'lead', `Created new lead: ${createdLead.name}`, createdLead.id, {
        source: createdLead.source,
        status: createdLead.status,
      });
    } catch (logError) {
      // Silently fail
    }

    return NextResponse.json(createdLead, { status: 201 });
  } catch (error) {
    console.error('POST leads error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// PUT - Update a lead
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Lead ID is required', code: 'MISSING_ID' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Verify ownership
    const existingLead = await db
      .select()
      .from(leads)
      .where(and(eq(leads.id, parseInt(id)), eq(leads.userId, user.id)))
      .limit(1);

    if (existingLead.length === 0) {
      return NextResponse.json(
        { error: 'Lead not found or unauthorized', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Build update object
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.phone !== undefined) updateData.phone = body.phone.trim();
    if (body.email !== undefined) updateData.email = body.email?.trim() || null;
    if (body.budget !== undefined) updateData.budget = body.budget ? parseFloat(String(body.budget)) : null;
    if (body.preferredLocation !== undefined) updateData.preferredLocation = body.preferredLocation?.trim() || null;
    if (body.source !== undefined) {
      if (!VALID_SOURCES.includes(body.source)) {
        return NextResponse.json(
          { error: `Source must be one of: ${VALID_SOURCES.join(', ')}`, code: 'INVALID_SOURCE' },
          { status: 400 }
        );
      }
      updateData.source = body.source;
    }
    if (body.status !== undefined) {
      if (!VALID_STATUSES.includes(body.status)) {
        return NextResponse.json(
          { error: `Status must be one of: ${VALID_STATUSES.join(', ')}`, code: 'INVALID_STATUS' },
          { status: 400 }
        );
      }
      updateData.status = body.status;
    }
    if (body.notes !== undefined) updateData.notes = body.notes?.trim() || null;
    if (body.propertyId !== undefined) updateData.propertyId = body.propertyId ? parseInt(String(body.propertyId)) : null;

    const updatedLead = await db
      .update(leads)
      .set(updateData)
      .where(and(eq(leads.id, parseInt(id)), eq(leads.userId, user.id)))
      .returning();

    const updated = updatedLead[0];

    // Log activity if status changed
    if (body.status && existingLead[0].status !== body.status) {
      try {
        await logActivity('update', 'lead', `Updated lead ${updated.name}: Status changed`, updated.id, {
          oldStatus: existingLead[0].status,
          newStatus: body.status,
        });
      } catch (logError) {
        // Silently fail
      }
    }

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error('PUT leads error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// DELETE - Delete a lead
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Lead ID is required', code: 'MISSING_ID' },
        { status: 400 }
      );
    }

    // Verify ownership and delete
    const deletedLead = await db
      .delete(leads)
      .where(and(eq(leads.id, parseInt(id)), eq(leads.userId, user.id)))
      .returning();

    if (deletedLead.length === 0) {
      return NextResponse.json(
        { error: 'Lead not found or unauthorized', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const deletedLeadName = deletedLead[0].name;

    // Log activity
    try {
      await logActivity('delete', 'lead', `Deleted lead: ${deletedLeadName}`, parseInt(id));
    } catch (logError) {
      // Silently fail
    }

    return NextResponse.json({ success: true, message: 'Lead deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('DELETE leads error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

