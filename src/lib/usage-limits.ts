import { db } from "@/db";
import { usageLimits, userPreferences } from "@/db/schema-postgres";
import { and, eq } from "drizzle-orm";
import {
  FEATURE_LABELS,
  PLAN_DEFINITIONS,
  PlanKey,
  UsageFeature,
  getPlanDefinition,
  isPlanKey,
} from "./plan-limits";

const PERIOD_CACHE = new Map<string, Date>();

const featureUpgradeHint: Record<UsageFeature, string> = {
  autoGenerations: "Upgrade to unlock more AI credits this month.",
  propertyPosts: "Upgrade to publish additional listings.",
  leads: "Upgrade to capture more leads.",
  monthlyInvoices: "Upgrade to send more invoices this month.",
};

export class UsageLimitError extends Error {
  readonly feature: UsageFeature;
  readonly planKey: PlanKey;
  readonly limit: number | null;

  constructor(feature: UsageFeature, planKey: PlanKey, limit: number | null) {
    const label = FEATURE_LABELS[feature];
    const planName = PLAN_DEFINITIONS[planKey].label;
    const limitText = limit === null ? "unlimited" : limit.toLocaleString();
    const message =
      limit === null
        ? `${label} are unlimited on the ${planName} plan.`
        : `The ${planName} plan allows ${limitText} ${label} per billing period. You've reached the limit.`;
    super(message);
    this.feature = feature;
    this.planKey = planKey;
    this.limit = limit;
  }

  toResponseBody() {
    const plan = PLAN_DEFINITIONS[this.planKey];
    return {
      error: this.message,
      code: "PLAN_LIMIT_REACHED",
      feature: this.feature,
      plan: {
        key: this.planKey,
        name: plan.label,
        description: plan.description,
        limit: this.limit,
      },
      suggestion: featureUpgradeHint[this.feature],
    };
  }
}

function getCurrentPeriodStart(): Date {
  const cacheKey = `${new Date().getUTCFullYear()}-${new Date().getUTCMonth()}`;
  const cached = PERIOD_CACHE.get(cacheKey);
  if (cached) return cached;
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
  PERIOD_CACHE.clear();
  PERIOD_CACHE.set(cacheKey, start);
  return start;
}

async function resolvePlanKey(userId: string): Promise<PlanKey> {
  const result = await db
    .select({ planKey: userPreferences.planKey })
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);

  const planKey = result[0]?.planKey;
  if (isPlanKey(planKey)) {
    return planKey;
  }
  // Default to free tier (our competitive advantage - free property posting)
  return "free";
}

export async function consumePlanQuota(userId: string, feature: UsageFeature) {
  const planKey = await resolvePlanKey(userId);
  const plan = getPlanDefinition(planKey);
  const limit = plan.limits[feature];
  if (limit === null) {
    return;
  }

  const periodStart = getCurrentPeriodStart();

  await db.transaction(async (tx) => {
    const existing = await tx
      .select({
        id: usageLimits.id,
        usageCount: usageLimits.usageCount,
      })
      .from(usageLimits)
      .where(
        and(
          eq(usageLimits.userId, userId),
          eq(usageLimits.feature, feature),
          eq(usageLimits.periodStart, periodStart)
        )
      )
      .limit(1);

    if (!existing.length) {
      if (limit <= 0) {
        throw new UsageLimitError(feature, planKey, limit);
      }
      await tx.insert(usageLimits).values({
        userId,
        feature,
        periodStart,
        usageCount: 1,
      });
      return;
    }

    const current = existing[0];
    if (current.usageCount >= limit) {
      throw new UsageLimitError(feature, planKey, limit);
    }

    await tx
      .update(usageLimits)
      .set({
        usageCount: current.usageCount + 1,
        updatedAt: new Date(),
      })
      .where(eq(usageLimits.id, current.id));
  });
}

