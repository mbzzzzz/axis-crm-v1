import { pgTable, serial, text, real, integer, timestamp, jsonb, uuid, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Application tables - Using text userId to reference Supabase Auth user ID
export const properties = pgTable('properties', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(), // Supabase Auth user ID
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
  tenantId: integer('tenant_id').references(() => tenants.id, { onDelete: 'set null' }), // Link to tenant
  userId: text('user_id').notNull(), // Supabase Auth user ID
  clientName: text('client_name').notNull(),
  clientEmail: text('client_email').notNull(),
  clientAddress: text('client_address'),
  clientPhone: text('client_phone'),
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
  // Branding fields
  logoMode: text('logo_mode').default('text'),
  logoDataUrl: text('logo_data_url'),
  logoWidth: integer('logo_width').default(40),
  companyName: text('company_name').default('AXIS CRM'),
  companyTagline: text('company_tagline').default('Real Estate Management'),
  // Additional fields
  agentName: text('agent_name'),
  agentAgency: text('agent_agency'),
  agentEmail: text('agent_email'),
  agentPhone: text('agent_phone'),
  ownerName: text('owner_name'),
  ownerEmail: text('owner_email'),
  ownerPhone: text('owner_phone'),
  paymentTerms: text('payment_terms'),
  lateFeePolicy: text('late_fee_policy'),
  // Late fee fields
  lateFeeAmount: real('late_fee_amount').default(0),
  lateFeeAppliedAt: timestamp('late_fee_applied_at'),
  // Currency field - uses property currency by default
  currency: text('currency').default('USD'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const tenants = pgTable('tenants', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(), // Supabase Auth user ID
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
  lateFeePolicyId: integer('late_fee_policy_id'), // Reference to lateFeePolicies table
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const vendors = pgTable('vendors', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  role: text('role'),
  email: text('email'),
  phone: text('phone'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const maintenanceRequests = pgTable('maintenance_requests', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(), // Supabase Auth user ID
  propertyId: integer('property_id').references(() => properties.id, { onDelete: 'set null' }),
  vendorId: uuid('vendor_id').references(() => vendors.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  description: text('description').notNull(),
  urgency: text('urgency').notNull(), // 'high', 'medium', 'low'
  status: text('status').notNull(), // 'open', 'in_progress', 'closed'
  cost: real('cost'),
  location: text('location'),
  reportedDate: text('reported_date').notNull(),
  completedDate: text('completed_date'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const expenses = pgTable('expenses', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull(),
  propertyId: integer('property_id').references(() => properties.id, { onDelete: 'cascade' }).notNull(),
  vendorId: uuid('vendor_id').references(() => vendors.id, { onDelete: 'set null' }),
  ticketId: integer('ticket_id').references(() => maintenanceRequests.id, { onDelete: 'set null' }),
  amount: real('amount').notNull(),
  description: text('description'),
  date: timestamp('date').notNull(),
  category: text('category').notNull(),
  receiptUrl: text('receipt_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const documents = pgTable('documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull(),
  propertyId: integer('property_id').references(() => properties.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  type: text('type').notNull(),
  fileUrl: text('file_url').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const userPreferences = pgTable('user_preferences', {
  id: serial('id').primaryKey(),
  userId: text('user_id').unique().notNull(),
  cardTheme: text('card_theme').notNull(),
  planKey: text('plan_key').default('professional').notNull(),
  agentName: text('agent_name'),
  agentAgency: text('agent_agency'),
  organizationName: text('organization_name'),
  companyTagline: text('company_tagline'),
  defaultInvoiceLogoMode: text('default_invoice_logo_mode').default('text'),
  defaultInvoiceLogoDataUrl: text('default_invoice_logo_data_url'),
  defaultInvoiceLogoWidth: integer('default_invoice_logo_width').default(40),
  heardAbout: text('heard_about'),
  onboardingCompletedAt: timestamp('onboarding_completed_at'),
  // Integrations
  gmailRefreshToken: text('gmail_refresh_token'),
  gmailConnectedAt: timestamp('gmail_connected_at'),
  gmailEmail: text('gmail_email'),
  // WhatsApp Cloud API
  whatsappPhoneNumberId: text('whatsapp_phone_number_id'),
  whatsappAccessToken: text('whatsapp_access_token'),
  whatsappBusinessAccountId: text('whatsapp_business_account_id'),
  whatsappConnectedAt: timestamp('whatsapp_connected_at'),
  whatsappPhoneNumber: text('whatsapp_phone_number'),
  // Paddle Subscription
  paddleSubscriptionId: text('paddle_subscription_id'),
  paddleCustomerId: text('paddle_customer_id'),
  paddlePriceId: text('paddle_price_id'),
  subscriptionStatus: text('subscription_status').default('inactive'), // 'active', 'inactive', 'canceled', 'past_due'
  subscriptionUpdatedAt: timestamp('subscription_updated_at'),
  extensionToken: text('extension_token'), // API token for browser extensions
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const usageLimits = pgTable(
  'usage_limits',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id').notNull(),
    feature: text('feature').notNull(),
    periodStart: timestamp('period_start', { withTimezone: true }).notNull(),
    usageCount: integer('usage_count').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userFeaturePeriodUnique: uniqueIndex('usage_limits_user_feature_period').on(
      table.userId,
      table.feature,
      table.periodStart
    ),
    userFeatureIdx: index('usage_limits_user_feature_idx').on(table.userId, table.feature),
  })
);

export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(), // Supabase Auth user ID
  action: text('action').notNull(), // 'create', 'update', 'delete'
  entityType: text('entity_type').notNull(), // 'property', 'tenant', 'invoice', etc.
  entityId: integer('entity_id'),
  description: text('description').notNull(), // Human-readable description
  metadata: jsonb('metadata'), // Additional data (old values, new values, etc.)
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const leads = pgTable('leads', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(), // Supabase Auth user ID
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  email: text('email'),
  budget: real('budget'),
  preferredLocation: text('preferred_location'),
  source: text('source').notNull(), // 'zameen', 'olx', 'referral', 'website', 'other'
  status: text('status').notNull(), // 'inquiry', 'viewing', 'application', 'signed', 'archived'
  notes: text('notes'),
  propertyId: integer('property_id').references(() => properties.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Tenant Portal Authentication
export const tenantAuth = pgTable('tenant_auth', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull().unique(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  isActive: integer('is_active').default(1).notNull(), // 1 = active, 0 = inactive
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Recurring Invoices
export const recurringInvoices = pgTable('recurring_invoices', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(), // Supabase Auth user ID
  tenantId: integer('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  propertyId: integer('property_id').references(() => properties.id, { onDelete: 'cascade' }).notNull(),
  invoiceTemplate: jsonb('invoice_template').notNull(), // Stores invoice structure (items, tax rate, notes, etc.)
  frequency: text('frequency').notNull(), // 'monthly', 'quarterly', 'yearly'
  dayOfMonth: integer('day_of_month').notNull(), // Day of month to generate (1-31)
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date'), // Optional end date
  isActive: integer('is_active').default(1).notNull(), // 1 = active, 0 = paused
  lastGeneratedAt: timestamp('last_generated_at'),
  nextGenerationDate: timestamp('next_generation_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Late Fee Policies
export const lateFeePolicies = pgTable('late_fee_policies', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(), // Supabase Auth user ID
  name: text('name').notNull(),
  type: text('type').notNull(), // 'flat' or 'percentage'
  gracePeriodDays: integer('grace_period_days').default(0).notNull(), // Days after due date before late fee applies
  amount: real('amount'), // Flat fee amount (if type is 'flat')
  percentage: real('percentage'), // Percentage of rent (if type is 'percentage')
  maxCap: real('max_cap'), // Maximum late fee cap (optional)
  isDefault: integer('is_default').default(0).notNull(), // 1 = default policy for user, 0 = custom
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Leases
export const leases = pgTable('leases', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(), // Supabase Auth user ID
  tenantId: integer('tenant_id').references(() => tenants.id, { onDelete: 'set null' }).notNull(),
  propertyId: integer('property_id').references(() => properties.id, { onDelete: 'cascade' }).notNull(),
  leaseType: text('lease_type').notNull(), // 'residential', 'commercial'
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  monthlyRent: real('monthly_rent').notNull(),
  deposit: real('deposit'),
  terms: jsonb('terms'), // Custom lease terms stored as JSON
  status: text('status').notNull(), // 'draft', 'pending_signature', 'active', 'expired', 'renewed', 'terminated'
  signedByTenant: integer('signed_by_tenant').default(0).notNull(), // 1 = signed, 0 = not signed
  signedByOwner: integer('signed_by_owner').default(0).notNull(), // 1 = signed, 0 = not signed
  signedAt: timestamp('signed_at'), // Date when both parties signed
  documentUrl: text('document_url'), // URL to signed lease PDF in Supabase Storage
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const propertiesRelations = relations(properties, ({ many }) => ({
  invoices: many(invoices),
  tenants: many(tenants),
  maintenanceRequests: many(maintenanceRequests),
  expenses: many(expenses),
  documents: many(documents),
}));

export const invoicesRelations = relations(invoices, ({ one }) => ({
  property: one(properties, {
    fields: [invoices.propertyId],
    references: [properties.id],
  }),
  tenant: one(tenants, {
    fields: [invoices.tenantId],
    references: [tenants.id],
  }),
}));

export const tenantsRelations = relations(tenants, ({ one, many }) => ({
  property: one(properties, {
    fields: [tenants.propertyId],
    references: [properties.id],
  }),
  invoices: many(invoices),
  leases: many(leases),
  recurringInvoices: many(recurringInvoices),
  tenantAuth: one(tenantAuth, {
    fields: [tenants.id],
    references: [tenantAuth.tenantId],
  }),
}));

export const maintenanceRequestsRelations = relations(maintenanceRequests, ({ one, many }) => ({
  property: one(properties, {
    fields: [maintenanceRequests.propertyId],
    references: [properties.id],
  }),
  vendor: one(vendors, {
    fields: [maintenanceRequests.vendorId],
    references: [vendors.id],
  }),
  expenses: many(expenses),
}));

export const vendorsRelations = relations(vendors, ({ many }) => ({
  expenses: many(expenses),
  maintenanceRequests: many(maintenanceRequests),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  property: one(properties, {
    fields: [expenses.propertyId],
    references: [properties.id],
  }),
  vendor: one(vendors, {
    fields: [expenses.vendorId],
    references: [vendors.id],
  }),
  ticket: one(maintenanceRequests, {
    fields: [expenses.ticketId],
    references: [maintenanceRequests.id],
  }),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  property: one(properties, {
    fields: [documents.propertyId],
    references: [properties.id],
  }),
}));

export const leasesRelations = relations(leases, ({ one }) => ({
  property: one(properties, {
    fields: [leases.propertyId],
    references: [properties.id],
  }),
  tenant: one(tenants, {
    fields: [leases.tenantId],
    references: [tenants.id],
  }),
}));

export const recurringInvoicesRelations = relations(recurringInvoices, ({ one }) => ({
  tenant: one(tenants, {
    fields: [recurringInvoices.tenantId],
    references: [tenants.id],
  }),
  property: one(properties, {
    fields: [recurringInvoices.propertyId],
    references: [properties.id],
  }),
}));

export const tenantAuthRelations = relations(tenantAuth, ({ one }) => ({
  tenant: one(tenants, {
    fields: [tenantAuth.tenantId],
    references: [tenants.id],
  }),
}));

