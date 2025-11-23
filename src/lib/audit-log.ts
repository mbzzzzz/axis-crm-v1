export type AuditAction = 'create' | 'update' | 'delete';
export type EntityType = 'property' | 'tenant' | 'invoice' | 'maintenance_request' | 'lead';

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

