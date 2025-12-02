import { db } from '@/db';
import { auditLogs } from '@/db/schema-postgres';

export type AuditAction = 'create' | 'update' | 'delete';
export type EntityType = 'property' | 'tenant' | 'invoice' | 'maintenance_request' | 'lead';

interface AuditLogMetadata {
  [key: string]: any;
}

/**
 * Server-side function to log activity directly to the database
 * Use this in API routes where you have the user ID available
 */
export async function logActivityServer(
  userId: string,
  action: AuditAction,
  entityType: EntityType,
  description: string,
  entityId?: number,
  metadata?: AuditLogMetadata
) {
  try {
    await db
      .insert(auditLogs)
      .values({
        userId,
        action,
        entityType,
        entityId: entityId || null,
        description,
        metadata: metadata || null,
        createdAt: new Date(),
      });
  } catch (error) {
    // Silently fail - don't break the main flow if logging fails
    console.error('Failed to log activity:', error);
  }
}

/**
 * Client-side function to log activity via API
 * Use this in client components
 */
export async function logActivity(
  action: AuditAction,
  entityType: EntityType,
  description: string,
  entityId?: number,
  metadata?: AuditLogMetadata
) {
  try {
    // Call API to log activity - the API route will handle authentication
    await fetch('/api/audit-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        entityType,
        entityId,
        description,
        metadata,
      }),
    });
  } catch (error) {
    // Silently fail - don't break the main flow if logging fails
    console.error('Failed to log activity:', error);
  }
}

