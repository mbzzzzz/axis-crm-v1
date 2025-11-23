# Tenant Data Isolation & Maintenance Request Flow

## Overview
This document explains how tenant data isolation works and how maintenance requests flow from the tenant mobile app to the agent's web app.

## Data Isolation Rules

### 1. **Tenant Property Access**
- ✅ Tenants can **ONLY** see the property linked to their email in the `tenants` table
- ✅ The tenant's `propertyId` is verified via JWT token
- ✅ If a tenant has no `propertyId`, they receive an error: `NO_PROPERTY`
- ✅ If the property doesn't exist, they receive: `PROPERTY_NOT_FOUND`

**API Endpoint:** `GET /api/tenants/mobile?id={tenantId}`
- Verifies JWT token matches tenant ID
- Returns ONLY the tenant's assigned property
- Returns error if no property is assigned

### 2. **Maintenance Request Creation**
- ✅ Tenants can **ONLY** create maintenance requests for their assigned property
- ✅ The request is automatically linked to the tenant's `propertyId`
- ✅ The request's `userId` is set to the **property owner's userId** (the agent)
- ✅ This ensures the request appears in the agent's web app

**API Endpoint:** `POST /api/maintenance/mobile`
- Verifies JWT token
- Gets tenant's `propertyId` from database
- Gets property owner's `userId` from the property
- Creates request with:
  - `userId`: Property owner's userId (agent)
  - `propertyId`: Tenant's property ID
  - `status`: 'open'
  - `urgency`: 'medium'

### 3. **Maintenance Request Viewing (Tenant)**
- ✅ Tenants can **ONLY** see maintenance requests for their property
- ✅ Requests are filtered by `propertyId` matching the tenant's property

**API Endpoint:** `GET /api/maintenance/mobile?tenantId={tenantId}`
- Verifies JWT token matches tenant ID
- Gets tenant's `propertyId`
- Returns ONLY requests where `propertyId` matches

### 4. **Maintenance Request Viewing (Agent/Web App)**
- ✅ Agents see ALL maintenance requests for properties they own
- ✅ Requests are filtered by `userId` (property owner)
- ✅ This includes requests created by tenants (since `userId` = property owner)

**API Endpoint:** `GET /api/maintenance?propertyId={propertyId}`
- Uses Clerk authentication (agent's userId)
- Filters by `userId` = agent's Clerk ID
- Returns all requests for properties owned by the agent

## Flow Diagram

```
┌─────────────────┐
│  Tenant Mobile  │
│      App        │
└────────┬────────┘
         │
         │ 1. Login with email
         │    → JWT token issued
         │
         │ 2. View Property
         │    GET /api/tenants/mobile?id={id}
         │    → Returns ONLY tenant's property
         │
         │ 3. View Maintenance Requests
         │    GET /api/maintenance/mobile?tenantId={id}
         │    → Returns ONLY requests for tenant's property
         │
         │ 4. Create Maintenance Request
         │    POST /api/maintenance/mobile
         │    → Creates request with:
         │       - userId: property owner (agent)
         │       - propertyId: tenant's property
         │
         ▼
┌─────────────────┐
│   Database      │
│                 │
│ maintenance_requests:
│ - userId: agent_id
│ - propertyId: tenant_property_id
│ - status: 'open'
└────────┬────────┘
         │
         │ 5. Agent views requests
         │    GET /api/maintenance
         │    → Filters by userId = agent_id
         │    → Shows ALL requests for agent's properties
         │
         ▼
┌─────────────────┐
│  Agent Web App  │
│   (Dashboard)   │
│                 │
│ Maintenance     │
│ Kanban Board    │
└─────────────────┘
```

## Security Features

### JWT Token Verification
- All mobile API endpoints verify JWT tokens
- Token contains: `tenantId`, `email`, `type: 'tenant'`
- Token expires in 30 days

### Property Ownership Verification
- Tenant's `propertyId` is verified against database
- Property must exist and be linked to tenant
- No cross-tenant property access possible

### Request Ownership
- Maintenance requests are created with property owner's `userId`
- This ensures requests appear in the correct agent's dashboard
- Agents can only see requests for properties they own

## Error Handling

### Tenant Mobile App
- **No Property Assigned**: Shows alert and redirects to login
- **Property Not Found**: Shows error message
- **Unauthorized**: Redirects to login screen

### API Responses
- `401 UNAUTHORIZED`: Invalid or missing JWT token
- `403 FORBIDDEN`: Tenant ID doesn't match token
- `404 NOT_FOUND`: Tenant or property not found
- `400 BAD_REQUEST`: Missing required fields or invalid data

## Testing Checklist

- [ ] Tenant can only see their assigned property
- [ ] Tenant cannot see other tenants' properties
- [ ] Tenant can only create requests for their property
- [ ] Tenant-created requests appear in agent's web app
- [ ] Agent sees all requests for their properties
- [ ] Agent cannot see requests for properties they don't own
- [ ] JWT token verification works correctly
- [ ] Error messages are user-friendly

## Database Schema

```sql
-- Tenants table
tenants (
  id,
  email,           -- Used for login
  propertyId,      -- Links to properties table
  ...
)

-- Properties table
properties (
  id,
  userId,          -- Clerk user ID (property owner/agent)
  ...
)

-- Maintenance requests table
maintenance_requests (
  id,
  userId,         -- Property owner's userId (agent)
  propertyId,     -- Property ID
  title,
  description,
  status,
  urgency,
  ...
)
```

## Key Points

1. **Tenants are isolated by property**: Each tenant can only access their assigned property
2. **Requests flow to agents**: Tenant-created requests use the property owner's `userId`, so they appear in the agent's dashboard
3. **JWT ensures security**: All mobile endpoints verify JWT tokens to prevent unauthorized access
4. **Property ownership determines visibility**: Agents see all requests for properties they own, including tenant-created ones

