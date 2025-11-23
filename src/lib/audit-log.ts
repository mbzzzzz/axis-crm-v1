import { currentUser } from '@clerk/nextjs/server';

export type AuditAction = 'create' | 'update' | 'delete';
export type EntityType = 'property' | 'tenant' | 'invoice' | 'maintenance_request';

interface AuditLogMetadata {
  [key: string]: any;
}

export async function logActivity(
  action: AuditAction,
  entityType: EntityType,
  description: string,
  entityId?: number,
  metadata?: AuditLogMetadata
) {
  try {
    const user = await currentUser();
    if (!user) return; // Skip logging if user not authenticated

    // Call API to log activity
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

