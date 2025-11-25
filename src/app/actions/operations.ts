'use server';

import { currentUser } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';

import { db } from '@/db';
import {
  documents,
  expenses,
  maintenanceRequests,
  properties,
  vendors,
} from '@/db/schema-postgres';

type CreateVendorInput = {
  name: string;
  role?: string | null;
  email?: string | null;
  phone?: string | null;
};

type CloseTicketExpenseInput = {
  amount: number;
  description?: string | null;
  date: string | Date;
  category: string;
  receiptUrl?: string | null;
  vendorId?: string | null;
  propertyId?: number | null;
};

export async function createVendor(data: CreateVendorInput) {
  const user = await currentUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  if (!data?.name) {
    throw new Error('Vendor name is required');
  }

  const [vendor] = await db
    .insert(vendors)
    .values({
      userId: user.id,
      name: data.name.trim(),
      role: data.role?.trim() || null,
      email: data.email?.trim().toLowerCase() || null,
      phone: data.phone?.trim() || null,
    })
    .returning();

  return vendor;
}

export async function closeTicketWithExpense(
  ticketId: number,
  expenseData: CloseTicketExpenseInput,
) {
  const user = await currentUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  if (!ticketId) {
    throw new Error('Ticket id is required');
  }

  if (!expenseData?.amount || !expenseData?.category || !expenseData?.date) {
    throw new Error('Expense amount, category, and date are required');
  }

  const ticket = await db.query.maintenanceRequests.findFirst({
    where: and(
      eq(maintenanceRequests.id, ticketId),
      eq(maintenanceRequests.userId, user.id),
    ),
  });

  if (!ticket) {
    throw new Error('Maintenance ticket not found');
  }

  const resolvedVendorId = expenseData.vendorId ?? ticket.vendorId ?? null;

  if (resolvedVendorId) {
    const vendor = await db.query.vendors.findFirst({
      where: and(eq(vendors.id, resolvedVendorId), eq(vendors.userId, user.id)),
    });

    if (!vendor) {
      throw new Error('Vendor not found for this user');
    }
  }

  const resolvedPropertyId = expenseData.propertyId ?? ticket.propertyId;

  if (!resolvedPropertyId) {
    throw new Error('A property is required to log an expense');
  }

  const property = await db.query.properties.findFirst({
    where: and(eq(properties.id, resolvedPropertyId), eq(properties.userId, user.id)),
  });

  if (!property) {
    throw new Error('Property not found for this user');
  }

  const expenseDate = new Date(expenseData.date);

  if (Number.isNaN(expenseDate.getTime())) {
    throw new Error('Expense date is invalid');
  }

  return db.transaction(async (tx) => {
    const completedAt = new Date();

    await tx
      .update(maintenanceRequests)
      .set({
        status: 'closed',
        vendorId: resolvedVendorId,
        cost: expenseData.amount,
        updatedAt: completedAt,
        completedDate: completedAt.toISOString(),
      })
      .where(and(eq(maintenanceRequests.id, ticketId), eq(maintenanceRequests.userId, user.id)));

    const [expense] = await tx
      .insert(expenses)
      .values({
        userId: user.id,
        propertyId: resolvedPropertyId,
        vendorId: resolvedVendorId,
        ticketId,
        amount: expenseData.amount,
        description: expenseData.description || null,
        date: expenseDate,
        category: expenseData.category,
        receiptUrl: expenseData.receiptUrl || null,
      })
      .returning();

    return expense;
  });
}

export async function saveGeneratedDocument(propertyId: number, fileUrl: string, type: string) {
  const user = await currentUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  if (!propertyId || !fileUrl || !type) {
    throw new Error('Property, file URL, and document type are required');
  }

  const property = await db.query.properties.findFirst({
    where: and(eq(properties.id, propertyId), eq(properties.userId, user.id)),
  });

  if (!property) {
    throw new Error('Property not found for this user');
  }

  const sanitizedType = type.trim();
  const derivedTitle = `${sanitizedType} for ${property.title}`.trim();

  const [document] = await db
    .insert(documents)
    .values({
      userId: user.id,
      propertyId,
      title: derivedTitle,
      type: sanitizedType,
      fileUrl,
    })
    .returning();

  return document;
}

