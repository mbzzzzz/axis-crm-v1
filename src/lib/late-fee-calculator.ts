import { db } from '@/db';
import { lateFeePolicies, invoices, tenants } from '@/db/schema-postgres';
import { eq, and, lt } from 'drizzle-orm';

export interface LateFeePolicy {
  id: number;
  userId: string;
  name: string;
  type: 'flat' | 'percentage';
  gracePeriodDays: number;
  amount?: number | null;
  percentage?: number | null;
  maxCap?: number | null;
}

/**
 * Calculate late fee for an invoice based on policy
 */
export function calculateLateFee(
  invoiceAmount: number,
  daysOverdue: number,
  policy: LateFeePolicy
): number {
  if (daysOverdue <= policy.gracePeriodDays) {
    return 0;
  }

  let lateFee = 0;

  if (policy.type === 'flat') {
    lateFee = policy.amount || 0;
  } else if (policy.type === 'percentage') {
    const percentage = policy.percentage || 0;
    lateFee = invoiceAmount * (percentage / 100);
  }

  // Apply max cap if set
  if (policy.maxCap && lateFee > policy.maxCap) {
    lateFee = policy.maxCap;
  }

  return Math.max(0, lateFee);
}

/**
 * Get the applicable late fee policy for a tenant
 */
export async function getTenantLateFeePolicy(tenantId: number): Promise<LateFeePolicy | null> {
  try {
    const tenant = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (tenant.length === 0) {
      return null;
    }

    const tenantData = tenant[0];

    // If tenant has a specific policy, use it
    if (tenantData.lateFeePolicyId) {
      const policy = await db
        .select()
        .from(lateFeePolicies)
        .where(eq(lateFeePolicies.id, tenantData.lateFeePolicyId))
        .limit(1);

      if (policy.length > 0) {
        return policy[0] as LateFeePolicy;
      }
    }

    // Otherwise, get the default policy for the user
    const defaultPolicy = await db
      .select()
      .from(lateFeePolicies)
      .where(
        and(
          eq(lateFeePolicies.userId, tenantData.userId),
          eq(lateFeePolicies.isDefault, 1)
        )
      )
      .limit(1);

    if (defaultPolicy.length > 0) {
      return defaultPolicy[0] as LateFeePolicy;
    }

    return null;
  } catch (error) {
    console.error('Error getting tenant late fee policy:', error);
    return null;
  }
}

/**
 * Calculate days overdue for an invoice
 */
export function calculateDaysOverdue(dueDate: string): number {
  const due = new Date(dueDate);
  const now = new Date();
  const diffTime = now.getTime() - due.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/**
 * Check if an invoice should have late fee applied
 */
export function shouldApplyLateFee(
  invoice: { dueDate: string; paymentStatus: string; lateFeeAppliedAt: Date | null }
): boolean {
  // Don't apply if already paid or cancelled
  if (invoice.paymentStatus === 'paid' || invoice.paymentStatus === 'cancelled') {
    return false;
  }

  // Don't apply if already applied today
  if (invoice.lateFeeAppliedAt) {
    const appliedDate = new Date(invoice.lateFeeAppliedAt);
    const today = new Date();
    if (
      appliedDate.getDate() === today.getDate() &&
      appliedDate.getMonth() === today.getMonth() &&
      appliedDate.getFullYear() === today.getFullYear()
    ) {
      return false;
    }
  }

  const daysOverdue = calculateDaysOverdue(invoice.dueDate);
  return daysOverdue > 0;
}

