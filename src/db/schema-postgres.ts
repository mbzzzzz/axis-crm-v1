import { pgTable, serial, text, real, integer, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Application tables - Using text userId to reference Clerk user ID
export const properties = pgTable('properties', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(), // Clerk user ID
  title: text('title').notNull(),
  description: text('description'),
  address: text('address').notNull(),
  city: text('city').notNull(),
  state: text('state').notNull(),
  zipCode: text('zip_code').notNull(),
  propertyType: text('property_type').notNull(), // 'residential', 'commercial', 'land', 'multi_family'
  status: text('status').notNull(), // 'available', 'under_contract', 'sold', 'rented', 'pending'
  price: real('price').notNull(),
  currency: text('currency').default('USD'), // Currency code: USD, INR, EUR, etc.
  sizeSqft: integer('size_sqft'),
  bedrooms: integer('bedrooms'),
  bathrooms: real('bathrooms'),
  yearBuilt: integer('year_built'),
  amenities: jsonb('amenities'),
  images: jsonb('images'),
  purchasePrice: real('purchase_price'),
  estimatedValue: real('estimated_value'),
  monthlyExpenses: real('monthly_expenses'),
  commissionRate: real('commission_rate'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const invoices = pgTable('invoices', {
  id: serial('id').primaryKey(),
  invoiceNumber: text('invoice_number').notNull().unique(),
  propertyId: integer('property_id').references(() => properties.id, { onDelete: 'cascade' }).notNull(),
  userId: text('user_id').notNull(), // Clerk user ID
  clientName: text('client_name').notNull(),
  clientEmail: text('client_email').notNull(),
  clientAddress: text('client_address'),
  invoiceDate: text('invoice_date').notNull(),
  dueDate: text('due_date').notNull(),
  subtotal: real('subtotal').notNull(),
  taxRate: real('tax_rate').notNull(),
  taxAmount: real('tax_amount').notNull(),
  totalAmount: real('total_amount').notNull(),
  paymentStatus: text('payment_status').notNull(), // 'draft', 'sent', 'paid', 'overdue', 'cancelled'
  paymentDate: text('payment_date'),
  notes: text('notes'),
  items: jsonb('items'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const tenants = pgTable('tenants', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(), // Clerk user ID
  propertyId: integer('property_id').references(() => properties.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  leaseStart: text('lease_start').notNull(),
  leaseEnd: text('lease_end').notNull(),
  leaseStatus: text('lease_status').notNull(), // 'active', 'expired', 'pending'
  monthlyRent: real('monthly_rent'),
  deposit: real('deposit'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const maintenanceRequests = pgTable('maintenance_requests', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(), // Clerk user ID
  propertyId: integer('property_id').references(() => properties.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  description: text('description').notNull(),
  urgency: text('urgency').notNull(), // 'high', 'medium', 'low'
  status: text('status').notNull(), // 'open', 'in_progress', 'closed'
  location: text('location'),
  reportedDate: text('reported_date').notNull(),
  completedDate: text('completed_date'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const userPreferences = pgTable('user_preferences', {
  id: serial('id').primaryKey(),
  userId: text('user_id').unique().notNull(),
  cardTheme: text('card_theme').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const propertiesRelations = relations(properties, ({ many }) => ({
  invoices: many(invoices),
  tenants: many(tenants),
  maintenanceRequests: many(maintenanceRequests),
}));

export const invoicesRelations = relations(invoices, ({ one }) => ({
  property: one(properties, {
    fields: [invoices.propertyId],
    references: [properties.id],
  }),
}));

export const tenantsRelations = relations(tenants, ({ one }) => ({
  property: one(properties, {
    fields: [tenants.propertyId],
    references: [properties.id],
  }),
}));

export const maintenanceRequestsRelations = relations(maintenanceRequests, ({ one }) => ({
  property: one(properties, {
    fields: [maintenanceRequests.propertyId],
    references: [properties.id],
  }),
}));

