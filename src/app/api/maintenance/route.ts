import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { maintenanceRequests, properties } from '@/db/schema';
import { eq, like, and, or, desc } from 'drizzle-orm';
import { currentUser } from '@clerk/nextjs/server';

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

const VALID_URGENCY_LEVELS = ['high', 'medium', 'low'];
const VALID_STATUSES = ['open', 'in_progress', 'closed'];

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
    const id = searchParams.get('id');

    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const request = await db
        .select()
        .from(maintenanceRequests)
        .where(
          and(
            eq(maintenanceRequests.id, parseInt(id)),
            eq(maintenanceRequests.userId, user.id)
          )
        )
        .limit(1);

      if (request.length === 0) {
        return NextResponse.json(
          { error: 'Maintenance request not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(request[0], { status: 200 });
    }

    const limit = Math.min(parseInt(searchParams.get('limit') ?? '100'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const urgency = searchParams.get('urgency');
    const propertyId = searchParams.get('propertyId');

    const conditions = [eq(maintenanceRequests.userId, user.id)];

    if (search) {
      conditions.push(
        or(
          like(maintenanceRequests.title, `%${search}%`),
          like(maintenanceRequests.description, `%${search}%`),
          like(maintenanceRequests.location, `%${search}%`)
        )
      );
    }

    if (status) {
      conditions.push(eq(maintenanceRequests.status, status));
    }

    if (urgency) {
      conditions.push(eq(maintenanceRequests.urgency, urgency));
    }

    if (propertyId) {
      const propertyIdInt = parseInt(propertyId);
      if (!isNaN(propertyIdInt)) {
        conditions.push(eq(maintenanceRequests.propertyId, propertyIdInt));
      }
    }

    const results = await db
      .select()
      .from(maintenanceRequests)
      .where(and(...conditions))
      .orderBy(desc(maintenanceRequests.reportedDate))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
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

    if (!body.title?.trim()) {
      return NextResponse.json(
        { error: 'Title is required', code: 'MISSING_TITLE' },
        { status: 400 }
      );
    }

    if (!body.description?.trim()) {
      return NextResponse.json(
        { error: 'Description is required', code: 'MISSING_DESCRIPTION' },
        { status: 400 }
      );
    }

    if (!body.urgency || !VALID_URGENCY_LEVELS.includes(body.urgency)) {
      return NextResponse.json(
        { error: `Urgency must be one of: ${VALID_URGENCY_LEVELS.join(', ')}`, code: 'INVALID_URGENCY' },
        { status: 400 }
      );
    }

    if (!body.status || !VALID_STATUSES.includes(body.status)) {
      return NextResponse.json(
        { error: `Status must be one of: ${VALID_STATUSES.join(', ')}`, code: 'INVALID_STATUS' },
        { status: 400 }
      );
    }

    if (body.propertyId) {
      const propertyIdInt = parseInt(body.propertyId);
      if (!isNaN(propertyIdInt)) {
        const propertyExists = await db
          .select()
          .from(properties)
          .where(
            and(
              eq(properties.id, propertyIdInt),
              eq(properties.userId, user.id)
            )
          )
          .limit(1);

        if (propertyExists.length === 0) {
          return NextResponse.json(
            { error: 'Property not found', code: 'PROPERTY_NOT_FOUND' },
            { status: 400 }
          );
        }
      }
    }

    const now = new Date().toISOString();
    const insertData: any = {
      userId: user.id,
      title: body.title.trim(),
      description: body.description.trim(),
      urgency: body.urgency,
      status: body.status,
      location: body.location?.trim() || null,
      reportedDate: body.reportedDate || now.split('T')[0],
      completedDate: body.completedDate || null,
      notes: body.notes?.trim() || null,
      createdAt: now,
      updatedAt: now,
    };

    if (body.propertyId) {
      const propertyIdInt = parseInt(body.propertyId);
      if (!isNaN(propertyIdInt)) {
        insertData.propertyId = propertyIdInt;
      }
    }

    const newRequest = await db.insert(maintenanceRequests).values(insertData).returning();

    return NextResponse.json(newRequest[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

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

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const existingRequest = await db
      .select()
      .from(maintenanceRequests)
      .where(
        and(
          eq(maintenanceRequests.id, parseInt(id)),
          eq(maintenanceRequests.userId, user.id)
        )
      )
      .limit(1);

    if (existingRequest.length === 0) {
      return NextResponse.json(
        { error: 'Maintenance request not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const updates: any = {
      updatedAt: new Date().toISOString(),
    };

    if (body.title !== undefined) {
      if (!body.title.trim()) {
        return NextResponse.json(
          { error: 'Title cannot be empty', code: 'INVALID_TITLE' },
          { status: 400 }
        );
      }
      updates.title = body.title.trim();
    }

    if (body.description !== undefined) {
      if (!body.description.trim()) {
        return NextResponse.json(
          { error: 'Description cannot be empty', code: 'INVALID_DESCRIPTION' },
          { status: 400 }
        );
      }
      updates.description = body.description.trim();
    }

    if (body.urgency !== undefined) {
      if (!VALID_URGENCY_LEVELS.includes(body.urgency)) {
        return NextResponse.json(
          { error: `Urgency must be one of: ${VALID_URGENCY_LEVELS.join(', ')}`, code: 'INVALID_URGENCY' },
          { status: 400 }
        );
      }
      updates.urgency = body.urgency;
    }

    if (body.status !== undefined) {
      if (!VALID_STATUSES.includes(body.status)) {
        return NextResponse.json(
          { error: `Status must be one of: ${VALID_STATUSES.join(', ')}`, code: 'INVALID_STATUS' },
          { status: 400 }
        );
      }
      updates.status = body.status;

      // Auto-set completedDate when status is closed
      if (body.status === 'closed' && !existingRequest[0].completedDate) {
        updates.completedDate = new Date().toISOString().split('T')[0];
      }
    }

    if (body.location !== undefined) {
      updates.location = body.location?.trim() || null;
    }

    if (body.reportedDate !== undefined) {
      updates.reportedDate = body.reportedDate;
    }

    if (body.completedDate !== undefined) {
      updates.completedDate = body.completedDate || null;
    }

    if (body.notes !== undefined) {
      updates.notes = body.notes?.trim() || null;
    }

    if (body.propertyId !== undefined) {
      if (body.propertyId === null) {
        updates.propertyId = null;
      } else {
        const propertyIdInt = parseInt(body.propertyId);
        if (!isNaN(propertyIdInt)) {
          const propertyExists = await db
            .select()
            .from(properties)
            .where(
              and(
                eq(properties.id, propertyIdInt),
                eq(properties.userId, user.id)
              )
            )
            .limit(1);

          if (propertyExists.length === 0) {
            return NextResponse.json(
              { error: 'Property not found', code: 'PROPERTY_NOT_FOUND' },
              { status: 400 }
            );
          }
          updates.propertyId = propertyIdInt;
        }
      }
    }

    const updatedRequest = await db
      .update(maintenanceRequests)
      .set(updates)
      .where(
        and(
          eq(maintenanceRequests.id, parseInt(id)),
          eq(maintenanceRequests.userId, user.id)
        )
      )
      .returning();

    return NextResponse.json(updatedRequest[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

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

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const existingRequest = await db
      .select()
      .from(maintenanceRequests)
      .where(
        and(
          eq(maintenanceRequests.id, parseInt(id)),
          eq(maintenanceRequests.userId, user.id)
        )
      )
      .limit(1);

    if (existingRequest.length === 0) {
      return NextResponse.json(
        { error: 'Maintenance request not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const deleted = await db
      .delete(maintenanceRequests)
      .where(
        and(
          eq(maintenanceRequests.id, parseInt(id)),
          eq(maintenanceRequests.userId, user.id)
        )
      )
      .returning();

    return NextResponse.json(
      {
        message: 'Maintenance request deleted successfully',
        request: deleted[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

